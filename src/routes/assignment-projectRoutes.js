const express = require('express');
const router = express.Router();
const controllers = require('../controllers/assignment-projectControllers');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload } = require('../utils/uploads');

/**
 * @swagger
 * /submissions/assignments/submit:
 *   post:
 *     summary: Submit an assignment (student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               assignment_id:
 *                 type: string
 *                 format: uuid
 *               file:
 *                 type: string
 *                 format: binary
 *               file_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment submitted
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.post(
  '/assignments/submit',
  authenticateToken,
    upload.single('file'),
    rateLimitMiddleware,
  controllers.submitAssignment
);

/**
 * @swagger
 * /submissions/assignments/module/{module_id}:
 *   get:
 *     summary: Get assignments for a module (optionally include student's submissions)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: optional student id to include submissions
 *     responses:
 *       200:
 *         description: Assignments returned
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get(
  '/assignments/module/:module_id',
  authenticateToken,
   rateLimitMiddleware,
  controllers.getAssignmentsByModule
);

/**
 * @swagger
 * /submissions/assignments/submission/{submission_id}:
 *   get:
 *     summary: Get a specific assignment submission (student-only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission returned
 *       400:
 *         description: Missing submission_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
router.get(
  '/assignments/submission/:submission_id',
  authenticateToken,
    rateLimitMiddleware,
  controllers.getAssignmentSubmission
);

/**
 * @swagger
 * /submissions/projects/submit:
 *   post:
 *     summary: Submit a project (student)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               file:
 *                 type: string
 *                 format: binary
 *               file_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project submitted
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post(
  '/projects/submit',
    authenticateToken,
  upload.single('file'),
    rateLimitMiddleware,
  controllers.submitProject
);

/**
 * @swagger
 * /submissions/projects/module/{module_id}:
 *   get:
 *     summary: Get projects for a module (optionally include student's submissions)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: optional student id to include submissions
 *     responses:
 *       200:
 *         description: Projects returned
 *       400:
 *         description: Missing module_id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get(
  '/projects/module/:module_id',
  authenticateToken,
   rateLimitMiddleware,
  controllers.getProjectsByModule
);

/**
 * @swagger
 * /submissions/projects/submission/{submission_id}:
 *   get:
 *     summary: Get a specific project submission (student-only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission returned
 *       400:
 *         description: Missing submission_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
router.get(
  '/projects/submission/:submission_id',
  authenticateToken,
   rateLimitMiddleware,
  controllers.getProjectSubmission
);

module.exports = router;