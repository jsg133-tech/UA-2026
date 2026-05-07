const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hook: al eliminar un usuario, eliminar sus outfits y categorías
userSchema.pre('findOneAndDelete', async function (next) {
  const userId = this.getFilter()._id;
  try {
    const Outfit = require('./Outfit');
    const Category = require('./Category');
    // Eliminar todos los outfits del usuario
    await Outfit.deleteMany({ userId });
    // Eliminar todas las categorías del usuario
    await Category.deleteMany({ userId });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
