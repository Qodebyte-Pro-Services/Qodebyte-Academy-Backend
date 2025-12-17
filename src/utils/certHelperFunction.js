const { Certificate, StudentModule, CourseModule } = require("../models");
const generateCertificatePDF = require("./certGenerator");



async function generateCourseCertificate(student_id, course_id, studentName, courseTitle) {
  
  const modules = await CourseModule.findAll({
    where: { course_id },
    attributes: ["module_id"],
    raw: true
  });
  const moduleIds = modules.map(m => m.module_id);

  
  const completedModules = await StudentModule.findAll({
    where: { student_id, module_id: moduleIds, completed: true },
    attributes: ["module_id"],
    raw: true
  });

  if (completedModules.length !== moduleIds.length) {
    throw new Error("Course not yet completed");
  }

  
  const fileUrl = await generateCertificatePDF(studentName, courseTitle);

 
  const certificate = await Certificate.create({
    student_id,
    course_id,
    certificate_type: "course",
    issued_at: new Date(),
    file_url: fileUrl,
  });

  return certificate;
}

module.exports = generateCourseCertificate;
