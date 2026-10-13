const express = require('express');
const router = express.Router();
const {
  getAssignmentsByCourse,
  getAllAssignments,
  createAssignment,
  submitAssignment,
  gradeSubmission,
} = require('../controllers/assignmentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getAllAssignments);
router.get('/course/:courseId', getAssignmentsByCourse);
router.post('/create', checkRole('faculty', 'admin'), createAssignment);
router.post('/:id/submit', checkRole('student', 'admin'), submitAssignment);
router.put('/:id/grade', checkRole('faculty', 'admin'), gradeSubmission);

module.exports = router;
