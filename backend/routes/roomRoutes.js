const express = require('express');
const router = express.Router();
const {
  getRoomBookings,
  createRoomBooking,
  updateRoomBookingStatus,
} = require('../controllers/roomController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getRoomBookings);
router.post('/', createRoomBooking);
router.patch('/:id/status', checkRole('admin', 'faculty'), updateRoomBookingStatus);

module.exports = router;
