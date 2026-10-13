const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    topicOrSlot: {
      type: String,
      default: 'Regular Lecture',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSessionSchema.index({ courseId: 1, date: 1 });
attendanceSessionSchema.index({ facultyId: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
