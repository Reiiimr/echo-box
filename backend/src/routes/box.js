const router   = require('express').Router();
const verify   = require('../middleware/auth');
const supabase = require('../db/supabase');
const admin    = require('../firebase-admin');

// ── Optional auth — attaches user if token present, doesn't reject ──
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = await admin.auth().verifyIdToken(header.split('Bearer ')[1]);
      req.user = decoded;
    }
  } catch { /* anonymous is fine */ }
  next();
}

// ─────────────────────────────────────────────
//  GET /api/box/inbox
// ─────────────────────────────────────────────
router.get('/inbox', verify, async (req, res) => {
  const uid = req.user.uid;
  const { data, error } = await supabase
    .from('items')
    .select(`*, sender:sender_id ( id, username, display_name )`)
    .eq('receiver_id', uid)
    .eq('is_deleted', false)
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  GET /api/box/sent
// ─────────────────────────────────────────────
router.get('/sent', verify, async (req, res) => {
  const uid = req.user.uid;
  const { data, error } = await supabase
    .from('items')
    .select(`*, receiver:receiver_id ( id, username, display_name )`)
    .eq('sender_id', uid)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  POST /api/box/send   (authenticated)
// ─────────────────────────────────────────────
router.post('/send', verify, async (req, res) => {
  const uid = req.user.uid;
  const { receiver_id, item_type, sender_alias, text_content, voice_url, image_url, scheduled_at } = req.body;

  if (!receiver_id || !item_type)
    return res.status(400).json({ error: 'receiver_id and item_type are required' });
  if (receiver_id === uid)
    return res.status(400).json({ error: 'You cannot send items to yourself' });

  const { data: block } = await supabase.from('blocks').select('id')
    .eq('blocker_id', receiver_id).eq('blocked_id', uid).maybeSingle();
  if (block) return res.status(403).json({ error: 'Unable to send to this user' });

  const { data: receiver } = await supabase.from('users').select('id').eq('id', receiver_id).maybeSingle();
  if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

  const { data, error } = await supabase.from('items').insert({
    sender_id: uid, receiver_id, item_type,
    sender_alias: sender_alias || 'display',
    text_content: text_content || null,
    voice_url:    voice_url    || null,
    image_url:    image_url    || null,
    scheduled_at: scheduled_at || new Date().toISOString(),
    is_deleted: false, is_read: false, reaction: null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─────────────────────────────────────────────
//  POST /api/box/send-anonymous
//  Text: no login needed.
//  Images/voice: uploaded client-side; login optional.
// ─────────────────────────────────────────────
router.post('/send-anonymous', optionalAuth, async (req, res) => {
  const { receiver_id, item_type, text_content, voice_url, image_url } = req.body;

  if (!receiver_id || !item_type)
    return res.status(400).json({ error: 'receiver_id and item_type are required' });
  if (req.user && receiver_id === req.user.uid)
    return res.status(400).json({ error: 'You cannot send items to yourself' });

  // Block check (only if sender is logged in)
  if (req.user) {
    const { data: block } = await supabase.from('blocks').select('id')
      .eq('blocker_id', receiver_id).eq('blocked_id', req.user.uid).maybeSingle();
    if (block) return res.status(403).json({ error: 'Unable to send to this user' });
  }

  const { data: receiver } = await supabase.from('users').select('id').eq('id', receiver_id).maybeSingle();
  if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

  const { data, error } = await supabase.from('items').insert({
    sender_id:    req.user?.uid || null,  // null = truly anonymous
    receiver_id,
    item_type,
    sender_alias: 'anonymous',
    text_content: text_content || null,
    voice_url:    voice_url    || null,
    image_url:    image_url    || null,
    scheduled_at: new Date().toISOString(),
    is_deleted: false, is_read: false, reaction: null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─────────────────────────────────────────────
//  DELETE /api/box/item/:id
// ─────────────────────────────────────────────
router.delete('/item/:id', verify, async (req, res) => {
  const { error } = await supabase.from('items')
    .update({ is_deleted: true }).eq('id', req.params.id).eq('receiver_id', req.user.uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  PATCH /api/box/item/:id/read
// ─────────────────────────────────────────────
router.patch('/item/:id/read', verify, async (req, res) => {
  const { error } = await supabase.from('items')
    .update({ is_read: true }).eq('id', req.params.id).eq('receiver_id', req.user.uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  PATCH /api/box/item/:id/react
// ─────────────────────────────────────────────
router.patch('/item/:id/react', verify, async (req, res) => {
  const { reaction } = req.body;
  const { error } = await supabase.from('items')
    .update({ reaction: reaction || null }).eq('id', req.params.id).eq('receiver_id', req.user.uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
