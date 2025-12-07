import React, { useState } from 'react';
import { FormField } from '~/components/molecules/FormField';
import { Button } from '~/components/atoms/Button';

interface RegisterFormProps {
    onSubmit: (data: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => Promise<void>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // 🔍 DEBUG: Ver qué valores se están enviando
        console.log('🔍 RegisterForm - Valores del formulario:', {
            name,
            email,
            password: password ? '***' : 'VACÍO',
            confirmPassword: confirmPassword ? '***' : 'VACÍO'
        });

        try {
            // ✅ CORRECCIÓN: Enviar como objeto
            await onSubmit({ name, email, password, confirmPassword });
        } catch (error) {
            console.error('Error en submit:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Validación de fortaleza de contraseña
    const getPasswordStrength = () => {
        if (password.length === 0) return { strength: 0, label: '', color: 'bg-gray-300' };
        if (password.length < 6) return { strength: 1, label: '❌ Muy débil', color: 'bg-red-500' };
        if (password.length < 8) return { strength: 2, label: '⚠️ Débil', color: 'bg-yellow-500' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { strength: 3, label: '✅ Fuerte', color: 'bg-green-500' };
        }
        return { strength: 2, label: '⚠️ Aceptable', color: 'bg-blue-500' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-gray-200">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Crear Cuenta
            </h2>

            <div className="space-y-4">
                {/* Campo Nombre */}
                <FormField
                    label="Nombre completo"
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                    autoComplete="name"
                />

                {/* Campo Email */}
                <FormField
                    label="Email"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoComplete="email"
                />

                {/* Campo Contraseña */}
                <div className="relative">
                    <FormField
                        label="Contraseña"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>

                {/* Indicador de fortaleza de contraseña */}
                {password.length > 0 && (
                    <div className="text-xs space-y-2">
                        <div className="flex gap-1">
                            {[1, 2, 3].map((level) => (
                                <div
                                    key={level}
                                    className={`h-2 flex-1 rounded transition-all ${
                                        level <= passwordStrength.strength
                                            ? passwordStrength.color
                                            : 'bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                        <p className={`font-medium ${
                            passwordStrength.strength >= 2 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {passwordStrength.label}
                        </p>
                    </div>
                )}

                {/* Campo Confirmar Contraseña */}
                <div className="relative">
                    <FormField
                        label="Confirmar contraseña"
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700 transition-colors"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>

                {/* Validación de coincidencia de contraseñas */}
                {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                        <span>❌</span>
                        <span>Las contraseñas no coinciden</span>
                    </p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>✅</span>
                        <span>Las contraseñas coinciden</span>
                    </p>
                )}

                {/* Términos y condiciones */}
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    Al registrarte, aceptas nuestros{' '}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">
                        Términos y Condiciones
                    </a>{' '}
                    y{' '}
                    <a href="#" className="text-blue-600 hover:underline font-semibold">
                        Política de Privacidad
                    </a>
                </div>
            </div>

            {/* Botón Submit */}
            <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-6"
            >
                🚀 Crear cuenta
            </Button>
        </form>
    );
};