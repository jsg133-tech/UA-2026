const express  = require('express');
const Outfit   = require('../models/Outfit');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── OUTFITS GUARDADOS ─────────────────────────────────────────────────────────

// GET /api/armario  →  outfits que el usuario ha guardado de otros
router.get('/', async (req, res) => {
  try {
    const filtro = { savedBy: req.userId };
    if (req.query.categoria) filtro.category = req.query.categoria.toUpperCase();
    const outfits = await Outfit.find(filtro).populate('userId', 'name avatar').sort({ createdAt: -1 });
    res.json(outfits);
  } catch {
    res.status(500).json({ error: 'Error al obtener los outfits' });
  }
});

// POST /api/armario/:id  →  guardar outfit en el armario
router.post('/:id', async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);
    if (!outfit) return res.status(404).json({ error: 'Outfit no encontrado' });
    if (!outfit.savedBy.includes(req.userId)) {
      outfit.savedBy.push(req.userId);
      await outfit.save();
    }
    res.json({ message: 'Guardado en armario' });
  } catch {
    res.status(500).json({ error: 'Error al guardar' });
  }
});

// DELETE /api/armario/:id  →  quitar outfit del armario (no borra el outfit)
router.delete('/:id', async (req, res) => {
  try {
    await Outfit.findByIdAndUpdate(req.params.id, { $pull: { savedBy: req.userId } });
    res.json({ message: 'Quitado del armario' });
  } catch {
    res.status(500).json({ error: 'Error al quitar' });
  }
});

// ── CATEGORÍAS DEL ARMARIO ───────────────────────────────────────────────────

// GET /api/armario/categorias
router.get('/categorias', async (req, res) => {
  try {
    const cats = await Category.find({ userId: req.userId, armario: true }).sort({ name: 1 });
    res.json(cats);
  } catch {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST /api/armario/categorias
router.post('/categorias', async (req, res) => {
  try {
    const nombre = (req.body.name || '').trim().toUpperCase();
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const existe = await Category.findOne({ userId: req.userId, armario: true, name: nombre });
    if (existe) return res.status(409).json({ error: 'Esta categoría ya existe' });

    const cat = await Category.create({ name: nombre, userId: req.userId, armario: true });
    res.status(201).json(cat);
  } catch {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// DELETE /api/armario/categorias/:id
router.delete('/categorias/:id', async (req, res) => {
  try {
    const cat = await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId, armario: true });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

module.exports = router;
