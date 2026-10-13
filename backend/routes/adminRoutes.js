const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  bulkUploadStudents,
  bulkEnrollStudents,
} = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Configure multer for in-memory storage (up to 15MB file size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isSpreadsheet =
      file.originalname.match(/\.(csv|xlsx|xls)$/i) ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel';

    if (isSpreadsheet) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv, .xlsx, or .xls spreadsheet files are accepted'), false);
    }
  },
});

// Protect all admin routes
router.use(verifyToken);
router.use(checkRole('admin'));

// Student high-volume bulk import
router.post('/students/bulk-upload', upload.single('file'), bulkUploadStudents);

// Course batch enrollment
router.post('/courses/bulk-enroll', upload.single('file'), bulkEnrollStudents);

module.exports = router;
