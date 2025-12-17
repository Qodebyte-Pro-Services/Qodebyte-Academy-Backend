const { Progress, CourseLesson, CourseModule } = require("../models");

async function createModuleProgress(student_id, course_id, module_number) {
  const module = await CourseModule.findOne({
    where: { course_id, module_order: module_number },
    attributes: ["module_id"]
  });

  if (!module) return;

 
  const lessons = await CourseLesson.findAll({
    where: { module_id: module.module_id },
    attributes: ["lesson_id"]
  });

  if (!lessons || lessons.length === 0) return;

  
  const progressPayload = lessons.map((lesson) => ({
    student_id,
    lesson_id: lesson.lesson_id,
    status: "not_started"
  }));

  
  await Progress.bulkCreate(progressPayload, { ignoreDuplicates: true });

  return true;
}

module.exports = createModuleProgress;
