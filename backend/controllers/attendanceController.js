const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get courses accessible to current user (Faculty: taught; Student: enrolled; Admin: all)
// @route   GET /api/attendance/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'faculty') {
      query = { facultyId: req.user._id };
    } else if (req.user.role === 'student') {
      query = { enrolledStudents: req.user._id };
    }
    // Admin gets all courses

    const courses = await Course.find(query)
      .populate('facultyId', 'name email department rollOrFacultyId')
      .populate('enrolledStudents', 'name email rollOrFacultyId department')
      .sort({ courseCode: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching courses',
    });
  }
};

// @desc    Fetch all students enrolled in a course
// @route   GET /api/attendance/course/:courseId/students
// @access  Private
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate(
      'enrolledStudents',
      'name email rollOrFacultyId department'
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      students: course.enrolledStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching course students',
    });
  }
};

// @desc    Mark attendance for a session using bulkWrite upsert
// @route   POST /api/attendance/mark
// @access  Private (Faculty or Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, date, topicOrSlot, records } = req.body;

    if (!courseId || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and records array are required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Verify faculty owns this course or is admin
    if (
      req.user.role !== 'admin' &&
      course.facultyId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this course',
      });
    }

    const sessionDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slot = topicOrSlot || 'Regular Lecture';

    // Find existing session on this day with same topic, or create new
    let session = await AttendanceSession.findOne({
      courseId,
      topicOrSlot: slot,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!session) {
      session = await AttendanceSession.create({
        courseId,
        facultyId: req.user._id,
        date: sessionDate,
        topicOrSlot: slot,
      });
    }

    // Build bulkWrite operations with upsert: true
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: {
          sessionId: session._id,
          studentId: record.studentId,
        },
        update: {
          $set: {
            sessionId: session._id,
            studentId: record.studentId,
            courseId: course._id,
            status: record.status || 'Present',
            markedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await AttendanceRecord.bulkWrite(bulkOps);
    }

    // Fetch saved records for confirmation
    const savedRecords = await AttendanceRecord.find({ sessionId: session._id })
      .populate('studentId', 'name email rollOrFacultyId')
      .sort({ 'studentId.rollOrFacultyId': 1 });

    res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${records.length} students`,
      session,
      records: savedRecords,
    });
  } catch (error) {
    console.error('Error in markAttendance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking attendance',
    });
  }
};

// @desc    Get course sessions and computed attendance rate per student
// @route   GET /api/attendance/course-stats/:courseId
// @access  Private
exports.getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('facultyId', 'name email')
      .populate('enrolledStudents', 'name email rollOrFacultyId');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Fetch all sessions for this course
    const sessions = await AttendanceSession.find({ courseId })
      .sort({ date: -1 })
      .populate('facultyId', 'name');

    // Fetch all attendance records for this course
    const records = await AttendanceRecord.find({ courseId }).populate(
      'studentId',
      'name email rollOrFacultyId'
    );

    // Compute stats per student
    const totalSessions = sessions.length;
    const studentStats = course.enrolledStudents.map((student) => {
      const studentRecords = records.filter(
        (r) =>
          r.studentId &&
          r.studentId._id.toString() === student._id.toString()
      );

      const presentCount = studentRecords.filter(
        (r) => r.status === 'Present'
      ).length;
      const lateCount = studentRecords.filter(
        (r) => r.status === 'Late'
      ).length;
      const absentCount = studentRecords.filter(
        (r) => r.status === 'Absent'
      ).length;

      // Present + Late counts towards attended (Late can be full or half credit; here counted as attended)
      const attendedCount = presentCount + lateCount;
      const percentage =
        totalSessions > 0
          ? Math.round((attendedCount / totalSessions) * 100)
          : 100;

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollOrFacultyId: student.rollOrFacultyId,
        },
        totalSessions,
        attendedCount,
        presentCount,
        lateCount,
        absentCount,
        percentage,
        isCritical: percentage < 75,
      };
    });

    res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        department: course.department,
        faculty: course.facultyId,
      },
      totalSessions,
      sessions,
      studentStats,
    });
  } catch (error) {
    console.error('Error in getCourseStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching course statistics',
    });
  }
};

// @desc    Get attendance summary for the authenticated student
// @route   GET /api/attendance/my-summary
// @access  Private (Student)
exports.getMySummary = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find all courses where this student is enrolled
    const courses = await Course.find({ enrolledStudents: studentId }).populate(
      'facultyId',
      'name email'
    );

    const summaries = await Promise.all(
      courses.map(async (course) => {
        const sessions = await AttendanceSession.find({
          courseId: course._id,
        }).sort({ date: -1 });

        const totalClasses = sessions.length;

        const records = await AttendanceRecord.find({
          courseId: course._id,
          studentId: studentId,
        })
          .populate('sessionId', 'date topicOrSlot')
          .sort({ markedAt: -1 });

        const presentCount = records.filter(
          (r) => r.status === 'Present'
        ).length;
        const lateCount = records.filter((r) => r.status === 'Late').length;
        const absentCount = records.filter((r) => r.status === 'Absent').length;
        const attendedCount = presentCount + lateCount;

        const percentage =
          totalClasses > 0
            ? Math.round((attendedCount / totalClasses) * 100)
            : 100;

        return {
          courseId: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          faculty: course.facultyId ? course.facultyId.name : 'Unknown',
          totalClasses,
          attendedCount,
          presentCount,
          lateCount,
          absentCount,
          percentage,
          isCritical: percentage < 75,
          history: records.map((r) => ({
            id: r._id,
            date: r.sessionId ? r.sessionId.date : r.markedAt,
            topic: r.sessionId ? r.sessionId.topicOrSlot : 'Class Lecture',
            status: r.status,
          })),
        };
      })
    );

    // Compute overall metrics
    const totalConducted = summaries.reduce(
      (acc, curr) => acc + curr.totalClasses,
      0
    );
    const totalAttended = summaries.reduce(
      (acc, curr) => acc + curr.attendedCount,
      0
    );
    const overallPercentage =
      totalConducted > 0
        ? Math.round((totalAttended / totalConducted) * 100)
        : 100;

    res.status(200).json({
      success: true,
      overallPercentage,
      isOverallCritical: overallPercentage < 75,
      totalConducted,
      totalAttended,
      courses: summaries,
    });
  } catch (error) {
    console.error('Error in getMySummary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching student summary',
    });
  }
};

// @desc    Admin/Faculty: Create a new course
// @route   POST /api/attendance/courses
// @access  Private (Admin / Faculty)
exports.createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, department, facultyId, enrolledStudents } =
      req.body;

    const assignedFaculty = facultyId || req.user._id;

    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      department: department || 'Computer Science',
      facultyId: assignedFaculty,
      enrolledStudents: enrolledStudents || [],
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
