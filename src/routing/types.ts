// Route type definitions for React Router declarative navigation
import { type RoutePath } from './routes';

export interface RouteConfig {
  path: RoutePath | '*';
  element: React.ReactNode;
  requiresAuth: boolean;
  redirectTo?: RoutePath;
}

export interface NavigationState {
  from?: {
    pathname: string;
    search: string;
    hash: string;
    state: NavigationState;
  };
}

export interface AuthGuardState {
  isAuthenticated: boolean;
  isLoading: boolean;
  intendedDestination: string | null;
}
