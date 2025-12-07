import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireCashier?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                                  children,
                                                                  requireAdmin = false,
                                                                  requireCashier = false
                                                              }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si requiere admin y no es admin, redirigir según su rol
    if (requireAdmin && user?.rol !== 'admin') {
        if (user?.rol === 'cashier') {
            return <Navigate to="/cashier" replace />;
        }
        return <Navigate to="/home" replace />;
    }

    // Si requiere cashier y no es cashier ni admin, redirigir
    if (requireCashier && user?.rol !== 'cashier' && user?.rol !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    return <>{children}</>;
};