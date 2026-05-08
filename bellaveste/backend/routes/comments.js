const express = require('express');
const Comment = require('../models/Comment');
const auth    = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // hereda :outfitId

// GET /api/outfits/:outfitId/comments
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ outfitId: req.params.outfitId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    const avg = comments.length
      ? (comments.reduce((s, c) => s + c.rating, 0) / comments.length).toFixed(1)
      : null;

    res.json({ comments, avg, total: comments.length });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/outfits/:outfitId/comments  (auth)
router.post('/', auth, async (req, res) => {
  try {
    const { texto, rating } = req.body;
    if (!texto || !rating) return res.status(400).json({ error: 'Text and rating are required' });

    const existing = await Comment.findOne({ outfitId: req.params.outfitId, userId: req.userId });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this outfit' });

    const comment = await Comment.create({
      outfitId: req.params.outfitId,
      userId:   req.userId,
      texto:    texto.trim(),
      rating:   Number(rating),
    });

    const populated = await comment.populate('userId', 'name avatar');
    res.status(201).json(populated);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/outfits/:outfitId/comments/:id  (solo el autor)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
