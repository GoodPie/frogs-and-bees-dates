import {type RoutePath} from './routes';
import type {ReactNode} from "react";

export interface RouteConfig {
    path: RoutePath | '*';
    element: ReactNode;
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
