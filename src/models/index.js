const sequelize = require("../config/db");
const Assignment = require("./assignment");
const AssignmentSubmission = require("./assignment_submissions");
const BlacklistedToken = require("./blacklist");
const Certificate = require("./certificate");
const Course = require("./course");
const CourseLesson = require("./courseLessons");
const CourseModule = require("./courseModules");
const Notification = require("./notifcations");
const OTP = require("./otp");
const Payment = require("./payment");
const Progress = require("./progress");
const Project = require("./project");
const ProjectSubmission = require("./project_submission");
const Quiz = require("./quiz");
const QuizResult = require("./quiz_results");
const StudentCourse = require("./student_course");
const StudentModule = require("./student_module");
const User = require("./user");



Course.hasMany(CourseModule, {
  foreignKey: 'course_id',
  as: 'modules',
  onDelete: 'CASCADE',
});

CourseModule.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
});

CourseModule.hasMany(CourseLesson, {
  foreignKey: 'module_id',
  as: 'lessons',
  onDelete: 'CASCADE',
});
CourseLesson.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

CourseModule.hasMany(Quiz, {
  foreignKey: 'module_id',
  as: 'quizzes',
  onDelete: 'CASCADE',
});
Quiz.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

CourseModule.hasMany(QuizResult, {
  foreignKey: 'module_id',
  as: 'quiz_results',
  onDelete: 'CASCADE',
});
QuizResult.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

User.hasMany(QuizResult, {
  foreignKey: 'student_id',
  as: 'quiz_results',
  onDelete: 'CASCADE',
});
QuizResult.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});


CourseModule.hasMany(Assignment, {
  foreignKey: 'module_id',
  as: 'assignments',
  onDelete: 'CASCADE',
});
Assignment.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

Assignment.hasMany(AssignmentSubmission, {
  foreignKey: 'assignment_id',
  as: 'submissions',
  onDelete: 'CASCADE',
});
AssignmentSubmission.belongsTo(Assignment, {
  foreignKey: 'assignment_id',
  as: 'assignment',
});

User.hasMany(AssignmentSubmission, {
  foreignKey: 'student_id',
  as: 'assignment_submissions',
  onDelete: 'CASCADE',
});
AssignmentSubmission.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});

CourseModule.hasMany(Project, {
  foreignKey: 'module_id',
  as: 'projects',
  onDelete: 'CASCADE',
});
Project.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

Project.hasMany(ProjectSubmission, {
  foreignKey: 'project_id',
  as: 'submissions',
  onDelete: 'CASCADE',
});
ProjectSubmission.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

User.hasMany(ProjectSubmission, {
  foreignKey: 'student_id',
  as: 'project_submissions',
  onDelete: 'CASCADE',
});
ProjectSubmission.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});

User.hasMany(Payment, {
  foreignKey: 'student_id',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});


Course.hasMany(Payment, {
  foreignKey: 'course_id',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
});


User.hasMany(Progress, {
  foreignKey: 'student_id',
  as: 'progress',
  onDelete: 'CASCADE',
});
Progress.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});

CourseLesson.hasMany(Progress, {
  foreignKey: 'lesson_id',
  as: 'progress_records',
  onDelete: 'CASCADE',
});
Progress.belongsTo(CourseLesson, {
  foreignKey: 'lesson_id',
  as: 'lesson',
});

User.hasMany(Notification, {
  foreignKey: 'student_id',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});


User.hasMany(StudentCourse, {
  foreignKey: 'student_id',
  as: 'student_courses',
  onDelete: 'CASCADE',
});
StudentCourse.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});

Course.hasMany(StudentCourse, {
  foreignKey: 'course_id',
  as: 'enrollments',
  onDelete: 'CASCADE',
});
StudentCourse.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
});

User.belongsToMany(Course, {
  through: StudentCourse,
  foreignKey: 'student_id',
  otherKey: 'course_id',
  as: 'enrolledCourses',
});


Course.belongsToMany(User, {
  through: StudentCourse,
  foreignKey: 'course_id',
  otherKey: 'student_id',
  as: 'students',
});

User.hasMany(StudentModule, {
  foreignKey: 'student_id',
  as: 'student_modules',
  onDelete: 'CASCADE',
});
StudentModule.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student',
});

CourseModule.hasMany(StudentModule, {
  foreignKey: 'module_id',
  as: 'student_modules',
  onDelete: 'CASCADE',
});
StudentModule.belongsTo(CourseModule, {
  foreignKey: 'module_id',
  as: 'module',
});

User.hasMany(Certificate, { foreignKey: "student_id", as: "certificates" });
Certificate.belongsTo(User, { foreignKey: "student_id", as: "student" });

Course.hasMany(Certificate, { foreignKey: "course_id", as: "certificates" });
Certificate.belongsTo(Course, { foreignKey: "course_id", as: "course" });

CourseModule.hasMany(Certificate, { foreignKey: "module_id", as: "certificates" });
Certificate.belongsTo(CourseModule, { foreignKey: "module_id", as: "module" });

module.exports = {
    sequelize,
    User,
    OTP,
    BlacklistedToken,
    Course,
    CourseModule,
    CourseLesson,
    Quiz,
    QuizResult,
    Assignment,
    AssignmentSubmission,
    Project,
    ProjectSubmission,
    Payment,
    Progress,
    Notification,
    StudentCourse,
    StudentModule,
    Certificate
}