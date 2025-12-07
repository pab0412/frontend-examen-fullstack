import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Button } from '~/components/atoms/Button';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { useAuth } from '~/context/AuthContext';

export default function CashierLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-900">
                {/* Navbar */}
                <nav className="bg-gray-800 shadow-sm border-b border-gray-700">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-8">
                                <Link to="/cashier" className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                                    🎮 GameZone
                                </Link>

                                <div className="flex gap-4">
                                    <Link
                                        to="/cashier"
                                        className={`px-3 py-2 rounded-md font-medium transition-colors ${
                                            location.pathname === '/cashier'
                                                ? 'bg-green-900/30 text-green-400 border border-green-700'
                                                : 'text-gray-300 hover:text-green-400'
                                        }`}
                                    >
                                        Punto de Venta
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-sm">
                                    <p className="font-medium text-gray-100">{user?.name}</p>
                                    <p className="text-gray-400 text-xs">Cajero</p>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    variant="danger"
                                    size="sm"
                                >
                                    Salir
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main>
                    <Outlet />
                </main>
            </div>
        </ProtectedRoute>
    );
}