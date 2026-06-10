import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from './LanguageToggle';

const NAV_ITEMS = [
  { to: '/box',      icon: '📬', labelKey: 'nav.my_box'  },
  { to: '/inbox',    icon: '✉️',  labelKey: 'nav.inbox'   },
  { to: '/tracking', icon: '🔍', labelKey: 'nav.tracking' },
  { to: '/search',   icon: '🗂️', labelKey: 'nav.search'  },
  { to: '/profile',  icon: '⚙️', labelKey: 'nav.profile' },
];

export default function Navbar() {
  const { dbUser, currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top bar ───────────────────────────────────────── */}
      <nav className="nav">
        <NavLink to="/box" className="nav-logo">
          Echo<span>-Box</span>
        </NavLink>

        {/* Desktop links */}
        <div className="nav-links nav-links-desktop">
          {NAV_ITEMS.map(({ to, icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/box'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-link-icon">{icon}</span>
              <span className="nav-link-text">{t(labelKey)}</span>
            </NavLink>
          ))}
        </div>

        {/* Avatar → opens drawer */}
        <button
          className="nav-avatar-btn"
          onClick={() => setDrawerOpen(o => !o)}
          aria-label="Account menu"
        >
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="avatar" className="nav-avatar" />
          ) : (
            <div className="nav-avatar-placeholder">
              {dbUser?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </button>
      </nav>

      {/* ── Account drawer ─────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            {/* User info */}
            <div className="drawer-user">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="avatar" className="drawer-avatar" />
              ) : (
                <div className="nav-avatar-placeholder drawer-avatar-ph">
                  {dbUser?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <div className="drawer-name">{dbUser?.display_name}</div>
                <div className="drawer-username">@{dbUser?.username}</div>
              </div>
            </div>

            <hr className="drawer-divider" />

            {/* Share link */}
            <button
              className="drawer-item"
              onClick={() => {
                const url = `${window.location.origin}/${dbUser?.username}`;
                navigator.clipboard.writeText(url);
                import('react-hot-toast').then(m => m.default.success('Link copied!'));
                setDrawerOpen(false);
              }}
            >
              <span>🔗</span> Copy My Box Link
            </button>

            {/* Language toggle */}
            <div className="drawer-item drawer-lang">
              <span>🌐</span>
              <span>{t('nav.language')}</span>
              <LanguageToggle />
            </div>

            <hr className="drawer-divider" />

            {/* Logout */}
            <button className="drawer-item drawer-logout" onClick={handleLogout}>
              <span>🚪</span> {t('nav.logout')}
            </button>
          </div>
        </>
      )}

      {/* ── Bottom tab bar (mobile only) ───────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, icon, labelKey }) => {
          const isActive = to === '/box'
            ? location.pathname === '/box' || location.pathname.startsWith('/box/')
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/box'}
              className={`bottom-tab ${isActive ? 'active' : ''}`}
            >
              <span className="bottom-tab-icon">{icon}</span>
              <span className="bottom-tab-label">{t(labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
