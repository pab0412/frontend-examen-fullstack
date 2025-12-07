import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/register';
import { RegisterForm } from '~/components/organisms/RegisterForm';
import { useAuth } from '~/context/AuthContext';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Registro - GameZone' },
        { name: 'description', content: 'Crea tu cuenta en GameZone' },
    ];
}

export default function Register() {
    const navigate = useNavigate();
    const { register, login, isAuthenticated, user } = useAuth();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate('/home');
        }
    }, [isAuthenticated, user, navigate]);

    const handleRegister = async (data: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => {
        try {
            setLoading(true);
            setError('');

            if (data.password !== data.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            if (data.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            // Registrar usuario
            await register(data.name, data.email, data.password);

            // Auto-login después del registro
            console.log('✅ Registro exitoso, haciendo login automático...');
            await login({ email: data.email, password: data.password });

        } catch (err: any) {
            console.error('❌ Error:', err);
            if (err.response?.data?.message) {
                if (Array.isArray(err.response.data.message)) {
                    setError(err.response.data.message.join(', '));
                } else {
                    setError(err.response.data.message);
                }
            } else {
                setError(err.message || 'Error al crear la cuenta');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-full max-w-md px-4 py-8">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        GameZone
                    </h1>
                    <p className="text-gray-400">Únete a la mejor comunidad gaming</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
                        <div className="flex items-center">
                            <span className="mr-2">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <RegisterForm onSubmit={handleRegister} />

                {loading && (
                    <div className="text-center mt-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <p className="text-gray-400 mt-2">Creando tu cuenta...</p>
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" className="text-green-400 hover:text-green-300 font-semibold hover:underline">
                            Inicia sesión aquí
                        </a>
                    </p>
                </div>

                <div className="mt-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                        ℹ️ Beneficios de registrarte:
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Acceso a todo el catálogo de juegos</li>
                        <li>• Seguimiento de tus pedidos</li>
                        <li>• Historial de compras</li>
                        <li>• Ofertas exclusivas para miembros</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
