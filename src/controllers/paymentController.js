const { v4: uuidv4 } = require('uuid');
const ms = require('ms')
const { StudentCourse, Course, Payment, CourseModule, User, sequelize } = require("../models");
const { sendPaymentVerificationEmail, sendPaymentInitEmail } = require('../services/emailServices');
const { uploadToCloudinary } = require('../utils/cloudinaryUtil');
const { Op } = require('sequelize');
const createModuleProgress = require('./createModuleLessonProgress');
const { sendNotification } = require('./notificationController');

exports.initializePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const student_id = req.user?.user_id;
    const { course_id, amount, installment, payment_method } = req.body;

    if (!student_id) return res.status(401).json({ message: "Unauthorized" });
    if (!course_id || !amount) return res.status(400).json({ message: "course_id and amount required" });

    const course = await Course.findByPk(course_id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const modulesCount = await CourseModule.count({ where: { course_id } });

   
    let studentCourse = await StudentCourse.findOne({ where: { student_id, course_id } });
    if (!studentCourse) {
      studentCourse = await StudentCourse.create({
        student_id,
        course_id,
        total_modules: modulesCount,
        payment_type: installment ? "installment" : "full",
        payment_status: "pending",
        unlocked_modules: 0,
        paid_amount: 0
      }, { transaction: t });
    }

    
    let receiptUrl = null;
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      receiptUrl = uploaded.secure_url;
    }

  
    const reference = "PMT-" + uuidv4().split("-")[0].toUpperCase();

   
    const payment = await Payment.create({
      student_id,
      course_id,
      amount,
      payment_method,
      status: "awaiting_payment",
      reference,
      installment: !!installment,
      receipt: receiptUrl
    }, { transaction: t });

    
    const student = await User.findByPk(student_id);
    await sendPaymentInitEmail(student.email, course.title, amount, reference);

    await t.commit();
    return res.status(201).json({
      message: "Payment initialized. Awaiting admin verification.",
      payment,
      current_paid_amount: Number(studentCourse.paid_amount),
      unlocked_modules: studentCourse.unlocked_modules
    });

  } catch (err) {
    await t.rollback();
    console.error("Init payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.verifyPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { payment_id } = req.params;
    const { amount_verified } = req.body;

    const payment = await Payment.findByPk(payment_id, { transaction: t });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "completed") {
      return res.status(400).json({ message: "Payment already verified" });
    }

    const verifiedAmount = Number(amount_verified || payment.amount);

    await payment.update(
      { status: "completed", amount: verifiedAmount },
      { transaction: t }
    );

    const studentCourse = await StudentCourse.findOne({
      where: { student_id: payment.student_id, course_id: payment.course_id },
      transaction: t
    });

    if (!studentCourse)
      return res.status(404).json({ message: "Student not enrolled in this course" });

    const previouslyUnlocked = studentCourse.unlocked_modules;

    const course = await Course.findByPk(payment.course_id, { transaction: t });
    const totalModules = await CourseModule.count({
      where: { course_id: course.course_id },
      transaction: t
    });

    const allPayments = await Payment.findAll({
      where: {
        student_id: payment.student_id,
        course_id: payment.course_id,
        status: { [Op.in]: ["completed", "part_payment"] }
      },
      transaction: t
    });

    const totalPaid = allPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

  const coursePriceKobo = Math.round(Number(course.price) * 100);
const totalPaidKobo = Math.round(totalPaid * 100);


const pricePerModuleKobo = Math.ceil(coursePriceKobo / totalModules);

let unlockedModules = Math.floor(totalPaidKobo / pricePerModuleKobo);
unlockedModules = Math.min(unlockedModules, totalModules);

const currentlyUnlocked = unlockedModules;

    let nextDueDate = null;
    let paymentStatus =
      currentlyUnlocked >= totalModules ? "paid" : "part_payment";

    if (paymentStatus === "part_payment") {
      const now = new Date();
      if (course.duration) {
        const durationStr = course.duration.toLowerCase();
        if (durationStr.includes("day")) {
          nextDueDate = new Date(now.setDate(now.getDate() + parseInt(durationStr)));
        } else if (durationStr.includes("week")) {
          nextDueDate = new Date(now.setDate(now.getDate() + parseInt(durationStr) * 7));
        } else if (durationStr.includes("month")) {
          nextDueDate = new Date(now.setMonth(now.getMonth() + parseInt(durationStr)));
        } else {
          nextDueDate = new Date(now.setDate(now.getDate() + 14));
        }
      } else {
        nextDueDate = new Date(now.setDate(now.getDate() + 14));
      }
    }

    await studentCourse.update(
      {
        paid_amount: totalPaid,
        unlocked_modules: currentlyUnlocked,
        payment_status: paymentStatus
      },
      { transaction: t }
    );

   
    for (let moduleNum = previouslyUnlocked + 1; moduleNum <= currentlyUnlocked; moduleNum++) {
      await createModuleProgress(payment.student_id, payment.course_id, moduleNum);
    }

    if (nextDueDate) {
      await payment.update({ due_date: nextDueDate }, { transaction: t });
    }

    const student = await User.findByPk(payment.student_id, { transaction: t });
    await sendPaymentVerificationEmail(
      student.email,
      course.title,
      paymentStatus,
      currentlyUnlocked
    );



    await t.commit();

        await sendNotification({
  student_id: payment.student_id,
  title: "Course Enrollment Successful 🎉",
  message:
    paymentStatus === "paid"
      ? `Your payment for "${course.title}" is complete. All modules have been unlocked.`
      : `Your payment for "${course.title}" was verified. ${currentlyUnlocked} module(s) have been unlocked.`,
});

    return res.status(200).json({
      message: "Payment verified successfully",
      payment,
      total_paid: totalPaid,
      unlocked_modules: currentlyUnlocked,
      next_due_date: nextDueDate
    });
  } catch (err) {
    await t.rollback();
    console.error("Verify payment error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStudentPayments = async (req, res) => {
  try {
    const student_id = req.user?.user_id
    if (!student_id) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = { student_id };
    if (req.query.course_id) where.course_id = req.query.course_id;
    if (req.query.status) where.status = req.query.status;

    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Course, as: "course", attributes: ["course_id", "title", "price"] },
        {model: User, as: "student", attributes:["user_id", "full_name", "email"]}
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
      payments: rows,
    });
  } catch (err) {
    console.error("Get student payments error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    // optional admin guard: uncomment if you have an isAdmin flag
    // if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.course_id) where.course_id = req.query.course_id;
    if (req.query.student_id) where.student_id = req.query.student_id;
    if (req.query.status) where.status = req.query.status;

    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.createdAt[Op.lte] = new Date(req.query.to);
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: "student", attributes: ["user_id", "full_name", "email"] },
        { model: Course, as: "course", attributes: ["course_id", "title", "price"] }
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
      payments: rows,
    });
  } catch (err) {
    console.error("Get all payments error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment_id = req.params.payment_id || req.query.payment_id;
    if (!payment_id) return res.status(400).json({ message: "payment_id is required (path or query)." });

    const payment = await Payment.findByPk(payment_id, {
      include: [
        { model: User, as: "student", attributes: ["user_id", "full_name", "email"] },
        { model: Course, as: "course", attributes: ["course_id", "title", "price"] },
      ],
    });
    if (!payment) return res.status(404).json({ message: "Payment not found." });

    
    // const requesterId = req.user?.user_id;
    // if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
    // if (String(payment.student_id) !== String(requesterId)) {
    //   return res.status(403).json({ message: "Forbidden. Not the owner of this payment." });
    // }

    return res.status(200).json({ payment });
  } catch (err) {
    console.error("Get payment by id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRemainingBalance = async (req, res) => {
  try {
    const student_id = req.user?.user_id || req.query.user_id;
    const course_id = req.params.course_id || req.query.course_id;

    if (!student_id) return res.status(401).json({ message: "Unauthorized" });
    if (!course_id) return res.status(400).json({ message: "course_id is required (path or query)." });

   
    const course = await Course.findByPk(course_id, { attributes: ["course_id", "title", "price"] });
    if (!course) return res.status(404).json({ message: "Course not found." });

    
    const studentCourse = await StudentCourse.findOne({
      where: { student_id, course_id },
      attributes: ["student_course_id", "payment_status", "total_modules"],
    });
    if (!studentCourse) return res.status(404).json({ message: "Student not enrolled in this course." });

    
    const payments = await Payment.findAll({
      where: {
        student_id,
        course_id,
        status: { [Op.in]: ["completed", "part_payment"] },
      },
      attributes: ["amount", "status", "due_date", "installment"],
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPrice = Number(course.price || 0);
    const remainingAmount = Math.max(0, parseFloat((totalPrice - totalPaid).toFixed(2)));

    
    const totalModules = Number(studentCourse.total_modules || 0);
    const costPerModule = totalModules > 0 ? totalPrice / totalModules : 0;
    const unlockedModules = totalModules > 0 ? Math.min(Math.floor(totalPaid / costPerModule), totalModules) : 0;

    
    const latestPayment = payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    
    const nextDuePayment = payments
      .filter(p => p.status !== "completed" && p.installment)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] || null;

    return res.status(200).json({
      course: { course_id: course.course_id, title: course.title, total_price: totalPrice },
      studentCourse: {
        student_course_id: studentCourse.student_course_id,
        paid_amount: totalPaid,
        unlocked_modules: unlockedModules,
        payment_status: studentCourse.payment_status,
        total_modules: totalModules,
      },
      remaining_amount: remainingAmount,
      latest_payment: latestPayment,
      next_due_payment: nextDuePayment,
    });
  } catch (err) {
    console.error("Get remaining balance error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};