const RoomBooking = require('../models/RoomBooking');

// @desc    Get room bookings
// @route   GET /api/rooms
// @access  Private
exports.getRoomBookings = async (req, res) => {
  try {
    const query = {};
    if (req.query.roomNumber) query.roomNumber = req.query.roomNumber;
    if (req.query.status) query.status = req.query.status;

    const bookings = await RoomBooking.find(query)
      .populate('bookedBy', 'name email department role rollOrFacultyId')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching room bookings',
    });
  }
};

// @desc    Request a room booking
// @route   POST /api/rooms
// @access  Private
exports.createRoomBooking = async (req, res) => {
  try {
    const { roomNumber, date, timeSlot, purpose } = req.body;

    if (!roomNumber || !date || !timeSlot || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'roomNumber, date, timeSlot, and purpose are required',
      });
    }

    const parsedDate = new Date(date);
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingBooking = await RoomBooking.findOne({
      roomNumber,
      timeSlot,
      status: 'Approved',
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber} is already booked and approved for ${timeSlot} on that date`,
      });
    }

    const booking = await RoomBooking.create({
      roomNumber,
      bookedBy: req.user._id,
      date: parsedDate,
      timeSlot,
      purpose,
      status: req.user.role === 'admin' ? 'Approved' : 'Pending',
    });

    const populated = await RoomBooking.findById(booking._id).populate(
      'bookedBy',
      'name email department role rollOrFacultyId'
    );

    res.status(201).json({
      success: true,
      message: 'Room booking request submitted',
      booking: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error booking room',
    });
  }
};

// @desc    Update room booking status (Admin / Faculty approval)
// @route   PATCH /api/rooms/:id/status
// @access  Private (Admin / Faculty)
exports.updateRoomBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status: must be Pending, Approved, or Rejected',
      });
    }

    const booking = await RoomBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Room booking not found',
      });
    }

    booking.status = status;
    await booking.save();

    const populated = await RoomBooking.findById(id).populate(
      'bookedBy',
      'name email department role rollOrFacultyId'
    );

    res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()}`,
      booking: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating booking status',
    });
  }
};
