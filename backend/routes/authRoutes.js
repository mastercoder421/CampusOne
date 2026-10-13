const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  getUsers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.get('/users', protect, requireRole('admin', 'faculty'), getUsers);

module.exports = router;
