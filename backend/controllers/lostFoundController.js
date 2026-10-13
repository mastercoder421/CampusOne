const LostAndFound = require('../models/LostAndFound');

// @desc    Get all lost & found items
// @route   GET /api/lost-found
// @access  Private
exports.getLostFoundItems = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.resolved !== undefined) {
      query.isResolved = req.query.resolved === 'true';
    }

    const items = await LostAndFound.find(query)
      .populate('reportedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching lost & found items',
    });
  }
};

// @desc    Report new lost or found item
// @route   POST /api/lost-found
// @access  Private
exports.createLostFoundItem = async (req, res) => {
  try {
    const { itemTitle, type, description, location, contactInfo } = req.body;

    if (!itemTitle || !type || !description || !location || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'All item details are required',
      });
    }

    const item = await LostAndFound.create({
      itemTitle,
      type,
      description,
      location,
      contactInfo,
      reportedBy: req.user._id,
      isResolved: false,
    });

    const populated = await LostAndFound.findById(item._id).populate(
      'reportedBy',
      'name email department'
    );

    res.status(201).json({
      success: true,
      message: 'Item reported successfully',
      item: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reporting item',
    });
  }
};

// @desc    Toggle resolved status for a lost & found notice
// @route   PATCH /api/lost-found/:id/resolve
// @access  Private
exports.resolveLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostAndFound.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (
      req.user.role === 'student' &&
      item.reportedBy &&
      item.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to resolve this notice',
      });
    }

    item.isResolved = !item.isResolved;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Item marked as ${item.isResolved ? 'Resolved' : 'Active'}`,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error resolving item',
    });
  }
};
