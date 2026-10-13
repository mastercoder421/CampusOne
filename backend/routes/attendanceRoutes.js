const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseStudents,
  markAttendance,
  getCourseStats,
  getMySummary,
  createCourse,
} = require('../controllers/attendanceController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/courses', getCourses);
router.post('/courses', checkRole('admin', 'faculty'), createCourse);
router.get('/course/:courseId/students', getCourseStudents);
router.post('/mark', checkRole('faculty', 'admin'), markAttendance);
router.get('/course-stats/:courseId', getCourseStats);
router.get('/my-summary', checkRole('student', 'admin'), getMySummary);

module.exports = router;
