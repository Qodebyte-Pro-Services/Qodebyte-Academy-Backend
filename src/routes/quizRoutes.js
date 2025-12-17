const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /quizzes/module/{module_id}:
 *   get:
 *     summary: Get quizzes for a module (student must be enrolled)
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quizzes returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quiz'
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in course
 *       404:
 *         description: Module or quizzes not found
 *       500:
 *         description: Server error
 */
router.get(
  '/module/:module_id',
  authenticateToken,
    rateLimitMiddleware,
  quizController.getQuiz
);

/**
 * @swagger
 * /quizzes/submit:
 *   post:
 *     summary: Submit quiz answers for authenticated student
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quiz_id
 *               - answers
 *             properties:
 *               quiz_id:
 *                 type: string
 *                 format: uuid
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   description: Answer object; shape depends on quiz.questions
 *     responses:
 *       200:
 *         description: Quiz submitted
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Quiz or module not found
 *       500:
 *         description: Server error
 */
router.post(
  '/submit',
  authenticateToken,
    rateLimitMiddleware,
  quizController.submitQuiz
);

/**
 * @swagger
 * /quizzes/result/{module_id}:
 *   get:
 *     summary: Get authenticated student's quiz result for a module
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quiz result returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   $ref: '#/components/schemas/QuizResult'
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Module or result not found
 *       500:
 *         description: Server error
 */
router.get(
  '/result/:module_id',
  authenticateToken,
    rateLimitMiddleware,
  quizController.getQuizResult
);

/**
 * @swagger
 * /quizzes/result/{result_id}/grade:
 *   put:
 *     summary: Grade a quiz result (set score). Intended for instructors/admins.
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: result_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Quiz graded
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Result not found
 *       500:
 *         description: Server error
 */
router.put(
  '/result/:result_id/grade',
  authenticateToken,
    rateLimitMiddleware,
  quizController.gradeQuiz
);

module.exports = router;