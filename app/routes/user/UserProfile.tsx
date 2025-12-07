import React, { useState, useEffect } from 'react';
import { useAuth } from '~/context/AuthContext';
import { userService } from '~/services/api/userService';
import { AlertMessage } from '~/components/molecules/AlertMessage';
import { useNavigate } from 'react-router';

const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            setErrorMessage('No se pudo identificar al usuario');
            setShowError(true);
            return;
        }

        if (!formData.name || !formData.email) {
            setErrorMessage('Nombre y email son requeridos');
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        if (formData.newPassword) {
            if (!formData.currentPassword) {
                setErrorMessage('Debes ingresar tu contraseña actual para cambiarla');
                setShowError(true);
                setTimeout(() => setShowError(false), 3000);
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                setErrorMessage('Las contraseñas no coinciden');
                setShowError(true);
                setTimeout(() => setShowError(false), 3000);
                return;
            }

            if (formData.newPassword.length < 6) {
                setErrorMessage('La contraseña debe tener al menos 6 caracteres');
                setShowError(true);
                setTimeout(() => setShowError(false), 3000);
                return;
            }
        }

        setIsLoading(true);

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
            };

            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await userService.update(user.id, updateData);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);

            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

        } catch (error: any) {
            console.error('Error actualizando perfil:', error);
            setErrorMessage(error.response?.data?.message || 'Error al actualizar el perfil');
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user?.id) return;

        const confirmed = window.confirm(
            '⚠️ ¿Estás ABSOLUTAMENTE seguro de que deseas eliminar tu cuenta?\n\n' +
            '✗ Se eliminarán todos tus datos\n' +
            '✗ Se eliminarán todas tus compras\n' +
            '✗ Esta acción NO se puede deshacer\n\n' +
            'Escribe "ELIMINAR" en el siguiente prompt para confirmar.'
        );

        if (!confirmed) return;

        const confirmation = window.prompt('Escribe "ELIMINAR" para confirmar:');

        if (confirmation !== 'ELIMINAR') {
            setErrorMessage('Confirmación incorrecta. Cuenta no eliminada.');
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        setIsLoading(true);

        try {
            await userService.delete(user.id);
            alert('✅ Tu cuenta ha sido eliminada exitosamente.');
            logout();
            navigate('/login');
        } catch (error: any) {
            console.error('Error eliminando cuenta:', error);
            setErrorMessage(error.response?.data?.message || 'Error al eliminar la cuenta');
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <p className="text-gray-400 text-lg">Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-100 mb-8">👤 Mi Perfil</h1>

            {showSuccess && (
                <div className="mb-6">
                    <AlertMessage
                        type="success"
                        message="¡Perfil actualizado exitosamente!"
                        onClose={() => setShowSuccess(false)}
                    />
                </div>
            )}

            {showError && (
                <div className="mb-6">
                    <AlertMessage
                        type="error"
                        message={errorMessage}
                        onClose={() => setShowError(false)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar - User Info */}
                <div className="md:col-span-1">
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-700">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-gray-100 mb-1">{user?.name}</h2>
                        <p className="text-gray-400 mb-4">{user?.email}</p>
                        <div className="inline-block px-3 py-1 bg-green-900/30 border border-green-700 text-green-400 rounded-full text-sm font-semibold">
                            {user?.rol === 'admin' ? '👑 Administrador' :
                                user?.rol === 'cashier' ? '💼 Cajero' : '🛒 Cliente'}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                        <h3 className="text-2xl font-bold text-gray-100 mb-6">Información Personal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    placeholder="usuario@gamezone.com"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 my-6"></div>

                        <h4 className="text-lg font-bold text-gray-100 mb-4">Cambiar Contraseña</h4>
                        <p className="text-sm text-gray-400 mb-4">Deja estos campos vacíos si no deseas cambiar tu contraseña</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Contraseña Actual
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg"
                            >
                                {isLoading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                        <h3 className="text-2xl font-bold text-gray-100 mb-6">Acciones Rápidas</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/orders')}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md"
                            >
                                📦 Ver Mis Pedidos
                            </button>
                            <button
                                onClick={() => navigate('/home')}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                            >
                                🛒 Ir a la Tienda
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-red-700">
                        <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Zona Peligrosa</h3>
                        <p className="text-gray-400 mb-4">
                            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? '⏳ Procesando...' : '🗑️ Eliminar mi Cuenta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;