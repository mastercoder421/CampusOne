const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

roomBookingSchema.index({ roomNumber: 1, date: 1, timeSlot: 1 });
roomBookingSchema.index({ bookedBy: 1 });
roomBookingSchema.index({ status: 1 });

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
