const express = require('express');
const router = express.Router();
const {
  getEvents,
  createEvent,
  toggleRsvp,
} = require('../controllers/eventController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getEvents);
router.post('/', checkRole('admin', 'faculty', 'student'), createEvent);
router.post('/:id/rsvp', toggleRsvp);

module.exports = router;
