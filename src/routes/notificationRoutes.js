// ...existing code...
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { rateLimitMiddleware } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /notifications/me:
 *   get:
 *     summary: Get authenticated student's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', authenticateToken, rateLimitMiddleware, notificationController.getMyNotifications);

/**
 * @swagger
 * /notifications/{notification_id}/read:
 *   put:
 *     summary: Mark a notification as read (student only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Missing notification_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:notification_id/read',authenticateToken, rateLimitMiddleware, notificationController.markNotificationRead);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read for authenticated student
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/mark-all-read', authenticateToken, rateLimitMiddleware, notificationController.markAllNotificationsRead);

module.exports = router;
