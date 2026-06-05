const router   = require('express').Router();
const verify   = require('../middleware/auth');
const supabase = require('../db/supabase');
const admin    = require('../firebase-admin');

// ─────────────────────────────────────────────
//  POST /api/users/setup
//  Creates a user row after first Google login.
// ─────────────────────────────────────────────
router.post('/setup', verify, async (req, res) => {
  const { username, display_name, bio, gender, age, box_name, box_color } = req.body;
  const uid = req.user.uid;

  if (!username || !display_name || !gender || !age) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check username availability
  const { data: taken } = await supabase
    .from('users').select('id').eq('username', username).maybeSingle();
  if (taken) return res.status(409).json({ error: 'Username already taken' });

  const { data, error } = await supabase
    .from('users')
    .insert({
      id:           uid,
      username:     username.toLowerCase(),
      display_name,
      bio:          bio || null,
      gender,
      age:          parseInt(age, 10),
      box_name:     box_name || 'My Box',
      box_color:    box_color || '#8b6440',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─────────────────────────────────────────────
//  GET /api/users/me
//  Fetches the authenticated user's full profile.
// ─────────────────────────────────────────────
router.get('/me', verify, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('*').eq('id', req.user.uid).maybeSingle();
  if (error || !data) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

// ─────────────────────────────────────────────
//  PUT /api/users/profile
//  Updates mutable profile fields.
//  gender and age are intentionally excluded.
// ─────────────────────────────────────────────
router.put('/profile', verify, async (req, res) => {
  const { username, display_name, bio, box_name, box_color } = req.body;
  const uid = req.user.uid;
  const updates = {};

  if (username) {
    const newUsername = username.toLowerCase();
    const { data: taken } = await supabase
      .from('users').select('id').eq('username', newUsername).neq('id', uid).maybeSingle();
    if (taken) return res.status(409).json({ error: 'Username already taken' });
    updates.username = newUsername;
  }
  if (display_name)          updates.display_name = display_name;
  if (bio !== undefined)     updates.bio          = bio;
  if (box_name)              updates.box_name     = box_name;
  if (box_color)             updates.box_color    = box_color;

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', uid).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  GET /api/users/search?q=...
//  Search users by username (partial match).
// ─────────────────────────────────────────────
router.get('/search', verify, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.status(400).json({ error: 'Query required' });

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, bio, box_name, box_color')
    .ilike('username', `%${q.trim()}%`)
    .neq('id', req.user.uid)
    .limit(25);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  GET /api/users/:username
//  Fetches a public box profile by username.
// ─────────────────────────────────────────────
router.get('/:username', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, bio, box_name, box_color, gender, created_at')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// ─────────────────────────────────────────────
//  DELETE /api/users/account
//  Deletes the user's Supabase row + Firebase account.
// ─────────────────────────────────────────────
router.delete('/account', verify, async (req, res) => {
  const uid = req.user.uid;
  const { error } = await supabase.from('users').delete().eq('id', uid);
  if (error) return res.status(500).json({ error: error.message });

  try { await admin.auth().deleteUser(uid); } catch { /* ignore */ }
  res.json({ success: true });
});

module.exports = router;
