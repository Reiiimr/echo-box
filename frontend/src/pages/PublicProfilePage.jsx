import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getUserByName } from '../services/api';
import BoxDisplay from '../components/BoxDisplay';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function uploadPublicFile(file, type = 'images') {
  const ext  = file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg');
  const path = `${type}/anon_${Date.now()}.${ext}`;
  const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/uploads/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed');
  return `${SUPABASE_URL}/storage/v1/object/public/uploads/${path}`;
}

const ITEM_TYPES = [
  { key: 'cassette', icon: '📼', label: 'Cassette Tape', desc: 'Voice + short note' },
  { key: 'mail',     icon: '✉️',  label: 'Mail',          desc: 'Letter + optional image' },
  { key: 'package',  icon: '📦', label: 'Package',       desc: 'Text, image & voice' },
];

export default function PublicProfilePage() {
  const { username }              = useParams();
  const { currentUser, dbUser }   = useAuth();
  const navigate                  = useNavigate();

  const [boxUser,    setBoxUser]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [step,       setStep]       = useState('view');   // 'view' | 'type' | 'compose'
  const [itemType,   setItemType]   = useState('');
  const [text,       setText]       = useState('');
  const [imageFile,  setImageFile]  = useState(null);
  const [audioBlob,  setAudioBlob]  = useState(null);
  const [recording,  setRecording]  = useState(false);
  const [sending,    setSending]    = useState(false);

  const mrRef      = useRef(null);
  const chunksRef  = useRef([]);
  const imageRef   = useRef(null);

  const isOwnBox = currentUser && dbUser?.username === username;

  useEffect(() => {
    getUserByName(username)
      .then(({ data }) => setBoxUser(data))
      .catch(() => { toast.error('User not found'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [username]);

  // ── redirect own box to /box ───────────────────────────
  useEffect(() => {
    if (!loading && isOwnBox) navigate('/box', { replace: true });
  }, [loading, isOwnBox]);

  // ── voice recording ────────────────────────────────────
  const startRecording = async () => {
    if (!currentUser) { toast.error('Sign in to send voice messages.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch { toast.error('Microphone access denied.'); }
  };
  const stopRecording = () => { mrRef.current?.stop(); setRecording(false); };

  // ── send ───────────────────────────────────────────────
  const handleSend = async () => {
    if (!text && !audioBlob && !imageFile) {
      toast.error('Add a message, image, or voice note.'); return;
    }
    setSending(true);
    try {
      let voice_url = null;
      let image_url = null;

      if (audioBlob) {
        const f = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        voice_url = await uploadPublicFile(f, 'audio');
      }
      if (imageFile) image_url = await uploadPublicFile(imageFile, 'images');

      // Build auth header if logged in
      const headers = { 'Content-Type': 'application/json' };
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API}/api/box/send-anonymous`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receiver_id:  boxUser.id,
          item_type:    itemType,
          sender_alias: 'anonymous',
          text_content: text || null,
          voice_url,
          image_url,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Send failed');
      }
      toast.success('📬 Sent!');
      setStep('view'); setText(''); setImageFile(null); setAudioBlob(null); setItemType('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const needsVoice = itemType === 'cassette' || itemType === 'package';
  const needsImage = itemType === 'mail'     || itemType === 'package';

  if (loading) return <div className="spinner-wrap" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!boxUser) return null;

  return (
    <div className="public-profile-page">
      {/* ── Minimal top bar ─────────────────────────────── */}
      <header className="public-topbar">
        <span className="nav-logo" style={{ cursor: 'default' }}>Echo<span style={{ color: 'var(--brass-light)' }}>-Box</span></span>
        {!currentUser && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
            Sign in
          </button>
        )}
      </header>

      <div className="public-profile-inner">
        {/* Box visual */}
        <BoxDisplay user={boxUser} />

        {/* User info */}
        <div className="public-profile-info">
          <h1>{boxUser.display_name}</h1>
          <p className="public-profile-username">@{boxUser.username}</p>
          {boxUser.bio && <p className="public-profile-bio">{boxUser.bio}</p>}
        </div>

        {/* ── Send flow ─────────────────────────────────── */}
        {step === 'view' && (
          <div className="public-send-cta">
            <p className="public-anon-note">
              📮 Send anonymously — no account needed for text!
            </p>
            <button className="btn btn-brass btn-lg" onClick={() => setStep('type')}>
              📬 Send Something
            </button>
            {!currentUser && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/login')}>
                Sign in to send images & voice
              </button>
            )}
          </div>
        )}

        {step === 'type' && (
          <div className="public-send-box">
            <h2 className="public-send-title">Choose what to send</h2>
            <div className="type-grid">
              {ITEM_TYPES.map(({ key, icon, label, desc }) => (
                <button
                  key={key}
                  className={`type-btn ${itemType === key ? 'selected' : ''}`}
                  onClick={() => { setItemType(key); setStep('compose'); }}
                >
                  <span className="type-icon">{icon}</span>
                  {label}
                  <span style={{ fontSize: '0.7rem', color: 'var(--brown-light)', display: 'block', marginTop: '0.25rem' }}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => setStep('view')}>
              ← Back
            </button>
          </div>
        )}

        {step === 'compose' && (
          <div className="public-send-box">
            <h2 className="public-send-title">
              {ITEM_TYPES.find(t => t.key === itemType)?.icon} Sending to @{boxUser.username}
            </h2>

            {/* Anonymous badge */}
            <div className="anon-badge">🎭 Sending anonymously</div>

            {/* Text */}
            <div className="form-group">
              <label className="form-label">Your Message</label>
              <textarea
                className="textarea"
                placeholder="Write something..."
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={1000}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--parchment-dark)', textAlign: 'right' }}>
                {text.length}/1000
              </div>
            </div>

            {/* Voice (login required) */}
            {needsVoice && (
              <div className="form-group">
                <label className="form-label">Voice Note</label>
                {!currentUser ? (
                  <div className="login-gate">
                    <p>🔒 Sign in to send voice notes</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <div className="record-row">
                    <button
                      type="button"
                      className={`record-btn ${recording ? 'recording' : ''}`}
                      onClick={recording ? stopRecording : startRecording}
                    >
                      {recording ? '⏹' : '🎙️'}
                    </button>
                    <span className="record-label">
                      {audioBlob ? 'Voice recorded ✓' : recording ? 'Recording... tap to stop' : 'Record Voice'}
                    </span>
                  </div>
                )}
                {audioBlob && (
                  <div className="audio-wrap" style={{ marginTop: '0.5rem' }}>
                    <audio controls src={URL.createObjectURL(audioBlob)} />
                  </div>
                )}
              </div>
            )}

            {/* Image (login required) */}
            {needsImage && (
              <div className="form-group">
                <label className="form-label">Attach Image</label>
                {!currentUser ? (
                  <div className="login-gate">
                    <p>🔒 Sign in to attach images</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file" accept="image/*" ref={imageRef}
                      style={{ display: 'none' }}
                      onChange={e => setImageFile(e.target.files[0] || null)}
                    />
                    <button className="btn btn-secondary" onClick={() => imageRef.current?.click()}>
                      {imageFile ? '📎 Image attached ✓' : '📎 Attach Image'}
                    </button>
                    {imageFile && (
                      <img
                        src={URL.createObjectURL(imageFile)} alt="preview"
                        style={{ maxHeight: 160, borderRadius: 4, marginTop: 8, border: '2px solid var(--parchment-dark)' }}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            <div className="divider" />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep('type')} disabled={sending}>
                ← Back
              </button>
              <button className="btn btn-brass btn-block" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : '📬 Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
