const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ courseId })
      .populate('facultyId', 'name email department')
      .populate('courseId', 'courseCode courseName')
      .populate('submissions.studentId', 'name email rollOrFacultyId')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching course assignments',
    });
  }
};

// @desc    Get all assignments accessible to current user
// @route   GET /api/assignments
// @access  Private
exports.getAllAssignments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'faculty') {
      query = { facultyId: req.user._id };
    } else if (req.user.role === 'student') {
      const studentCourses = await Course.find({
        enrolledStudents: req.user._id,
      }).select('_id');
      const courseIds = studentCourses.map((c) => c._id);
      query = { courseId: { $in: courseIds } };
    }

    const assignments = await Assignment.find(query)
      .populate('courseId', 'courseCode courseName')
      .populate('facultyId', 'name email department')
      .populate('submissions.studentId', 'name email rollOrFacultyId')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching assignments',
    });
  }
};

// @desc    Create new assignment (Faculty only)
// @route   POST /api/assignments/create
// @access  Private (Faculty / Admin)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, deadline } = req.body;

    if (!title || !description || !courseId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, courseId, and deadline',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      course.facultyId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the faculty assigned to this course can post assignments',
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      courseId,
      facultyId: req.user._id,
      deadline: new Date(deadline),
      submissions: [],
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('courseId', 'courseCode courseName')
      .populate('facultyId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating assignment',
    });
  }
};

// @desc    Submit assignment (Student only)
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const textOrUrl = req.body.submissionTextOrUrl || req.body.contentOrLink;

    if (!textOrUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide submission text or URL (submissionTextOrUrl)',
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check enrollment
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Associated course not found',
      });
    }

    const isEnrolled = course.enrolledStudents.some(
      (sId) => sId.toString() === req.user._id.toString()
    );
    if (!isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course',
      });
    }

    // Check existing submission
    const existingIndex = assignment.submissions.findIndex(
      (sub) => sub.studentId && sub.studentId.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      assignment.submissions[existingIndex].submissionTextOrUrl = textOrUrl;
      assignment.submissions[existingIndex].contentOrLink = textOrUrl;
      assignment.submissions[existingIndex].submittedAt = new Date();
    } else {
      assignment.submissions.push({
        studentId: req.user._id,
        submissionTextOrUrl: textOrUrl,
        contentOrLink: textOrUrl,
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    const updated = await Assignment.findById(id)
      .populate('courseId', 'courseCode courseName')
      .populate('submissions.studentId', 'name email rollOrFacultyId');

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      assignment: updated,
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting assignment',
    });
  }
};

// @desc    Grade submission (Faculty only)
// @route   PUT /api/assignments/:id/grade
// @access  Private (Faculty / Admin)
exports.gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, grade, feedback } = req.body;

    if (!studentId || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId and grade',
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const submissionIndex = assignment.submissions.findIndex(
      (sub) => sub.studentId && sub.studentId.toString() === studentId.toString()
    );

    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission for this student not found',
      });
    }

    assignment.submissions[submissionIndex].grade = grade;
    if (feedback !== undefined) {
      assignment.submissions[submissionIndex].feedback = feedback;
    }

    await assignment.save();

    const updated = await Assignment.findById(id)
      .populate('courseId', 'courseCode courseName')
      .populate('submissions.studentId', 'name email rollOrFacultyId');

    res.status(200).json({
      success: true,
      message: 'Graded successfully',
      assignment: updated,
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error grading submission',
    });
  }
};
