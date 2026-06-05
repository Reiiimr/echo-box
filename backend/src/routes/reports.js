const router   = require('express').Router();
const verify   = require('../middleware/auth');
const supabase = require('../db/supabase');

// POST /api/reports — report a user
router.post('/', verify, async (req, res) => {
  const { reported_id, reason } = req.body;
  if (!reported_id) return res.status(400).json({ error: 'reported_id required' });
  if (reported_id === req.user.uid) return res.status(400).json({ error: 'Cannot report yourself' });

  const { data, error } = await supabase
    .from('reports')
    .insert({ reporter_id: req.user.uid, reported_id, reason: reason || null })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
