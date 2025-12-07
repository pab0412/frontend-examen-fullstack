import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/login';
import { LoginForm } from '~/components/organisms/LoginForm';
import { useAuth } from '~/context/AuthContext';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Login - GameZone' },
        { name: 'description', content: 'Inicia sesión en GameZone' },
    ];
}

export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            switch (user.rol) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'cashier':
                    navigate('/cashier');
                    break;
                default:
                    navigate('/home');
                    break;
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogin = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError('');
            await login({ email, password });
        } catch (err: any) {
            console.error('Error en login:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                setError('Email o contraseña incorrectos');
            } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                setError('No se puede conectar con el servidor. Verifica que el backend esté corriendo.');
            } else {
                setError('Error al iniciar sesión. Intenta nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-full max-w-md px-4">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        GameZone
                    </h1>
                    <p className="text-gray-400">Bienvenido de vuelta</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
                        <div className="flex items-center">
                            <span className="mr-2">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <LoginForm onSubmit={handleLogin} />

                {loading && (
                    <div className="text-center mt-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <p className="text-gray-400 mt-2">Iniciando sesión...</p>
                    </div>
                )}

                <div className="mt-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-gray-300 mb-3">
                        🔐 Credenciales de prueba:
                    </p>
                    <div className="text-sm text-gray-400 space-y-2">
                        <div>
                            <p className="font-semibold text-green-400">👑 Administrador:</p>
                            <p className="ml-4">Email: admin@gamezone.com</p>
                            <p className="ml-4">Password: admin123</p>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                            <p className="font-semibold text-cyan-400">💼 Cajero:</p>
                            <p className="ml-4">Email: cajero@gamezone.com</p>
                            <p className="ml-4">Password: cajero123</p>
                        </div>
                        <div className="border-t border-gray-700 pt-2">
                            <p className="font-semibold text-blue-400">🛒 Cliente:</p>
                            <p className="ml-4">Email: user@gamezone.com</p>
                            <p className="ml-4">Password: user123</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>¿No tienes cuenta? <a href="/register" className="text-green-400 hover:text-green-300 font-semibold">Regístrate aquí</a></p>
                </div>
            </div>
        </div>
    );
}
