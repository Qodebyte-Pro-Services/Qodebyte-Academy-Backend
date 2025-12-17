const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload } = require('../utils/uploads');


/**
 * @swagger
 * /payments/init:
 *   post:
 *     summary: Initialize a payment (student). Optionally upload a receipt file.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - amount
 *             properties:
 *               course_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               installment:
 *                 type: boolean
 *               payment_method:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Payment initialized
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post(
  '/init',
  authenticateToken,
  upload.single('file'),
    rateLimitMiddleware,
  paymentController.initializePayment
);

/**
 * @swagger
 * /payments/{payment_id}/verify:
 *   put:
 *     summary: Verify a payment (admin). Sets payment to completed and updates student unlocked modules.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
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
 *               amount_verified:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:payment_id/verify',
  authenticateToken,
    rateLimitMiddleware,
  paymentController.verifyPayment
);

/**
 * @swagger
 * /payments/me:
 *   get:
 *     summary: Get authenticated student's payment history (paginated)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated payments returned
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', authenticateToken, rateLimitMiddleware, paymentController.getStudentPayments);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments (admin). Supports filters and pagination.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated payments returned
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, rateLimitMiddleware, paymentController.getAllPayments);

/**
 * @swagger
 * /payments/{payment_id}:
 *   get:
 *     summary: Get a specific payment by id
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment returned
 *       400:
 *         description: Missing payment_id
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get('/:payment_id', authenticateToken, rateLimitMiddleware, paymentController.getPaymentById);

/**
 * @swagger
 * /payments/course/{course_id}/remaining:
 *   get:
 *     summary: Get remaining balance and unlocked modules for authenticated student on a course
 *     tags: [Payments]
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
 *         description: Remaining balance and payment summary returned
 *       400:
 *         description: Missing course_id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course or enrollment not found
 *       500:
 *         description: Server error
 */
router.get('/course/:course_id/remaining', authenticateToken, rateLimitMiddleware, paymentController.getRemainingBalance);

module.exports = router;