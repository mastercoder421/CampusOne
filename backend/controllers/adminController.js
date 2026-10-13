const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');

// Helper to parse file buffer into JSON rows using xlsx
const parseSpreadsheetBuffer = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
};

// @desc    Bulk upload students via CSV or Excel (.xlsx)
// @route   POST /api/admin/students/bulk-upload
// @access  Private (Admin only)
exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid .csv or .xlsx spreadsheet file',
      });
    }

    const rows = parseSpreadsheetBuffer(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded spreadsheet is empty or has no data rows',
      });
    }

    // Normalize column headers
    const normalizedRows = rows
      .map((row) => {
        let name = '';
        let email = '';
        let rollNumber = '';
        let department = 'Computer Science';

        Object.keys(row).forEach((k) => {
          const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          const val = String(row[k]).trim();

          if (cleanKey === 'name' || cleanKey === 'studentname' || cleanKey === 'fullname') {
            name = val;
          } else if (cleanKey === 'email' || cleanKey === 'emailaddress' || cleanKey === 'mail') {
            email = val.toLowerCase();
          } else if (
            cleanKey.includes('roll') ||
            cleanKey === 'id' ||
            cleanKey === 'rollorfacultyid' ||
            cleanKey === 'studentid'
          ) {
            rollNumber = val;
          } else if (cleanKey.includes('dept') || cleanKey === 'department' || cleanKey === 'branch') {
            department = val || 'Computer Science';
          }
        });

        return { name, email, rollNumber, department };
      })
      .filter((r) => r.name && r.email && r.rollNumber);

    if (normalizedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Could not find valid rows. Required columns: "name", "email", and "rollNumber" (or "rollOrFacultyId")',
      });
    }

    // Check existing users in database to prevent collision
    const emails = normalizedRows.map((r) => r.email);
    const rolls = normalizedRows.map((r) => r.rollNumber);

    const existingUsers = await User.find({
      $or: [{ email: { $in: emails } }, { rollOrFacultyId: { $in: rolls } }],
    }).select('email rollOrFacultyId');

    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingRollSet = new Set(existingUsers.map((u) => u.rollOrFacultyId.toLowerCase()));

    const seenInFileEmails = new Set();
    const seenInFileRolls = new Set();
    const recordsToInsert = [];
    let duplicateCount = 0;

    for (const r of normalizedRows) {
      const emailLower = r.email.toLowerCase();
      const rollLower = r.rollNumber.toLowerCase();

      if (
        existingEmailSet.has(emailLower) ||
        existingRollSet.has(rollLower) ||
        seenInFileEmails.has(emailLower) ||
        seenInFileRolls.has(rollLower)
      ) {
        duplicateCount++;
      } else {
        seenInFileEmails.add(emailLower);
        seenInFileRolls.add(rollLower);
        recordsToInsert.push(r);
      }
    }

    // Pre-hash default password once for speed
    const defaultPasswordHash = await bcrypt.hash('Student@123', 10);

    if (recordsToInsert.length > 0) {
      const bulkOps = recordsToInsert.map((r) => ({
        insertOne: {
          document: {
            name: r.name,
            email: r.email,
            password: defaultPasswordHash,
            role: 'student',
            department: r.department || 'Computer Science',
            rollOrFacultyId: r.rollNumber,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      }));

      await User.bulkWrite(bulkOps, { ordered: false });
    }

    res.status(200).json({
      success: true,
      totalProcessed: normalizedRows.length,
      successCount: recordsToInsert.length,
      duplicateCount,
      message: `Successfully imported ${recordsToInsert.length} students. Skipped ${duplicateCount} duplicate(s). Default password: Student@123`,
    });
  } catch (error) {
    console.error('Error in bulkUploadStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process bulk student upload',
    });
  }
};

// @desc    Bulk enroll students into a course via file or list of roll numbers
// @route   POST /api/admin/courses/bulk-enroll
// @access  Private (Admin only)
exports.bulkEnrollStudents = async (req, res) => {
  try {
    const { courseId, rollNumbers } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Target course not found',
      });
    }

    let identifiers = [];

    // Check if uploaded file
    if (req.file && req.file.buffer) {
      const rows = parseSpreadsheetBuffer(req.file.buffer);
      rows.forEach((row) => {
        Object.values(row).forEach((val) => {
          if (typeof val === 'string' || typeof val === 'number') {
            const clean = String(val).trim();
            if (clean && !clean.toLowerCase().includes('roll') && !clean.toLowerCase().includes('email')) {
              identifiers.push(clean);
            }
          }
        });
      });
    } else if (rollNumbers) {
      // Parse array or comma/newline-separated string
      if (Array.isArray(rollNumbers)) {
        identifiers = rollNumbers.map((r) => String(r).trim()).filter(Boolean);
      } else if (typeof rollNumbers === 'string') {
        identifiers = rollNumbers
          .split(/[\n,;]+/)
          .map((r) => r.trim())
          .filter(Boolean);
      }
    }

    if (identifiers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No roll numbers or emails found in the request or uploaded file',
      });
    }

    // Find student IDs matching roll numbers or emails
    const lowerIdentifiers = identifiers.map((i) => i.toLowerCase());
    const matchedUsers = await User.find({
      $or: [
        { rollOrFacultyId: { $in: identifiers } },
        { email: { $in: lowerIdentifiers } },
      ],
      role: 'student',
    }).select('_id rollOrFacultyId name');

    if (matchedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'None of the provided roll numbers or emails matched existing registered students',
      });
    }

    const userIds = matchedUsers.map((u) => u._id);

    // Add students to course using $addToSet (prevents duplicates)
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: { $each: userIds } },
    });

    const updatedCourse = await Course.findById(courseId)
      .populate('enrolledStudents', 'name email rollOrFacultyId');

    res.status(200).json({
      success: true,
      enrolledCount: userIds.length,
      totalEnrolledNow: updatedCourse.enrolledStudents.length,
      message: `Successfully enrolled ${userIds.length} students into ${course.courseCode} (${course.courseName})`,
    });
  } catch (error) {
    console.error('Error in bulkEnrollStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to bulk enroll students',
    });
  }
};
