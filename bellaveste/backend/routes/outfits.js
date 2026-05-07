const express = require('express');
const multer = require('multer');
const DataUri = require('datauri/parser');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const Outfit = require('../models/Outfit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const parser = new DataUri();

// Multer config — guardar en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|jfif/;
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
    const outfits = await Outfit.find(filter).populate('userId', 'name avatar').sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/outfits
router.use(authMiddleware);

// Helper para subir a Cloudinary — devuelve '' si falla en vez de lanzar
async function uploadToCloudinary(file, folder, publicId) {
  if (!file) return '';
  try {
    const dataUriString = parser.format(path.extname(file.originalname).toString(), file.buffer);
    if (!dataUriString || !dataUriString.content) return '';
    const result = await cloudinary.uploader.upload(dataUriString.content, {
      folder,
      public_id: publicId,
      overwrite: true,
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    return '';
  }
}

router.post('/', upload.any(), async (req, res) => {
  try {
    const { name, category, pieces: piecesStr } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Encontrar archivo de imagen del outfit
    const mainImageFile = req.files?.find(f => f.fieldname === 'image');
    
    // Subir imagen del outfit a Cloudinary
    const outfitId = `outfit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const imageUrl = mainImageFile 
      ? await uploadToCloudinary(mainImageFile, 'bellaveste/outfits', outfitId)
      : '';

    // Procesar prendas
    let pieces = [];
    if (piecesStr) {
      try {
        const parsedPieces = JSON.parse(piecesStr);
        if (Array.isArray(parsedPieces)) {
          for (let index = 0; index < parsedPieces.length; index++) {
            const prenda = parsedPieces[index];
            const prendaImageFile = req.files?.find(f => f.fieldname === `piece-image-${index}`);
            
            // Subir imagen de la prenda
            const prendaId = `piece-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            const prendaImageUrl = prendaImageFile
              ? await uploadToCloudinary(prendaImageFile, 'bellaveste/pieces', prendaId)
              : '';
            
            pieces.push({
              nombre: prenda.nombre || 'Piece',
              marca: prenda.marca || '',
              link: prenda.link || '',
              size: prenda.size || '',
              color: prenda.color || '',
              season: prenda.season || '',
              imageUrl: prendaImageUrl,
              cloudinaryPublicId: prendaImageUrl ? prendaId : '',
            });
          }
        }
      } catch (e) {
        console.error('Error parsing pieces:', e);
      }
    }

    const outfit = await Outfit.create({
      name,
      category: category || 'CASUAL',
      imageUrl,
      cloudinaryPublicId: imageUrl ? outfitId : '',
      pieces,
      userId: req.userId,
    });
    
    res.status(201).json(outfit);
  } catch (err) {
    console.error('POST /api/outfits error:', err && err.stack ? err.stack : err);
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
    
    // Eliminar imagen del outfit de Cloudinary
    if (outfit.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(outfit.cloudinaryPublicId);
    }
    
    // Eliminar imágenes de las prendas de Cloudinary
    if (outfit.pieces && Array.isArray(outfit.pieces)) {
      for (const prenda of outfit.pieces) {
        if (prenda.cloudinaryPublicId) {
          await cloudinary.uploader.destroy(prenda.cloudinaryPublicId);
        }
      }
    }
    
    res.json({ message: 'Outfit deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
