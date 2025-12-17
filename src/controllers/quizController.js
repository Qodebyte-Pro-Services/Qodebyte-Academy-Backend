const { Quiz, CourseModule, StudentCourse, QuizResult, sequelize } = require("../models");
const ensureEnrolled = require("../utils/enrolledStudent");
const { sendNotification } = require("./notificationController");

exports.getQuiz = async (req, res) => {
  try {
   const student_id = req.user?.user_id  || req.query.user_id;
    const module_id = req.params.module_id || req.query.module_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!module_id) return res.status(400).json({ message: 'module_id is required (path param or query)' });

    const module = await CourseModule.findByPk(module_id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    const quizzes = await Quiz.findAll({
      where: { module_id },
      order: [['createdAt', 'ASC']],
    });

    if (!quizzes || quizzes.length === 0) {
      return res.status(404).json({ message: 'No quiz found for this module.' });
    }

    return res.status(200).json({ quizzes });
  } catch (error) {
    console.error('error getting Quiz for this module:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const student_id = req.user?.user_id;
    if (!student_id) return res.status(401).json({ message: "Unauthorized" });

    const { quiz_id, answers } = req.body;

    if (!quiz_id) {
      await t.rollback();
      return res.status(400).json({ message: "quiz_id is required." });
    }

    if (!answers || !Array.isArray(answers)) {
      await t.rollback();
      return res.status(400).json({ message: "answers must be an array." });
    }

    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) {
      await t.rollback();
      return res.status(404).json({ message: "Quiz not found." });
    }

    const module = await CourseModule.findByPk(quiz.module_id);
    if (!module) {
      await t.rollback();
      return res.status(404).json({ message: "Module not found for quiz." });
    }

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) {
      await t.rollback();
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

   
    const totalAnswered = answers.filter(a =>
      a.submitted !== null && a.submitted !== undefined
    ).length;

    

    let result = await QuizResult.findOne({
      where: { student_id, module_id: module.module_id },
      transaction: t,
    });

    if (!result) {
     
      result = await QuizResult.create(
        {
          student_id,
          module_id: module.module_id,
          answers,         
          total_answered: totalAnswered,
          score: 0,          
        },
        { transaction: t }
      );
    } else {
     
      await result.update(
        {
          answers,
          total_answered: totalAnswered,
        },
        { transaction: t }
      );
    }



    await t.commit();

        await sendNotification({
  student_id,
  title: "Quiz Submitted ✅",
  message: "You’ve successfully completed Your Quiz. Keep going!",
});

    return res.status(200).json({
      message: "Quiz submitted successfully.",
      result,
    });

  } catch (err) {
    await t.rollback();
    console.error("Submit quiz error:", err);
    return res.status(500).json({
      message: "Server error.",
      error: err.message,
    });
  }
};

exports.gradeQuiz = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { result_id } = req.params;
    const { score } = req.body;

    
    if (score === undefined || score === null) {
      await t.rollback();
      return res.status(400).json({ message: "Score is required." });
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      await t.rollback();
      return res.status(400).json({ message: "Score must be a number between 0 and 100." });
    }

   
    const result = await QuizResult.findByPk(result_id, { transaction: t });
    if (!result) {
      await t.rollback();
      return res.status(404).json({ message: "Quiz result not found." });
    }

    
    await result.update(
      { score },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({ message: "Quiz graded successfully.", result });

  } catch (err) {
    await t.rollback();
    console.error("Grade quiz error:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

exports.getQuizResult = async (req, res) => {
  try {
   const student_id = req.user?.user_id  || req.query.user_id;
    const module_id = req.params.module_id || req.query.module_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!module_id) return res.status(400).json({ message: 'module_id is required (path param or query)' });

   
    const module = await CourseModule.findByPk(module_id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    
    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    const result = await QuizResult.findOne({
      where: { student_id, module_id: module.module_id },
      include: [
        { model: CourseModule, as: 'module', attributes: ['module_id', 'title', 'course_id'] }
      ],
    });

    if (!result) return res.status(404).json({ message: 'Quiz result not found for this module.' });

    return res.status(200).json({ result });
  } catch (err) {
    console.error('Get quiz result error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};