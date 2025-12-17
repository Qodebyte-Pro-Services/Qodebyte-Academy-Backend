
const { Certificate, Course, CourseModule, User, StudentModule, CourseLesson, StudentCourse, Progress } = require("../models");
const generateCourseCertificate = require("../utils/certHelperFunction");
const { sendNotification } = require("./notificationController");

exports.getMyCertificates = async (req, res) => {
  try {
    const student_id = req.user?.user_id;

    if (!student_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const certificates = await Certificate.findAll({
      where: { student_id },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "title"],
        },
        {
          model: CourseModule,
          as: "module",
          attributes: ["module_id", "title"],
        },
      ],
      order: [["issued_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Certificates fetched successfully",
      total: certificates.length,
      certificates,
    });
  } catch (err) {
    console.error("Get student certificates error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


exports.getCertificate = async (req, res) => {
  try {
    const certificate_id =
      req.params.certificate_id || req.query.certificate_id;

    if (!certificate_id) {
      return res
        .status(400)
        .json({ message: "certificate_id is required (path or query)." });
    }

    const cert = await Certificate.findByPk(certificate_id, {
      attributes: [
        "certificate_id",
        "certificate_type",
        "issued_at",
        "file_url",
      ],
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "name", "email"],
        },
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "title"],
        },
      ],
    });

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    if (!cert.file_url) {
      return res
        .status(404)
        .json({ message: "Certificate file not available yet." });
    }

    return res.status(200).json({
      message: "Certificate fetched successfully",
      certificate_id: cert.certificate_id,
      file_url: cert.file_url,
      certificate_type: cert.certificate_type,
      issued_at: cert.issued_at,
      student: cert.student,
      course: cert.course,
    });
  } catch (err) {
    console.error("Get certificate error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getCourseCertificates = async (req, res) => {
  try {
    const { course_id } = req.params;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    const certificates = await Certificate.findAll({
      where: {
        course_id,
        certificate_type: "course",
      },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "name", "email"],
        },
         { model: Course, as: "course", attributes: ["course_id", "title"] },
      ],
      order: [["issued_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Course certificates fetched successfully",
      total: certificates.length,
      certificates,
    });
  } catch (err) {
    console.error("Get course certificates error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


exports.generateMyCourseCertificate = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const course_id =
      req.params.course_id || req.query.course_id || req.body.course_id;

    if (!student_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    
    const enrollment = await StudentCourse.findOne({
      where: { student_id, course_id },
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
    }

   
    const existingCert = await Certificate.findOne({
      where: {
        student_id,
        course_id,
        certificate_type: "course",
      },
    });

    if (existingCert) {
      return res.status(200).json({
        message: "Certificate already generated",
        certificate: existingCert,
      });
    }

    
    const modules = await CourseModule.findAll({
      where: { course_id },
      attributes: ["module_id"],
      raw: true,
    });

    if (!modules.length) {
      return res
        .status(404)
        .json({ message: "No modules found for this course" });
    }

    const moduleIds = modules.map((m) => m.module_id);

   
    const lessons = await CourseLesson.findAll({
      where: { module_id: moduleIds },
      attributes: ["lesson_id", "module_id"],
      raw: true,
    });

    const progresses = await Progress.findAll({
      where: {
        student_id,
        lesson_id: lessons.map((l) => l.lesson_id),
        status: "completed",
      },
      attributes: ["lesson_id"],
      raw: true,
    });

    const completedLessonSet = new Set(progresses.map((p) => p.lesson_id));

    const bulkModuleUpdates = moduleIds.map((modId) => {
      const moduleLessons = lessons.filter(
        (l) => l.module_id === modId
      );
      const completedCount = moduleLessons.filter((l) =>
        completedLessonSet.has(l.lesson_id)
      ).length;

      return {
        student_id,
        module_id: modId,
        completed:
          moduleLessons.length > 0 &&
          completedCount === moduleLessons.length,
      };
    });

    await Promise.all(
      bulkModuleUpdates.map((data) => StudentModule.upsert(data))
    );

   
    const allModulesCompleted = bulkModuleUpdates.every(
      (m) => m.completed
    );

    if (!allModulesCompleted) {
      return res.status(400).json({
        message: "Course not yet completed",
      });
    }

   
    const course = await Course.findByPk(course_id, {
      attributes: ["title"],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

   
    
    const certificate = await generateCourseCertificate(
      student_id,
      course_id,
      req.user.name,
      course.title
    );

     await sendNotification({
  student_id,
  title: "Certificate Available 🎓",
  message: `Congratulations! Your course certificate is now available for download.`,
});

    return res.status(201).json({
      message: "Course certificate generated successfully",
      certificate,
    });
  } catch (err) {
    console.error("Generate course certificate error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};