import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { deleteItem, markRead, reactToItem } from '../services/api';

const REACTIONS = ['❤️', '⭐', '🕊️', '🎵', '📮'];

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// ── Cassette Card ────────────────────────────────────────────
function CassetteCard({ item, senderLabel }) {
  return (
    <div className="item-cassette item-card">
      <div className="cassette-label">📼 Cassette Tape</div>
      <div className="cassette-from">{senderLabel}</div>
      {item.text_content && (
        <div className="cassette-text">{item.text_content}</div>
      )}
      {item.voice_url && (
        <div className="audio-wrap">
          <audio controls src={item.voice_url} className="audio-wrap audio" />
        </div>
      )}
      <div className="cassette-tape-bar">
        <div className="cassette-spool" />
        <div className="cassette-spool" />
      </div>
    </div>
  );
}

// ── Mail Card ────────────────────────────────────────────────
function MailCard({ item, senderLabel }) {
  return (
    <div className="item-mail item-card">
      <div className="mail-flap">
        <div className="mail-stamp">✉️</div>
      </div>
      <div className="mail-body">
        <div className="mail-to">{senderLabel}</div>
        {item.text_content && (
          <p className="mail-text">{item.text_content}</p>
        )}
        {item.image_url && (
          <img src={item.image_url} alt="attachment" className="item-card-image" />
        )}
      </div>
    </div>
  );
}

// ── Package Card ─────────────────────────────────────────────
function PackageCard({ item, senderLabel }) {
  return (
    <div className="item-package item-card">
      <div className="package-wrap">
        <div className="package-ribbon-h" />
        <div className="package-ribbon-v" />
        <div className="package-bow">🎀</div>
        <div className="package-inner">
          <div style={{ fontSize: '0.78rem', color: 'var(--brown-light)', marginBottom: '0.5rem' }}>
            {senderLabel}
          </div>
          {item.text_content && (
            <p style={{ fontSize: '0.95rem', marginBottom: '0.65rem' }}>{item.text_content}</p>
          )}
          {item.image_url && (
            <img src={item.image_url} alt="attachment" className="item-card-image" />
          )}
          {item.voice_url && (
            <div className="audio-wrap">
              <audio controls src={item.voice_url} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ItemCard ─────────────────────────────────────────────
export default function ItemCard({ item, onDeleted, isInbox = true }) {
  const { t } = useTranslation();
  const [deleted,  setDeleted]  = useState(false);
  const [isRead,   setIsRead]   = useState(item.is_read);
  const [reaction, setReaction] = useState(item.reaction);
  const [showReactions, setShowReactions] = useState(false);

  if (deleted) return null;

  // Resolve display name based on sender_alias
  const senderLabel = (() => {
    if (item.sender_alias === 'anonymous') return `${t('anonymous')} 🎭`;
    return item.sender?.display_name
      ? `${t('from')} ${item.sender.display_name} (@${item.sender.username})`
      : t('anonymous');
  })();

  const handleOpen = async () => {
    if (!isRead && isInbox) {
      try {
        await markRead(item.id);
        setIsRead(true);
      } catch { /* silent */ }
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('inbox.delete') + '?')) return;
    try {
      await deleteItem(item.id);
      setDeleted(true);
      onDeleted?.(item.id);
      toast.success(t('inbox.delete') + '!');
    } catch {
      toast.error(t('error_generic'));
    }
  };

  const handleReact = async (emoji) => {
    const next = reaction === emoji ? null : emoji;
    try {
      await reactToItem(item.id, next);
      setReaction(next);
    } catch {
      toast.error(t('error_generic'));
    }
    setShowReactions(false);
  };

  const card = (() => {
    switch (item.item_type) {
      case 'cassette': return <CassetteCard item={item} senderLabel={senderLabel} />;
      case 'mail':     return <MailCard     item={item} senderLabel={senderLabel} />;
      case 'package':  return <PackageCard  item={item} senderLabel={senderLabel} />;
      default:         return null;
    }
  })();

  return (
    <div onClick={handleOpen}>
      {card}

      {/* Actions row */}
      {isInbox && (
        <div className="item-card-actions" style={{ padding: '0.6rem 0.75rem 0.25rem' }}>
          {/* Read status */}
          <span className={`badge ${isRead ? 'badge-read' : 'badge-new'}`}>
            {isRead ? t('inbox.read') : t('inbox.unread')}
          </span>

          {/* Reaction display */}
          {reaction && (
            <span style={{ fontSize: '1.1rem' }} title="Your reaction">
              {reaction}
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            {/* React toggle */}
            <button
              className="btn btn-sm btn-ghost"
              onClick={(e) => { e.stopPropagation(); setShowReactions(v => !v); }}
            >
              {t('inbox.react')}
            </button>

            {/* Delete */}
            <button
              className="btn btn-sm btn-danger"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            >
              {t('inbox.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Reaction picker */}
      {showReactions && (
        <div className="reaction-bar" style={{ padding: '0.4rem 0.75rem 0.75rem' }}>
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`reaction-btn ${reaction === emoji ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
            >
              {emoji}
            </button>
          ))}
          <button
            className="reaction-btn"
            onClick={(e) => { e.stopPropagation(); handleReact(null); }}
            title="Clear reaction"
          >
            ✕
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div style={{ fontSize: '0.72rem', color: 'var(--parchment-dark)', padding: '0 0.75rem 0.6rem', textAlign: 'right' }}>
        {formatDate(item.scheduled_at)}
      </div>
    </div>
  );
}
