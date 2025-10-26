import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routing/routes';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = () => {
    const from = location.state?.from?.pathname || ROUTES.ACTIVITIES;
    navigate(from, { replace: true });
  };

  return { redirectAfterLogin };
}
