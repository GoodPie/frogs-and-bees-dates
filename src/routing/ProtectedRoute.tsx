import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '@/FirebaseConfig';
import { ROUTES } from './routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const user = auth.currentUser;

  if (!user) {
    // Redirect to signin, storing intended destination
    return <Navigate to={ROUTES.SIGNIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
