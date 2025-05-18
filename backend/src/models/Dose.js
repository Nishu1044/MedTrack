const mongoose = require('mongoose');

const doseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  takenTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'taken', 'missed', 'late'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
doseSchema.index({ user: 1, medication: 1, scheduledTime: 1 });

// Method to check if dose is late (more than 30 minutes)
doseSchema.methods.isLate = function() {
  if (!this.takenTime) return false;
  const minutesLate = (this.takenTime - this.scheduledTime) / (1000 * 60);
  return minutesLate > 30;
};

// Pre-save middleware to update status
doseSchema.pre('save', function(next) {
  if (this.takenTime) {
    this.status = this.isLate() ? 'late' : 'taken';
  } else if (new Date() > this.scheduledTime) {
    const minutesLate = (new Date() - this.scheduledTime) / (1000 * 60);
    this.status = minutesLate > 30 ? 'missed' : 'late';
  }
  next();
});

const Dose = mongoose.model('Dose', doseSchema);

module.exports = Dose; 