const express = require('express');
const Outfit = require('../models/Outfit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/armario — outfits del usuario logueado (filtro opcional ?categoria=)
router.get('/', async (req, res) => {
  try {
    const filtro = { userId: req.userId };
    if (req.query.categoria) filtro.category = req.query.categoria.toUpperCase();

    const outfits = await Outfit.find(filtro).sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los outfits' });
  }
});

module.exports = router;
