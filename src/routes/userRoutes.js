const { authenticateToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersAuthentication");
const { upload } = require("../utils/uploads");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and profile management
 *
 * /api/auth/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               is_social_media:
 *                 type: boolean
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       201:
 *         description: OTP sent. Please verify email.
 *       400:
 *         description: Missing required fields or email already exists
 *       429:
 *         description: Too many attempts
 *       500:
 *         description: Internal server error
 *
 * /api/auth/users/login:
 *   post:
 *     summary: Login a user (sends OTP)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent for login verification
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User not verified
 *       429:
 *         description: Too many attempts
 *       500:
 *         description: Server error
 *
 * /api/auth/users/google-login:
 *   post:
 *     summary: Login or register user via Google
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google login/signup successful
 *       400:
 *         description: Missing Google ID token
 *       401:
 *         description: Invalid Google token
 *       500:
 *         description: Server error
 *
 * /api/auth/users/verify:
 *   post:
 *     summary: Verify OTP for register/login/reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - otp
 *               - purpose
 *             properties:
 *               user_id:
 *                 type: string
 *               otp:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [register, login, reset]
 *     responses:
 *       200:
 *         description: OTP verified and token returned
 *       400:
 *         description: Invalid OTP or missing fields
 *       403:
 *         description: Too many failed attempts
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many attempts
 *       500:
 *         description: Server error
 *
 * /api/auth/users/resend-otp:
 *   post:
 *     summary: Resend OTP to user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - purpose
 *             properties:
 *               email:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent for password reset
 *       403:
 *         description: User not verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - new_password
 *             properties:
 *               user_id:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/logout:
 *   post:
 *     summary: Logout user and blacklist token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: No token provided
 *       500:
 *         description: Server error
 *
 * /api/auth/users/profile/:user_id:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details returned
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               removeProfilePic:
 *                 type: boolean
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Old password incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/users/delete/:user_id:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/google-login", userController.googleLogin);
router.post("/verify", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.post("/forgot-password", userController.forgetPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/logout", authenticateToken, userController.logout);

// router.get("/", userController.getUsers);
router.get("/profile/:user_id", authenticateToken, userController.getUserById);

router.put("/profile", authenticateToken, upload.single("profilePic"), userController.updateUserProfile);
router.put("/change-password", authenticateToken, userController.changeUserPassword);

router.delete("/delete/:user_id", authenticateToken, userController.deleteUser);


module.exports = router;