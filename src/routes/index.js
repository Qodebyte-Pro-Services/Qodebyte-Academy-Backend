const express = require('express'); 
const router = express.Router();


router.get('/', (req, res) => {
  res.send('Welcome to the API For Digital Assets!');
});
router.use('/auth/users', require('./userRoutes'));
router.use('/courses', require('./courseRoutes'))
module.exports = router;