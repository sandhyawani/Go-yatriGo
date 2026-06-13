const mongoose = require('mongoose');

const reportProblemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  screenshot: {
    type: String
  },
  status: {
    type: String,
    enum: ['Open', 'Resolved', 'Closed'],
    default: 'Open'
  }
}, { timestamps: true });

module.exports = mongoose.model('ReportProblem', reportProblemSchema);
