const mongoose = require('mongoose');
// dose
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
doseSchema.index({ user: 1, status: 1 });

// Method to check if dose is late (more than 4 hours)
doseSchema.methods.isLate = function() {
  if (!this.takenTime) return false;
  const hoursLate = (this.takenTime - this.scheduledTime) / (1000 * 60 * 60);
  return hoursLate > 4;
};

// Pre-save middleware to update status
doseSchema.pre('save', function(next) {
  if (this.takenTime) {
    this.status = this.isLate() ? 'late' : 'taken';
  } else if (new Date() > this.scheduledTime) {
    this.status = 'missed';
  }
  next();
});

module.exports = mongoose.model('Dose', doseSchema); 