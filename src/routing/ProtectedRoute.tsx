import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
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
        <Loading/>
    }

    if (!user) {
        return <Navigate to={ROUTES.SIGNIN} state={{from: location}} replace/>;
    }

    return <>{children}</>;
}
