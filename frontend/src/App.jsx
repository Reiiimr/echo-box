import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar           from './components/Navbar';
import PrivateRoute     from './components/PrivateRoute';

import LoginPage        from './pages/LoginPage';
import SetupPage        from './pages/SetupPage';
import BoxPage          from './pages/BoxPage';
import InboxPage        from './pages/InboxPage';
import TrackingPage     from './pages/TrackingPage';
import ProfilePage      from './pages/ProfilePage';
import SearchPage       from './pages/SearchPage';
import PublicProfilePage from './pages/PublicProfilePage';

export default function App() {
  const { currentUser, dbUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isPublicRoute = ['/login', '/setup'].includes(location.pathname);
  const showNav = currentUser && dbUser && !isPublicRoute;

  return (
    <>
      {showNav && <Navbar />}

      <Routes>
        {/* Auth */}
        <Route path="/login" element={
          currentUser && dbUser
            ? <Navigate to="/box" replace />
            : <LoginPage />
        } />
        <Route path="/setup" element={
          !currentUser
            ? <Navigate to="/login" replace />
            : dbUser
              ? <Navigate to="/box" replace />
              : <SetupPage />
        } />

        {/* Protected */}
        <Route element={<PrivateRoute />}>
          <Route path="/"              element={<Navigate to="/box" replace />} />
          <Route path="/box"           element={<BoxPage />} />
          <Route path="/box/:username" element={<BoxPage />} />
          <Route path="/inbox"         element={<InboxPage />} />
          <Route path="/tracking"      element={<TrackingPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/search"        element={<SearchPage />} />
        </Route>

        {/* Public profile — /:username (must be last) */}
        <Route path="/:username" element={<PublicProfilePage />} />

        {/* Fallback */}
        <Route path="*" element={
          <Navigate to={currentUser && dbUser ? '/box' : '/login'} replace />
        } />
      </Routes>
    </>
  );
}
