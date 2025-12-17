const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Courses retrieved
 */

/**
 * @swagger
 * /courses/{course_id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course found
 *       404:
 *         description: Course not found
 */

router.get("/", rateLimitMiddleware, courseController.getAllCourses);
router.get("/:course_id", rateLimitMiddleware, courseController.getCourseById);

/**
 * @swagger
 * /courses/enrolled:
 *   get:
 *     summary: Get all courses the authenticated student is enrolled in
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments returned
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/my-course/enrolled",
  authenticateToken,
   rateLimitMiddleware,
  courseController.getEnrolledCourses
);

/**
 * @swagger
 * /courses/my-course/enrolled/course/{course_id}:
 *   get:
 *     summary: Get a specific enrolled course (includes modules & lessons)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: course_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Enrollment returned
 *       400:
 *         description: course_id missing
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Server error
 */

router.get(
  "/my-course/enrolled/course/:course_id",
  authenticateToken,
    rateLimitMiddleware,
  courseController.getEnrolledCourse
);
/**
 * @swagger
 * /courses/my-course/enrolled/modules/{course_id}:
 *   get:
 *     summary: Get all modules for a course the student is enrolled in
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: course_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Modules returned
 *       400:
 *         description: Missing course_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       500:
 *         description: Server error
 */

router.get(
  "/my-course/enrolled/modules/:course_id",
  authenticateToken,
    rateLimitMiddleware,
  courseController.getEnrolledCourseModules
);
/**
 * @swagger
 * /courses/my-course/enrolled/module/{module_id}:
 *   get:
 *     summary: Get a specific module for a course the student is enrolled in
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: module_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Module returned
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */

router.get(
  "/my-course/enrolled/module/:module_id",
  authenticateToken,
    rateLimitMiddleware,
  courseController.getEnrolledModuleById
);

/**
 * @swagger
 * /courses/my-course/enrolled/module/{module_id}/lessons:
 *   get:
 *     summary: Get all lessons for a module if the student is enrolled
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: module_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lessons returned
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */

router.get(
  "/my-course/enrolled/module/:module_id/lessons",
  authenticateToken,
    rateLimitMiddleware,
  courseController.getModuleLessons
);
/**
 * @swagger
 * /courses/my-course/enrolled/module/lesson/{lesson_id}:
 *   get:
 *     summary: Get a specific lesson for a module
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: lesson_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson returned
 *       400:
 *         description: Missing lesson_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in this course
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Server error
 */

router.get(
  "/my-course/enrolled/module/lesson/:lesson_id",
  authenticateToken,
  rateLimitMiddleware,
  courseController.getModuleLessonById
);
module.exports = router;