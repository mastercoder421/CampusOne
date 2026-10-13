const CampusEvent = require('../models/CampusEvent');

// @desc    Get all campus events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const events = await CampusEvent.find()
      .populate('organizer', 'name email department')
      .populate('rsvps', 'name email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching events',
    });
  }
};

// @desc    Create a new campus event
// @route   POST /api/events
// @access  Private (Admin / Faculty / Student Organizer)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venue, clubName } = req.body;

    if (!title || !description || !date || !venue || !clubName) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, description, date, venue, clubName) are required',
      });
    }

    const event = await CampusEvent.create({
      title,
      description,
      date: new Date(date),
      venue,
      clubName,
      organizer: req.user._id,
      rsvps: [],
    });

    const populated = await CampusEvent.findById(event._id).populate(
      'organizer',
      'name email department'
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating event',
    });
  }
};

// @desc    Toggle RSVP for an event
// @route   POST /api/events/:id/rsvp
// @access  Private
exports.toggleRsvp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await CampusEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const index = event.rsvps.findIndex((r) => r.toString() === userId.toString());
    let rsvpStatus;

    if (index > -1) {
      event.rsvps.splice(index, 1);
      rsvpStatus = false;
    } else {
      event.rsvps.push(userId);
      rsvpStatus = true;
    }

    await event.save();

    const updated = await CampusEvent.findById(id)
      .populate('organizer', 'name email department')
      .populate('rsvps', 'name email');

    res.status(200).json({
      success: true,
      rsvpStatus,
      rsvpCount: updated.rsvps.length,
      event: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling RSVP',
    });
  }
};
