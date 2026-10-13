const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissionTextOrUrl: {
      type: String,
      trim: true,
    },
    // Backward-compatible alias
    contentOrLink: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: String,
      trim: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
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
    deadline: {
      type: Date,
      required: true,
    },
    submissions: [submissionSchema],
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ courseId: 1, deadline: 1 });
assignmentSchema.index({ facultyId: 1 });
assignmentSchema.index({ 'submissions.studentId': 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
