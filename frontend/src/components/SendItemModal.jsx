import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { sendItem } from '../services/api';
import { uploadAudio, uploadImage } from '../services/storage';

const ITEM_TYPES = [
  { key: 'cassette', icon: '📼', labelKey: 'send.cassette', descKey: 'send.cassette_desc' },
  { key: 'mail',     icon: '✉️',  labelKey: 'send.mail',     descKey: 'send.mail_desc'     },
  { key: 'package',  icon: '📦', labelKey: 'send.package',  descKey: 'send.package_desc'  },
];

export default function SendItemModal({ receiver, onClose, onSent }) {
  const { t } = useTranslation();

  // Step: 'type' | 'compose'
  const [step,        setStep]        = useState('type');
  const [itemType,    setItemType]    = useState('');
  const [alias,       setAlias]       = useState('display');
  const [text,        setText]        = useState('');
  const [imageFile,   setImageFile]   = useState(null);
  const [audioBlob,   setAudioBlob]   = useState(null);
  const [recording,   setRecording]   = useState(false);
  const [sending,     setSending]     = useState(false);

  const mrRef       = useRef(null);
  const imageRef    = useRef(null);
  const chunksRef   = useRef([]);

  // ── Voice Recording ──────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mrRef.current?.stop();
    setRecording(false);
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSend = async () => {
    if (!text && !audioBlob && !imageFile) {
      toast.error('Please add a message, image, or voice note.');
      return;
    }
    setSending(true);
    try {
      let voice_url = null;
      let image_url = null;

      if (audioBlob)  voice_url = await uploadAudio(audioBlob);
      if (imageFile)  image_url = await uploadImage(imageFile);

      await sendItem({
        receiver_id:  receiver.id,
        item_type:    itemType,
        sender_alias: alias,
        text_content: text || null,
        voice_url,
        image_url,
      });

      toast.success(t('send.success'));
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || t('error_generic'));
    } finally {
      setSending(false);
    }
  };

  const needsVoice = itemType === 'cassette' || itemType === 'package';
  const needsImage = itemType === 'mail'     || itemType === 'package';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2>
            {step === 'type'
              ? t('send.choose_type')
              : `${t('send.title')} @${receiver.username}`}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* ── STEP 1: Choose type ── */}
          {step === 'type' && (
            <div className="type-grid">
              {ITEM_TYPES.map(({ key, icon, labelKey, descKey }) => (
                <button
                  key={key}
                  className={`type-btn ${itemType === key ? 'selected' : ''}`}
                  onClick={() => { setItemType(key); setStep('compose'); }}
                >
                  <span className="type-icon">{icon}</span>
                  {t(labelKey)}
                  <span style={{ fontSize: '0.7rem', color: 'var(--brown-light)', display: 'block', marginTop: '0.25rem' }}>
                    {t(descKey)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── STEP 2: Compose ── */}
          {step === 'compose' && (
            <>
              {/* Sender alias */}
              <div className="form-group">
                <label className="form-label">{t('send.send_as')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['display', 'anonymous'].map((a) => (
                    <button
                      key={a}
                      className={`btn btn-sm ${alias === a ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAlias(a)}
                    >
                      {a === 'display' ? `👤 ${t('send.alias_display')}` : `🎭 ${t('send.alias_anonymous')}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text message */}
              <div className="form-group">
                <label className="form-label">{t('send.message')}</label>
                <textarea
                  className="textarea"
                  placeholder={t('send.message_placeholder')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1000}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--parchment-dark)', textAlign: 'right' }}>
                  {text.length}/1000
                </div>
              </div>

              {/* Voice recording (cassette + package) */}
              {needsVoice && (
                <div className="form-group">
                  <label className="form-label">{t('send.record_voice')}</label>
                  <div className="record-row">
                    <button
                      type="button"
                      className={`record-btn ${recording ? 'recording' : ''}`}
                      onClick={recording ? stopRecording : startRecording}
                    >
                      {recording ? '⏹' : '🎙️'}
                    </button>
                    <span className="record-label">
                      {audioBlob
                        ? t('send.voice_recorded')
                        : recording
                          ? t('send.recording')
                          : t('send.record_voice')}
                    </span>
                  </div>
                  {audioBlob && (
                    <div className="audio-wrap" style={{ marginTop: '0.5rem' }}>
                      <audio controls src={URL.createObjectURL(audioBlob)} />
                    </div>
                  )}
                </div>
              )}

              {/* Image upload (mail + package) */}
              {needsImage && (
                <div className="form-group">
                  <label className="form-label">{t('send.attach_image')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageRef}
                    style={{ display: 'none' }}
                    onChange={(e) => setImageFile(e.target.files[0] || null)}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => imageRef.current?.click()}
                  >
                    {imageFile ? t('send.image_attached') : `📎 ${t('send.attach_image')}`}
                  </button>
                  {imageFile && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="preview"
                        style={{ maxHeight: '160px', borderRadius: '4px', border: '2px solid var(--parchment-dark)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="divider" />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setStep('type')}
                  disabled={sending}
                >
                  {t('back')}
                </button>
                <button
                  className="btn btn-brass btn-block"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? t('send.sending') : `📬 ${t('send.send_btn')}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
