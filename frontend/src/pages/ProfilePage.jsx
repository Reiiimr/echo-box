import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile, deleteAccount, getBlocked, unblockUser } from '../services/api';
import { BOX_COLORS } from '../components/BoxDisplay';
import BoxDisplay from '../components/BoxDisplay';
import LanguageToggle from '../components/LanguageToggle';

const GENDER_LABELS = {
  prefer_not: 'Prefer not to say', male: 'Male', female: 'Female',
  nonbinary: 'Non-binary', other: 'Other',
};

export default function ProfilePage() {
  const { dbUser, refreshProfile, logout } = useAuth();
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:     dbUser?.username     || '',
    display_name: dbUser?.display_name || '',
    bio:          dbUser?.bio          || '',
    box_name:     dbUser?.box_name     || 'My Box',
    box_color:    dbUser?.box_color    || BOX_COLORS[0],
  });
  const [saving,      setSaving]      = useState(false);
  const [blocked,     setBlocked]     = useState([]);
  const [loadBlocked, setLoadBlocked] = useState(false);
  const [activeTab,   setActiveTab]   = useState('edit');
  const [errors,      setErrors]      = useState({});
  const [copied,      setCopied]      = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const preview = { ...dbUser, ...form };

  const profileLink = `${window.location.origin}/${dbUser?.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  useEffect(() => {
    if (activeTab === 'blocked') {
      setLoadBlocked(true);
      getBlocked()
        .then(({ data }) => setBlocked(data))
        .catch(() => {})
        .finally(() => setLoadBlocked(false));
    }
  }, [activeTab]);

  const handleSave = async () => {
    const e = {};
    if (!form.username.trim())                          e.username     = 'Required';
    if (!/^[a-z0-9_]{3,30}$/.test(form.username))      e.username     = '3–30 chars, lowercase/numbers/underscore';
    if (!form.display_name.trim())                      e.display_name = 'Required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await updateProfile({ ...form, username: form.username.toLowerCase() });
      await refreshProfile();
      toast.success(t('profile.saved'));
    } catch (err) {
      const msg = err.response?.data?.error || t('error_generic');
      toast.error(msg);
      if (msg.toLowerCase().includes('username')) setErrors({ username: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (targetId, username) => {
    try {
      await unblockUser(targetId);
      setBlocked(prev => prev.filter(b => b.blocked_id !== targetId));
      toast.success(`@${username} unblocked.`);
    } catch { toast.error(t('error_generic')); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile.delete_confirm'))) return;
    if (!confirm('This will permanently delete all your data. Are you SURE?')) return;
    try {
      await deleteAccount();
      await logout();
      navigate('/login');
    } catch { toast.error(t('error_generic')); }
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1>{t('profile.title')}</h1>
      </div>

      {/* ── Share link card ──────────────────────────────── */}
      <div className="card share-card">
        <div className="share-card-inner">
          <div>
            <p className="share-label">🔗 Your Public Box Link</p>
            <p className="share-url">{profileLink}</p>
            <p className="share-hint">Anyone with this link can send you mail — no account needed for text!</p>
          </div>
          <button className="btn btn-brass btn-sm share-copy-btn" onClick={handleCopyLink}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* ── Language ─────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem' }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--brown-mid)' }}>🌐 {t('nav.language')}</span>
        <LanguageToggle />
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
          ✏️ {t('profile.edit_title')}
        </button>
        <button className={`tab ${activeTab === 'blocked' ? 'active' : ''}`} onClick={() => setActiveTab('blocked')}>
          🚫 {t('profile.blocked_users')}
        </button>
      </div>

      {/* ── Edit tab ─────────────────────────────────────── */}
      {activeTab === 'edit' && (
        <div className="profile-edit-grid">
          <div>
            <div className="form-group">
              <label className="form-label">{t('profile.display_name')}</label>
              <input className="input" value={form.display_name} onChange={e => set('display_name', e.target.value)} maxLength={50} />
              {errors.display_name && <p className="form-error">{errors.display_name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('profile.username')}</label>
              <input className="input" value={form.username} onChange={e => set('username', e.target.value.toLowerCase())} maxLength={30} />
              {errors.username && <p className="form-error">{errors.username}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('profile.bio')}</label>
              <textarea className="textarea" value={form.bio} onChange={e => set('bio', e.target.value)} maxLength={200} style={{ minHeight: '70px' }} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('profile.gender_locked')} 🔒</label>
                <input className="input" value={GENDER_LABELS[dbUser?.gender] || dbUser?.gender || '—'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">{t('profile.age_locked')} 🔒</label>
                <input className="input" value={dbUser?.age || '—'} disabled />
              </div>
            </div>

            <div className="divider" />

            <div className="form-group">
              <label className="form-label">{t('profile.box_name')}</label>
              <input className="input" value={form.box_name} onChange={e => set('box_name', e.target.value)} maxLength={60} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('profile.box_color')}</label>
              <div className="color-swatches">
                {BOX_COLORS.map(c => (
                  <div key={c} className={`color-swatch ${form.box_color === c ? 'active' : ''}`}
                    style={{ background: c }} onClick={() => set('box_color', c)} />
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving}>
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
          </div>

          {/* Box preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--brown-light)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Preview</p>
            <BoxDisplay user={preview} />
          </div>
        </div>
      )}

      {/* ── Blocked tab ──────────────────────────────────── */}
      {activeTab === 'blocked' && (
        loadBlocked ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : blocked.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>No blocked users.</p>
          </div>
        ) : (
          <div className="item-list">
            {blocked.map(b => (
              <div key={b.blocked_id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="user-avatar-placeholder">👤</div>
                <div style={{ flex: 1 }}>
                  <div className="user-display">{b.blocked?.display_name}</div>
                  <div className="user-username">@{b.blocked?.username}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => handleUnblock(b.blocked_id, b.blocked?.username)}>
                  {t('profile.unblock')}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Danger zone ──────────────────────────────────── */}
      <div className="divider" style={{ marginTop: '3rem' }} />
      <div className="card" style={{ border: '2px solid var(--rust)', background: '#fff5f5' }}>
        <h3 style={{ color: 'var(--rust)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          ⚠️ {t('profile.danger_zone')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--brown-light)', marginBottom: '1rem' }}>
          {t('profile.delete_confirm')}
        </p>
        <button className="btn btn-danger" onClick={handleDeleteAccount}>
          🗑️ {t('profile.delete_account')}
        </button>
      </div>
    </div>
  );
}
