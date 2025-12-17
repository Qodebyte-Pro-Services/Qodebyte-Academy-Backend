const express = require('express');
const router = express.Router();
const certController = require('../controllers/certController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /certificates/me:
 *   get:
 *     summary: Get authenticated student's certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of certificates for authenticated student
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', rateLimitMiddleware, authenticateToken, certController.getMyCertificates);

/**
 * @swagger
 * /certificates/{certificate_id}:
 *   get:
 *     summary: Get a certificate by id
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificate_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Certificate object with file_url
 *       400:
 *         description: Missing certificate_id
 *       404:
 *         description: Certificate not found / file not available
 *       500:
 *         description: Server error
 */
router.get('/:certificate_id', rateLimitMiddleware, certController.getCertificate);

/**
 * @swagger
 * /certificates/course/{course_id}:
 *   get:
 *     summary: Get all course certificates (students) for a course
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of course certificates
 *       400:
 *         description: Missing course_id
 *       404:
 *         description: Course or certificates not found
 *       500:
 *         description: Server error
 */
router.get('/course/:course_id', rateLimitMiddleware, authenticateToken, certController.getCourseCertificates);

/**
 * @swagger
 * /certificates/course/{course_id}/generate:
 *   post:
 *     summary: Generate course certificate for authenticated student (if course completed)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Certificate generated
 *       200:
 *         description: Certificate already exists
 *       400:
 *         description: Missing course_id or course not completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post('/course/:course_id/generate',authenticateToken, rateLimitMiddleware, certController.generateMyCourseCertificate);

module.exports = router;