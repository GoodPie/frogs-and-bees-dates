import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '@/screens/auth/hooks/useAuth.ts';
import {ROUTES} from './routes';
import type {ReactNode} from "react";
import {Loading} from "@/components/Loading";

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({children}: Readonly<ProtectedRouteProps>) {
    const location = useLocation();
    const {user, loading} = useAuth();

    if (loading) {
        return <Loading/>
    }

    if (!user) {
        return <Navigate to={ROUTES.SIGNIN} state={{from: location}} replace/>;
    }

    return <>{children}</>;
}
