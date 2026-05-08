const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  texto:    { type: String, required: true, trim: true, maxlength: 500 },
  rating:   { type: Number, min: 1, max: 5, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
