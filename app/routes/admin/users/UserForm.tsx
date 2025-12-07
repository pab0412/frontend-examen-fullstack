import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '~/components/atoms/Button';
import { userService } from '~/services/api/userService';
import type { CreateUserDto, UpdateUserDto } from '~/services/types';

interface UserFormData {
    name: string;
    email: string;
    rol: 'admin' | 'cashier' | 'user';
    password?: string;
    confirmPassword?: string;
}

const UserForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        rol: 'user',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');

    useEffect(() => {
        if (isEditing && id) {
            loadUser(+id);
        }
    }, [id, isEditing]);

    const loadUser = async (userId: number) => {
        try {
            setLoading(true);
            const user = await userService.getOne(userId);
            setFormData({
                name: user.name,
                email: user.email,
                rol: user.rol as 'admin' | 'cashier' | 'user',
                password: '',
                confirmPassword: ''
            });
        } catch (error: any) {
            console.error('Error cargando usuario:', error);
            setSubmitError('Error al cargar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof UserFormData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (!isEditing || formData.password) {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida';
            } else if (formData.password.length < 6) {
                newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        if (!formData.rol) {
            newErrors.rol = 'El rol es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (isEditing && id) {
                const updateData: UpdateUserDto = {
                    name: formData.name,
                    email: formData.email,
                    rol: formData.rol,
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                await userService.update(+id, updateData);
                alert('Usuario actualizado exitosamente');

            } else {
                const createData: CreateUserDto = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password!,
                    rol: formData.rol,
                };

                await userService.create(createData);
                alert('Usuario creado exitosamente');
            }

            navigate('/admin/users');

        } catch (error: any) {
            console.error('Error guardando usuario:', error);
            const message = error.response?.data?.message || 'Error al guardar el usuario';
            setSubmitError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name as keyof UserFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (loading && isEditing) {
        return <div className="flex justify-center items-center h-64 text-gray-400">Cargando...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-100">
                    {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h1>
                <p className="text-gray-400 mt-2">
                    {isEditing ? 'Modifica la información del usuario' : 'Completa los datos del nuevo usuario'}
                </p>
            </div>

            {submitError && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 backdrop-blur-sm">
                    {submitError}
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-900 border text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-700'
                                }`}
                                placeholder="Ej: Juan Pérez"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-900 border text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.email ? 'border-red-500' : 'border-gray-700'
                                }`}
                                placeholder="usuario@gamezone.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-300 mb-2">
                                Rol *
                            </label>
                            <select
                                id="rol"
                                name="rol"
                                value={formData.rol}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-900 border text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.rol ? 'border-red-500' : 'border-gray-700'
                                }`}
                            >
                                <option value="cashier">Cajero</option>
                                <option value="admin">Administrador</option>
                                <option value="user">Usuario</option>
                            </select>
                            {errors.rol && (
                                <p className="mt-1 text-sm text-red-400">{errors.rol}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.rol === 'admin'
                                    ? 'Acceso completo al sistema'
                                    : 'Acceso limitado a ventas y consultas'}
                            </p>
                        </div>

                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-lg font-medium text-gray-100 mb-4">
                                {isEditing ? 'Cambiar Contraseña (opcional)' : 'Contraseña'}
                            </h3>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña {!isEditing && '*'}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-900 border text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.password ? 'border-red-500' : 'border-gray-700'
                                }`}
                                placeholder={isEditing ? 'Dejar vacío para mantener la actual' : '••••••••'}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                            )}
                            {!errors.password && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Mínimo 6 caracteres
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirmar Contraseña {!isEditing && '*'}
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 bg-gray-900 border text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                                }`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/admin/users')}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;