import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { currentUser, dbUser, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!currentUser)  return <Navigate to="/login" replace />;
  if (needsSetup)    return <Navigate to="/setup" replace />;
  if (!dbUser)       return <Navigate to="/setup" replace />;

  return <Outlet />;
}
