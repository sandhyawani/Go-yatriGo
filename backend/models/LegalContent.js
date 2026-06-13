const mongoose = require('mongoose');

const legalContentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true, // e.g. 'privacy-policy', 'terms', 'community-guidelines', 'safety-guidelines'
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true // can be markdown or rich HTML
  }
}, { timestamps: true });

module.exports = mongoose.model('LegalContent', legalContentSchema);
