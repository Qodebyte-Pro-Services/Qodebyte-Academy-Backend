const { StudentCourse } = require("../models");

async function ensureEnrolled(student_id, course_id) {
  const enrollment = await StudentCourse.findOne({
    where: { student_id, course_id },
  });
  return !!enrollment;
}

module.exports = ensureEnrolled;