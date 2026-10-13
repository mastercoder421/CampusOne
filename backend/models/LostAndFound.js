const mongoose = require('mongoose');

const lostAndFoundSchema = new mongoose.Schema(
  {
    itemTitle: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Lost', 'Found'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    contactInfo: {
      type: String,
      required: true,
      trim: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

lostAndFoundSchema.index({ isResolved: 1, type: 1 });
lostAndFoundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LostAndFound', lostAndFoundSchema);
