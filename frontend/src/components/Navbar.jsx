import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const { dbUser, currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <NavLink to="/box" className="nav-logo">
        Echo<span>-Box</span>
      </NavLink>

      <div className="nav-links">
        <NavLink
          to="/box"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          end
        >
          <span className="nav-link-icon">📬</span>
          <span className="nav-link-text">{t('nav.my_box')}</span>
        </NavLink>

        <NavLink
          to="/inbox"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          <span className="nav-link-icon">✉️</span>
          <span className="nav-link-text">{t('nav.inbox')}</span>
        </NavLink>

        <NavLink
          to="/tracking"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          <span className="nav-link-icon">🔍</span>
          <span className="nav-link-text">{t('nav.tracking')}</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          <span className="nav-link-icon">🗂️</span>
          <span className="nav-link-text">{t('nav.search')}</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          <span className="nav-link-icon">⚙️</span>
          <span className="nav-link-text">{t('nav.profile')}</span>
        </NavLink>

        <button
          className="nav-link btn-ghost"
          onClick={handleLogout}
          style={{ background: 'none', fontSize: '0.82rem' }}
        >
          <span className="nav-link-icon">🚪</span>
          <span className="nav-link-text">{t('nav.logout')}</span>
        </button>
      </div>

      <LanguageToggle />

      {currentUser?.photoURL ? (
        <img
          src={currentUser.photoURL}
          alt="avatar"
          className="nav-avatar"
          onClick={() => navigate('/profile')}
          title={dbUser?.display_name}
        />
      ) : (
        <div
          className="nav-avatar-placeholder"
          onClick={() => navigate('/profile')}
          title={dbUser?.display_name}
        >
          {dbUser?.display_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </nav>
  );
}
