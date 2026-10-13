const express = require('express');
const router = express.Router();
const {
  getComplaints,
  createComplaint,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getComplaints);
router.post('/', createComplaint);
router.patch('/:id/status', checkRole('admin', 'faculty'), updateComplaintStatus);

module.exports = router;
