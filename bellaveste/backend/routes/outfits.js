const express = require('express');
const multer = require('multer');
const path = require('path');
const Outfit = require('../models/Outfit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Multer config — store in uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files allowed'));
  },
});

// GET /api/outfits  (optional ?category=ELEGANT)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const outfits = await Outfit.find(filter).sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/outfits
router.use(authMiddleware);

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, size, color, season } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : '';

    const outfit = await Outfit.create({
      name, category, size, color, season, imageUrl,
      userId: req.userId,
    });
    res.status(201).json(outfit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/outfits/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.id, userId: req.userId });
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });

    const { name, category, size, color, season } = req.body;
    if (name)     outfit.name = name;
    if (category) outfit.category = category;
    if (size)     outfit.size = size;
    if (color)    outfit.color = color;
    if (season)   outfit.season = season;
    if (req.file) {
      outfit.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await outfit.save();
    res.json(outfit);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/outfits/:id
router.delete('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    res.json({ message: 'Outfit deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
