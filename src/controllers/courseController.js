const {Course, CourseModule, CourseLesson, StudentCourse } = require("../models");

exports.getAllCourses = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const { count, rows: courses } = await Course.findAndCountAll({
      include: [
        {
          model: CourseModule,
          as: "modules",
          include: [{ model: CourseLesson, as: "lessons"}]
        }
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: CourseModule, as: "modules" }, "module_order", "ASC"],
        [{ model: CourseModule, as: "modules" }, { model: CourseLesson, as: "lessons" }, "lesson_order", "ASC"]
      ],
      limit,
      offset
    });

    return res.status(200).json({
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_courses: count,
      limit,
      courses
    });

  } catch (error) {
    console.error("🔥 Get All Courses Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getCourseById = async (req, res) => {
  try {
    const { course_id } = req.params;

    const course = await Course.findByPk(course_id, {
      include: [
        {
          model: CourseModule,
          as: "modules",
        include: [{ model: CourseLesson, as: "lessons"}]
        }
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: CourseModule, as: "modules" }, "module_order", "ASC"],
        [{ model: CourseModule, as: "modules" }, { model: CourseLesson, as: "lessons" }, "lesson_order", "ASC"]
      ]
    });

    if (!course) return res.status(404).json({ message: "Course not found." });

    return res.status(200).json({ course });

  } catch (error) {
    console.error("🔥 Get Course Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const student_id = req.user && req.user.user_id;
    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });

    const enrollments = await StudentCourse.findAll({
      where: { student_id },
      attributes: ['student_course_id', 'payment_type', 'payment_status', 'unlocked_modules', 'createdAt'],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['course_id', 'title', 'price', 'short_description']
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ enrollments });
  } catch (err) {
    console.error('Get enrolled courses error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getEnrolledCourse = async (req, res) => {
  try {
    const student_id = req.user && req.user.user_id;
    const course_id = req.query.course_id || req.params.course_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!course_id) return res.status(400).json({ message: 'course_id is required (query or param)' });

    const enrollment = await StudentCourse.findOne({
      where: { student_id, course_id },
      attributes: ['student_course_id', 'payment_type', 'payment_status', 'unlocked_modules', 'createdAt'],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['course_id', 'title', 'price', 'short_description'],
          include: [
            {
              model: CourseModule,
              as: 'modules',
              attributes: ['module_id', 'title', 'module_order'],
              include: [
                { model: CourseLesson, as: 'lessons', attributes: ['lesson_id', 'title', 'lesson_order'] }
              ]
            }
          ]
        }
      ]
    });

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found for this student and course.' });

    return res.status(200).json({ enrollment });
  } catch (err) {
    console.error('Get enrolled course error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

async function ensureEnrolled(student_id, course_id) {
  const enrollment = await StudentCourse.findOne({
    where: { student_id, course_id },
  });
  return !!enrollment; 
};

exports.getEnrolledCourseModules = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const course_id = req.query.course_id || req.params.course_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!course_id) return res.status(400).json({ message: 'course_id is required (query or param)' });

    const enrolled = await ensureEnrolled(student_id, course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    const modules = await CourseModule.findAll({
      where: { course_id },
      include: [{ model: CourseLesson, as: 'lessons', attributes: ['lesson_id', 'title', 'lesson_order'] }],
      order: [['module_order', 'ASC'], [{ model: CourseLesson, as: 'lessons' }, 'lesson_order', 'ASC']],
    });

    return res.status(200).json({ modules });
  } catch (err) {
    console.error('Get enrolled course modules error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEnrolledModuleById = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const module_id = req.query.module_id || req.params.module_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!module_id) return res.status(400).json({ message: 'module_id is required (query or param)' });

    const module = await CourseModule.findByPk(module_id, {
      include: [{ model: Course, as: 'course', attributes: ['course_id', 'title'] }],
    });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    return res.status(200).json({ module });
  } catch (err) {
    console.error('Get enrolled module error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getModuleLessons = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const module_id = req.query.module_id || req.params.module_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!module_id) return res.status(400).json({ message: 'module_id is required (query or param)' });

    const module = await CourseModule.findByPk(module_id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const enrolled = await ensureEnrolled(student_id, module.course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    const lessons = await CourseLesson.findAll({
      where: { module_id },
      order: [['lesson_order', 'ASC']],
    });

    return res.status(200).json({ lessons });
  } catch (err) {
    console.error('Get module lessons error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getModuleLessonById = async (req, res) => {
  try {
    const student_id = req.user?.user_id;
    const lesson_id = req.query.lesson_id || req.params.lesson_id;

    if (!student_id) return res.status(401).json({ message: 'Unauthorized' });
    if (!lesson_id) return res.status(400).json({ message: 'lesson_id is required (query or param)' });

    const lesson = await CourseLesson.findByPk(lesson_id, {
      include: [{ model: CourseModule, as: 'module', attributes: ['module_id', 'course_id', 'title'] }],
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const enrolled = await ensureEnrolled(student_id, lesson.module.course_id);
    if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });

    return res.status(200).json({ lesson });
  } catch (err) {
    console.error('Get module lesson error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};