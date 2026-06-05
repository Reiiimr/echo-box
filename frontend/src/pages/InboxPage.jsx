import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getInbox } from '../services/api';
import ItemCard from '../components/ItemCard';

export default function InboxPage() {
  const { t } = useTranslation();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // 'all' | 'unread' | 'cassette' | 'mail' | 'package'

  useEffect(() => {
    getInbox()
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleted = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const filtered = items.filter(i => {
    if (filter === 'unread')   return !i.is_read;
    if (['cassette','mail','package'].includes(filter)) return i.item_type === filter;
    return true;
  });

  const unreadCount = items.filter(i => !i.is_read).length;

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          {t('inbox.title')}
          {unreadCount > 0 && (
            <span className="badge badge-new" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>
              {unreadCount} {t('inbox.unread')}
            </span>
          )}
        </h1>
        <p>{t('inbox.subtitle')}</p>
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {['all','unread','cassette','mail','package'].map(f => (
          <button
            key={f}
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'      ? '📬 All'      :
             f === 'unread'   ? `✨ New (${unreadCount})` :
             f === 'cassette' ? '📼 Tapes'    :
             f === 'mail'     ? '✉️ Mail'      :
                                '📦 Packages'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>{t('inbox.empty')}</p>
          <p className="empty-sub">{t('inbox.empty_sub')}</p>
        </div>
      ) : (
        <div className="item-list">
          {filtered.map(item => (
            <div key={item.id} className="card card-sm" style={{ padding: 0, overflow: 'hidden' }}>
              <ItemCard item={item} onDeleted={handleDeleted} isInbox={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
