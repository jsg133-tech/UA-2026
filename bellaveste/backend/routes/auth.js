const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');

const router = express.Router();

const DEFAULT_CATEGORIES = ['ELEGANT', 'GO OUT TO DINNER', 'CASUAL', 'SPORT'];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    // Create default categories for the new user
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((name) => ({ name, userId: user._id }))
    );

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/me  →  actualizar perfil del usuario
router.put('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, newPassword, currentPassword, avatar } = req.body;

    // Si quiere cambiar contraseña o email, verificar la actual
    if (newPassword || email) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
      const match = await user.comparePassword(currentPassword);
      if (!match) return res.status(401).json({ error: 'Wrong password' });
    }

    if (name)        user.name  = name.trim();
    if (email)       user.email = email.trim().toLowerCase();
    if (newPassword) user.password = newPassword;
    if (avatar)      user.avatar = avatar;

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
