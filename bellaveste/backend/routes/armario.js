const express  = require('express');
const Outfit   = require('../models/Outfit');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── CATEGORÍAS (deben ir ANTES que /:id para que Express no las capture) ──────

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

// ── OUTFITS GUARDADOS ─────────────────────────────────────────────────────────

// GET /api/armario
router.get('/', async (req, res) => {
  try {
    const outfits = await Outfit.find({ savedBy: req.userId })
      .populate('userId', 'name avatar').sort({ createdAt: -1 });

    const resultado = outfits.map(o => {
      const obj = o.toObject();
      const entry = (o.savedByCategories || []).find(
        e => e.userId?.toString() === req.userId?.toString()
      );
      obj.armarioCategoria = entry?.categoria || '';
      return obj;
    });

    if (req.query.categoria) {
      const cat = req.query.categoria.toUpperCase();
      return res.json(resultado.filter(o => (o.armarioCategoria || '').toUpperCase() === cat));
    }

    res.json(resultado);
  } catch {
    res.status(500).json({ error: 'Error al obtener los outfits' });
  }
});

// PUT /api/armario/:id/categoria  →  asignar categoría de armario al outfit guardado
router.put('/:id/categoria', async (req, res) => {
  try {
    const { categoria } = req.body;
    const outfit = await Outfit.findById(req.params.id);
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });

    // Guardar en savedByCategories (añadimos al modelo si no existe)
    if (!outfit.savedByCategories) outfit.savedByCategories = [];
    const entry = outfit.savedByCategories.find(e => e.userId?.toString() === req.userId?.toString());
    if (entry) {
      entry.categoria = categoria;
    } else {
      outfit.savedByCategories.push({ userId: req.userId, categoria });
    }
    outfit.markModified('savedByCategories');
    await outfit.save();
    res.json({ message: 'Category assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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

// DELETE /api/armario/:id  →  quitar outfit del armario
router.delete('/:id', async (req, res) => {
  try {
    await Outfit.findByIdAndUpdate(req.params.id, { $pull: { savedBy: req.userId } });
    res.json({ message: 'Quitado del armario' });
  } catch {
    res.status(500).json({ error: 'Error al quitar' });
  }
});

module.exports = router;
