const { Certificate } = require("crypto");
const { Progress, CourseLesson, CourseModule, StudentCourse, StudentModule, sequelize, Course } = require("../models");
const ensureEnrolled = require("../utils/enrolledStudent");
const generateCourseCertificate = require("../utils/certHelperFunction");
const { sendNotification } = require("./notificationController");

exports.startLesson = async (req, res) => {
  const student_id = req.user?.user_id;
  const lesson_id = req.params.lesson_id;

  if (!student_id)
    return res.status(401).json({ message: "Unauthorized" });

  const progress = await Progress.findOne({ where: { student_id, lesson_id } });

  if (!progress)
    return res.status(404).json({ message: "Progress not found" });

  if (progress.status === "not_started") {
    progress.status = "started";
    await progress.save();
  }

  await sendNotification({
  student_id,
  title: "Lesson Has Started ✅",
  message: "You’ve successfully Started a lesson. Keep going!",
});

  return res.status(200).json({
    message: "Lesson started",
    progress
  });
};

exports.markLessonCompleted = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const lesson_id = req.params.lesson_id || req.query.lesson_id || req.body.lesson_id;

    if (!student_id) return res.status(401).json({ message: "Unauthorized" });
    if (!lesson_id) return res.status(400).json({ message: "lesson_id is required" });

  
    const lesson = await CourseLesson.findByPk(lesson_id, { attributes: ["lesson_id", "module_id"] });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const module = await CourseModule.findByPk(lesson.module_id, { attributes: ["module_id", "course_id", "module_order"] });
    if (!module) return res.status(404).json({ message: "Parent module not found" });

   
    const studentCourse = await StudentCourse.findOne({ where: { student_id, course_id: module.course_id } });
    if (!studentCourse || studentCourse.unlocked_modules < module.module_order) {
      return res.status(403).json({ message: "Module is locked. Complete payments to unlock this module." });
    }

   
 const [progress, created] = await Progress.findOrCreate({
  where: { student_id, lesson_id },
  defaults: { student_id, lesson_id, status: "completed" },
});

let lessonJustCompleted = false;

if (!created && progress.status !== "completed") {
  progress.status = "completed";
  await progress.save();
  lessonJustCompleted = true;
}

if (created || lessonJustCompleted) {
  await sendNotification({
    student_id,
    title: "Lesson Completed ✅",
    message: "You’ve successfully completed a lesson. Keep going!",
  });
}

   
    const courseModules = await CourseModule.findAll({ where: { course_id: module.course_id }, attributes: ["module_id"], raw: true });
    const courseModuleIds = courseModules.map(m => m.module_id);

    const lessonsAll = await CourseLesson.findAll({ where: { module_id: courseModuleIds }, attributes: ["lesson_id", "module_id"], raw: true });
    const progresses = await Progress.findAll({ where: { student_id, lesson_id: lessonsAll.map(l => l.lesson_id), status: "completed" }, attributes: ["lesson_id"], raw: true });

    const completedLessonSet = new Set(progresses.map(p => p.lesson_id));

    
    const bulkModuleUpdates = courseModuleIds.map(modId => {
      const moduleLessons = lessonsAll.filter(l => l.module_id === modId);
      const completedCount = moduleLessons.filter(l => completedLessonSet.has(l.lesson_id)).length;
      return { student_id, module_id: modId, completed: completedCount === moduleLessons.length };
    });

        const previousModuleProgress = await StudentModule.findOne({
      where: { student_id, module_id: module.module_id },
    });


    await Promise.all(bulkModuleUpdates.map(data => StudentModule.upsert(data)));

    const module_completed = bulkModuleUpdates.find(m => m.module_id === module.module_id)?.completed || false;

    const wasModuleCompletedBefore = previousModuleProgress?.completed === true;

    if (module_completed && !wasModuleCompletedBefore) {
      await sendNotification({
        student_id,
        title: "Module Completed 🎉",
        message: "You’ve successfully completed a module. Great progress!",
      });
    }
   
    let course_certificate = null;
    const allModulesCompleted = bulkModuleUpdates.every(m => m.completed);
    if (allModulesCompleted) {
      const existingCert = await Certificate.findOne({ where: { student_id, course_id: module.course_id, certificate_type: "course" } });
      if (!existingCert) {
      
        const course = await Course.findByPk(module.course_id, { attributes: ["title"] });
        if (!course) throw new Error("Course not found");

        course_certificate = await generateCourseCertificate(student_id, module.course_id, req.user.name, course.title);
        await sendNotification({
      student_id,
      title: "Course Completed 🏆",
      message: "Congratulations! You’ve completed the course and earned your certificate.",
    });
      }
    }

    return res.status(200).json({
      message: "Lesson marked completed",
      progress,
      module_completed,
      course_certificate,
    });

  } catch (err) {
    console.error("Mark lesson completed error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const student_id = req.user?.user_id || req.query.user_id;
    const course_id = req.params.course_id || req.query.course_id || req.body.course_id;

    if (!student_id) return res.status(401).json({ message: "Unauthorized" });
    if (!course_id) return res.status(400).json({ message: "course_id is required" });

    
    const modules = await CourseModule.findAll({
      where: { course_id },
      attributes: [
        "module_id",
        "title",
        "module_order",
        [sequelize.literal(`(
          SELECT COUNT(*) 
          FROM "CourseLessons" AS lessons 
          WHERE lessons.module_id = "CourseModule".module_id
        )`), "total_lessons"]
      ],
      order: [["module_order", "ASC"]],
      raw: true
    });

    if (!modules.length) return res.status(404).json({ message: "No modules found for this course" });

    const moduleIds = modules.map(m => m.module_id);

  
    const lessons = await CourseLesson.findAll({
      where: { module_id: moduleIds },
      attributes: ["lesson_id", "module_id", "title", "lesson_order"],
      order: [["module_id", "ASC"], ["lesson_order", "ASC"]],
      raw: true
    });

    if (!lessons.length) return res.status(404).json({ message: "No lessons found for this course" });

    const lessonIds = lessons.map(l => l.lesson_id);

    
    const completedLessonsData = await Progress.findAll({
      where: { student_id, lesson_id: lessonIds, status: "completed" },
      attributes: ["lesson_id"],
      raw: true
    });
    const completedLessonSet = new Set(completedLessonsData.map(l => l.lesson_id));

  
    const studentModules = await StudentModule.findAll({
      where: { student_id, module_id: moduleIds },
      attributes: ["module_id", "completed"],
      raw: true
    });
    const studentModuleMap = {};
    studentModules.forEach(sm => studentModuleMap[sm.module_id] = sm.completed);

   
    const moduleProgress = modules.map(mod => {
      const moduleLessons = lessons.filter(l => l.module_id === mod.module_id);
      const totalInModule = moduleLessons.length;
      const completedInModule = moduleLessons.filter(l => completedLessonSet.has(l.lesson_id)).length;
      const percent = totalInModule === 0 ? 0 : ((completedInModule / totalInModule) * 100).toFixed(2);

      const nextLessonInModule = moduleLessons.find(l => !completedLessonSet.has(l.lesson_id)) || null;

      const module_completed = studentModuleMap[mod.module_id] ?? (completedInModule === totalInModule);

      return {
        module_id: mod.module_id,
        title: mod.title,
        completed_lessons: completedInModule,
        total_lessons: totalInModule,
        percentage: Number(percent),
        module_completed,
        next_lesson: nextLessonInModule
          ? {
              lesson_id: nextLessonInModule.lesson_id,
              title: nextLessonInModule.title,
              lesson_order: nextLessonInModule.lesson_order
            }
          : null
      };
    });

  
    const totalLessons = lessonIds.length;
    const completedLessons = completedLessonSet.size;
    const progressPercent = totalLessons === 0 ? 0 : ((completedLessons / totalLessons) * 100).toFixed(2);

  
    const nextLesson = lessons.find(l => !completedLessonSet.has(l.lesson_id)) || null;

    return res.status(200).json({
      message: "Course progress fetched successfully",
      course_id,
      student_id,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percentage: Number(progressPercent),
      modules: moduleProgress,
      next_lesson: nextLesson
        ? {
            lesson_id: nextLesson.lesson_id,
            title: nextLesson.title,
            module_id: nextLesson.module_id,
            lesson_order: nextLesson.lesson_order
          }
        : null
    });

  } catch (err) {
    console.error("Get course progress error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
