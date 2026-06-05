import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getSent } from '../services/api';

const TYPE_ICON = { cassette: '📼', mail: '✉️', package: '📦' };

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const isDelivered = (item) => new Date(item.scheduled_at) <= new Date();

export default function TrackingPage() {
  const { t }      = useTranslation();
  const navigate   = useNavigate();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState('all'); // 'all' | 'delivered' | 'pending'

  useEffect(() => {
    getSent()
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => {
    if (filter === 'delivered') return isDelivered(i);
    if (filter === 'pending')   return !isDelivered(i);
    return true;
  });

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('tracking.title')}</h1>
        <p>{t('tracking.subtitle')}</p>
      </div>

      <div className="tabs">
        {['all','delivered','pending'].map(f => (
          <button
            key={f}
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'       ? `📬 All (${items.length})` :
             f === 'delivered' ? `✅ ${t('tracking.delivered')}` :
                                 `⏳ ${t('tracking.pending')}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>{t('tracking.empty')}</p>
        </div>
      ) : (
        <div className="item-list">
          {filtered.map(item => {
            const delivered = isDelivered(item);
            return (
              <div key={item.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Item type icon */}
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                  {TYPE_ICON[item.item_type] || '📬'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                      {t('tracking.to')}&nbsp;
                      <button
                        onClick={() => navigate(`/box/${item.receiver?.username}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rust)', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}
                      >
                        @{item.receiver?.username || '?'}
                      </button>
                    </span>
                    <span className={`badge ${delivered ? 'badge-read' : 'badge-pending'}`}>
                      {delivered ? t('tracking.delivered') : t('tracking.pending')}
                    </span>
                  </div>

                  {/* Alias row */}
                  <p style={{ fontSize: '0.8rem', color: 'var(--brown-light)', marginBottom: '0.35rem' }}>
                    Sent as: {item.sender_alias === 'anonymous' ? '🎭 Anonymous' : item.receiver?.display_name}
                  </p>

                  {/* Read receipt */}
                  {delivered && (
                    <p style={{ fontSize: '0.8rem' }}>
                      {item.is_read
                        ? <span style={{ color: 'var(--olive)' }}>👁️ {t('tracking.seen')}</span>
                        : <span style={{ color: 'var(--slate)' }}>⏳ {t('tracking.unseen')}</span>}
                    </p>
                  )}

                  {/* Reaction from receiver */}
                  {item.reaction && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      Reaction: {item.reaction}
                    </p>
                  )}

                  {/* Date */}
                  <p style={{ fontSize: '0.72rem', color: 'var(--parchment-dark)', marginTop: '0.4rem' }}>
                    {t('tracking.sent_at')}: {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
