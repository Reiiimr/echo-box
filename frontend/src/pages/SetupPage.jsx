import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { setupProfile } from '../services/api';
import { BOX_COLORS } from '../components/BoxDisplay';

const GENDER_KEYS = ['prefer_not', 'male', 'female', 'nonbinary', 'other'];

export default function SetupPage() {
  const { currentUser, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:     '',
    display_name: currentUser?.displayName || '',
    bio:          '',
    gender:       '',
    age:          '',
    box_name:     'My Box',
    box_color:    BOX_COLORS[0],
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.username.trim())      e.username     = 'Username is required';
    if (!/^[a-z0-9_]{3,30}$/.test(form.username.toLowerCase()))
      e.username = 'Lowercase letters, numbers, underscores only (3–30 chars)';
    if (!form.display_name.trim()) e.display_name = 'Display name is required';
    if (!form.gender)              e.gender        = 'Please select a gender';
    if (!form.age || +form.age < 13 || +form.age > 120)
      e.age = 'Please enter a valid age (13+)';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await setupProfile({
        ...form,
        username: form.username.toLowerCase(),
        age: parseInt(form.age, 10),
      });
      await refreshProfile();
      navigate('/box');
    } catch (err) {
      const msg = err.response?.data?.error || t('error_generic');
      toast.error(msg);
      if (msg.toLowerCase().includes('username')) setErrors({ username: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</div>
          <h1 style={{ fontSize: '1.6rem' }}>{t('setup.title')}</h1>
          <p style={{ color: 'var(--brown-light)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Username */}
        <div className="form-group">
          <label className="form-label">{t('setup.username')}</label>
          <input
            className="input"
            placeholder="e.g. vintage_sender"
            value={form.username}
            onChange={e => set('username', e.target.value.toLowerCase())}
            maxLength={30}
          />
          {errors.username && <p className="form-error">{errors.username}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--brown-light)', marginTop: '0.2rem' }}>
            {t('setup.username_hint')}
          </p>
        </div>

        {/* Display name */}
        <div className="form-group">
          <label className="form-label">{t('setup.display_name')}</label>
          <input
            className="input"
            placeholder="Your name"
            value={form.display_name}
            onChange={e => set('display_name', e.target.value)}
            maxLength={50}
          />
          {errors.display_name && <p className="form-error">{errors.display_name}</p>}
        </div>

        {/* Bio */}
        <div className="form-group">
          <label className="form-label">{t('setup.bio')}</label>
          <textarea
            className="textarea"
            placeholder={t('setup.bio_placeholder')}
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            maxLength={200}
            style={{ minHeight: '70px' }}
          />
        </div>

        {/* Gender + Age (locked after setup) */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              {t('setup.gender')}
              <span className="form-label-note">🔒 {t('setup.gender_locked')}</span>
            </label>
            <select
              className="select"
              value={form.gender}
              onChange={e => set('gender', e.target.value)}
            >
              <option value="" disabled>Select...</option>
              {GENDER_KEYS.map(k => (
                <option key={k} value={k}>{t(`setup.gender_options.${k}`)}</option>
              ))}
            </select>
            {errors.gender && <p className="form-error">{errors.gender}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('setup.age')}
              <span className="form-label-note">🔒 {t('setup.age_locked')}</span>
            </label>
            <input
              className="input"
              type="number"
              min="13" max="120"
              placeholder="e.g. 21"
              value={form.age}
              onChange={e => set('age', e.target.value)}
            />
            {errors.age && <p className="form-error">{errors.age}</p>}
          </div>
        </div>

        <div className="divider" />

        {/* Box name */}
        <div className="form-group">
          <label className="form-label">{t('setup.box_name')}</label>
          <input
            className="input"
            placeholder="My Box"
            value={form.box_name}
            onChange={e => set('box_name', e.target.value)}
            maxLength={60}
          />
        </div>

        {/* Box colour */}
        <div className="form-group">
          <label className="form-label">{t('setup.box_color')}</label>
          <div className="color-swatches">
            {BOX_COLORS.map(c => (
              <div
                key={c}
                className={`color-swatch ${form.box_color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => set('box_color', c)}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{
          background: form.box_color,
          border: '3px solid rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          {form.box_name || 'My Box'} · @{form.username || 'username'}
        </div>

        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t('setup.submitting') : `📬 ${t('setup.submit')}`}
        </button>
      </div>
    </div>
  );
}
