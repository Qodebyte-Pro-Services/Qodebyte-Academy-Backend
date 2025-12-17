const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /progress/lesson/{lesson_id}/start:
 *   post:
 *     summary: Mark a lesson as started for the authenticated student
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lesson_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson started and progress returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Progress or lesson not found
 *       500:
 *         description: Server error
 */
router.post(
  '/lesson/:lesson_id/start',
  authenticateToken,
    rateLimitMiddleware,
  progressController.startLesson
);

/**
 * @swagger
 * /progress/lesson/{lesson_id}/complete:
 *   post:
 *     summary: Mark a lesson as completed for the authenticated student
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lesson_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lesson_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Lesson marked completed; may return module and course certificate info
 *       400:
 *         description: Missing lesson_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Module locked
 *       404:
 *         description: Lesson not found
 *       500:
 *         description: Server error
 */
router.post(
  '/lesson/:lesson_id/complete',
  authenticateToken,
    rateLimitMiddleware,
  progressController.markLessonCompleted
);

/**
 * @swagger
 * /progress/course/{course_id}:
 *   get:
 *     summary: Get course progress for authenticated student
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: optional student id to fetch progress for (admin use)
 *     responses:
 *       200:
 *         description: Course progress summary returned
 *       400:
 *         description: Missing course_id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Modules or lessons not found
 *       500:
 *         description: Server error
 */
router.get(
  '/course/:course_id',
  authenticateToken,
    rateLimitMiddleware,
  progressController.getCourseProgress
);

module.exports = router;