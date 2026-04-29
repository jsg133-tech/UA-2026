const express  = require('express');
const Outfit   = require('../models/Outfit');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── OUTFITS ──────────────────────────────────────────────────────────────────

// GET /api/armario
router.get('/', async (req, res) => {
  try {
    const filtro = { userId: req.userId };
    if (req.query.categoria) filtro.category = req.query.categoria.toUpperCase();
    const outfits = await Outfit.find(filtro).sort({ createdAt: -1 });
    res.json(outfits);
  } catch {
    res.status(500).json({ error: 'Error al obtener los outfits' });
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
