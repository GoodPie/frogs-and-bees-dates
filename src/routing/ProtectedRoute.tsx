import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import {ROUTES} from './routes';
import {Spinner} from "@chakra-ui/react";
import type {ReactNode} from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({children}: Readonly<ProtectedRouteProps>) {
    const location = useLocation();
    const {user, loading} = useAuth();

    // Wait for auth to initialize before making routing decisions
    if (loading) {
        return <    Spinner/>;
    }

    if (!user) {
        // Redirect to signin, storing intended destination
        return <Navigate to={ROUTES.SIGNIN} state={{from: location}} replace/>;
    }

    return <>{children}</>;
}
