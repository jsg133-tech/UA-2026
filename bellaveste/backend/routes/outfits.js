const express = require('express');
const multer  = require('multer');
const path    = require('path');
const Outfit  = require('../models/Outfit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Multer — memoria, máx 3 MB por archivo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|jfif/;
    const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype) || file.mimetype === 'image/jpeg';
    (extOk && mimeOk) ? cb(null, true) : cb(new Error('Only image files allowed'));
  },
});

// Convierte un archivo de multer a data URI (base64)
function toBase64(file) {
  if (!file || !file.buffer) return '';
  const mime = file.mimetype || 'image/jpeg';
  return `data:${mime};base64,${file.buffer.toString('base64')}`;
}

// GET /api/outfits
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const outfits = await Outfit.find(filter)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(outfits);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/outfits/:id  (público)
router.get('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id).populate('userId', 'name avatar');
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    res.json(outfit);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.use(authMiddleware);

// GET /api/outfits/mine  →  outfits creados por el usuario logueado
router.get('/mine', async (req, res) => {
  try {
    const outfits = await Outfit.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(outfits);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/outfits
router.post('/', upload.any(), async (req, res) => {
  try {
    const { name, category, season, color, pieces: piecesStr } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const mainFile = req.files?.find(f => f.fieldname === 'image');
    const imageUrl = toBase64(mainFile);

    let pieces = [];
    if (piecesStr) {
      try {
        const parsed = JSON.parse(piecesStr);
        if (Array.isArray(parsed)) {
          pieces = parsed.map((prenda, index) => {
            const pieceFile = req.files?.find(f => f.fieldname === `piece-image-${index}`);
            return {
              nombre:   prenda.nombre   || 'Piece',
              marca:    prenda.marca    || '',
              link:     prenda.link     || '',
              size:     prenda.size     || '',
              color:    prenda.color    || '',
              season:   prenda.season   || '',
              descripcion: prenda.descripcion || '',
              imageUrl: toBase64(pieceFile),
            };
          });
        }
      } catch (e) {
        console.error('Error parsing pieces:', e);
      }
    }

    const outfit = await Outfit.create({
      name,
      category: category || 'CASUAL',
      season:   season   || '',
      color:    color    || '',
      imageUrl,
      pieces,
      userId: req.userId,
    });

    res.status(201).json(outfit);
  } catch (err) {
    console.error('POST /api/outfits error:', err.stack || err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PUT /api/outfits/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.id, userId: req.userId });
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });

    const { name, category, size, color, season } = req.body;
    if (name)     outfit.name     = name;
    if (category) outfit.category = category;
    if (size)     outfit.size     = size;
    if (color)    outfit.color    = color;
    if (season)   outfit.season   = season;
    if (req.file) outfit.imageUrl = toBase64(req.file);

    await outfit.save();
    res.json(outfit);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/outfits/:id
router.delete('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    res.json({ message: 'Outfit deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
