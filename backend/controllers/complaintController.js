const Complaint = require('../models/Complaint');

// @desc    Get complaints (Student: own; Faculty/Admin: all)
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const complaints = await Complaint.find(query)
      .populate('studentId', 'name email rollOrFacultyId department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching complaints',
    });
  }
};

// @desc    File a new complaint / grievance
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required',
      });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      studentId: req.user._id,
      status: 'Pending',
    });

    const populated = await Complaint.findById(complaint._id).populate(
      'studentId',
      'name email rollOrFacultyId department'
    );

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      complaint: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating complaint',
    });
  }
};

// @desc    Update complaint status & resolution notes
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin / Faculty)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    complaint.status = status;
    if (resolutionNotes !== undefined) {
      complaint.resolutionNotes = resolutionNotes;
    }

    await complaint.save();

    const populated = await Complaint.findById(id).populate(
      'studentId',
      'name email rollOrFacultyId department'
    );

    res.status(200).json({
      success: true,
      message: `Complaint marked as ${status}`,
      complaint: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating complaint',
    });
  }
};
