const mongoose = require('mongoose');

const prendaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  marca: { type: String, default: '' },
  link: { type: String, default: '' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  season: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
}, { _id: true });

const outfitSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'CASUAL', trim: true },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  season: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  pieces: [prendaSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Outfit', outfitSchema);
