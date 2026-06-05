const router   = require('express').Router();
const verify   = require('../middleware/auth');
const supabase = require('../db/supabase');

// ─────────────────────────────────────────────
//  GET /api/box/inbox
//  Returns received items that are due (scheduled_at <= NOW).
// ─────────────────────────────────────────────
router.get('/inbox', verify, async (req, res) => {
  const uid = req.user.uid;

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      sender:sender_id ( id, username, display_name )
    `)
    .eq('receiver_id', uid)
    .eq('is_deleted', false)
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  GET /api/box/sent
//  Returns all items sent by the authenticated user.
// ─────────────────────────────────────────────
router.get('/sent', verify, async (req, res) => {
  const uid = req.user.uid;

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      receiver:receiver_id ( id, username, display_name )
    `)
    .eq('sender_id', uid)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─────────────────────────────────────────────
//  POST /api/box/send
//  Creates a new item in the receiver's box.
// ─────────────────────────────────────────────
router.post('/send', verify, async (req, res) => {
  const uid = req.user.uid;
  const {
    receiver_id,
    item_type,
    sender_alias,
    text_content,
    voice_url,
    image_url,
    scheduled_at,
  } = req.body;

  if (!receiver_id || !item_type) {
    return res.status(400).json({ error: 'receiver_id and item_type are required' });
  }

  // Cannot send to yourself
  if (receiver_id === uid) {
    return res.status(400).json({ error: 'You cannot send items to yourself' });
  }

  // Check if sender is blocked by receiver
  const { data: block } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', receiver_id)
    .eq('blocked_id', uid)
    .maybeSingle();
  if (block) return res.status(403).json({ error: 'Unable to send to this user' });

  // Verify receiver exists
  const { data: receiver } = await supabase
    .from('users').select('id').eq('id', receiver_id).maybeSingle();
  if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

  const { data, error } = await supabase
    .from('items')
    .insert({
      sender_id:    uid,
      receiver_id,
      item_type,
      sender_alias: sender_alias || 'display',
      text_content: text_content || null,
      voice_url:    voice_url    || null,
      image_url:    image_url    || null,
      scheduled_at: scheduled_at || new Date().toISOString(),
      is_deleted:   false,
      is_read:      false,
      reaction:     null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─────────────────────────────────────────────
//  DELETE /api/box/item/:id
//  Soft-deletes a received item.
// ─────────────────────────────────────────────
router.delete('/item/:id', verify, async (req, res) => {
  const { error } = await supabase
    .from('items')
    .update({ is_deleted: true })
    .eq('id', req.params.id)
    .eq('receiver_id', req.user.uid); // ensure ownership

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  PATCH /api/box/item/:id/read
//  Marks an item as read (read receipt).
// ─────────────────────────────────────────────
router.patch('/item/:id/read', verify, async (req, res) => {
  const { error } = await supabase
    .from('items')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('receiver_id', req.user.uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  PATCH /api/box/item/:id/react
//  Adds or removes a reaction stamp on an item.
// ─────────────────────────────────────────────
router.patch('/item/:id/react', verify, async (req, res) => {
  const { reaction } = req.body; // e.g. '❤️' | '⭐' | '🕊️' | null (to clear)

  const { error } = await supabase
    .from('items')
    .update({ reaction: reaction || null })
    .eq('id', req.params.id)
    .eq('receiver_id', req.user.uid);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
