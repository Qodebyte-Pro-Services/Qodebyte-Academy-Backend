const express = require('express'); 
const router = express.Router();


router.get('/', (req, res) => {
  res.send('Welcome to the API For Digital Assets!');
});
router.use('/auth/users', require('./userRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/quizzes', require('./quizRoutes'));
router.use('/submissions', require('./assignment-projectRoutes'));
router.use('/certificates', require('./certRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/progress', require('./progressRoutes'));
router.use('/payments', require('./paymentRoutes'));
module.exports = router;