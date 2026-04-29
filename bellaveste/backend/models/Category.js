const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:    { type: String,  required: true, trim: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  armario: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
