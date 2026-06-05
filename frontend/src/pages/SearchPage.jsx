import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../services/api';

export default function SearchPage() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchUsers(query.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🗂️ {t('search.title')}</h1>
        <p>Search for a username to visit their box or send them something.</p>
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: '2rem' }}>
        <input
          className="input"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{ flexShrink: 0 }}
        >
          {loading ? '...' : t('search.search_btn')}
        </button>
      </div>

      {/* Results */}
      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>{t('search.no_results')}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card" style={{ padding: '0.25rem 0' }}>
          {results.map((user, i) => (
            <div key={user.id}>
              <div
                className="user-card"
                onClick={() => navigate(`/box/${user.username}`)}
              >
                {/* Box colour dot */}
                <div
                  className="user-avatar-placeholder"
                  style={{ background: user.box_color || '#8b6440', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}
                >
                  📬
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="user-display">{user.display_name}</div>
                  <div className="user-username">@{user.username}</div>
                  {user.bio && (
                    <div className="user-bio" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                      {user.bio}
                    </div>
                  )}
                </div>

                {/* Box name pill */}
                <span style={{
                  fontSize: '0.72rem', color: 'var(--brown-light)',
                  background: 'var(--parchment)', border: '1px solid var(--parchment-dark)',
                  borderRadius: '999px', padding: '0.15rem 0.6rem',
                  whiteSpace: 'nowrap',
                }}>
                  📦 {user.box_name}
                </span>
              </div>
              {i < results.length - 1 && <div className="divider" style={{ margin: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
