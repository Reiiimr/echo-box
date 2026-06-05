const router   = require('express').Router();
const verify   = require('../middleware/auth');
const supabase = require('../db/supabase');

// POST /api/blocks — block a user
router.post('/', verify, async (req, res) => {
  const { target_id } = req.body;
  if (!target_id) return res.status(400).json({ error: 'target_id required' });
  if (target_id === req.user.uid) return res.status(400).json({ error: 'Cannot block yourself' });

  const { data, error } = await supabase
    .from('blocks')
    .insert({ blocker_id: req.user.uid, blocked_id: target_id })
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/blocks/:target_id — unblock a user
router.delete('/:target_id', verify, async (req, res) => {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', req.user.uid)
    .eq('blocked_id', req.params.target_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/blocks — list blocked users
router.get('/', verify, async (req, res) => {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, blocked:blocked_id ( username, display_name )')
    .eq('blocker_id', req.user.uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/blocks/check/:target_id — check if user is blocked
router.get('/check/:target_id', verify, async (req, res) => {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', req.user.uid)
    .eq('blocked_id', req.params.target_id)
    .maybeSingle();

  res.json({ blocked: !!data });
});

module.exports = router;
