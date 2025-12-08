import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '~/services/api';
import type { LoginDto, RegisterDto, UserProfile } from '~/services/types';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (credentials: LoginDto) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCashier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                console.log('🔑 Token encontrado');

                const userFromToken = authService.getUserFromToken();

                if (userFromToken) {
                    console.log('👤 Usuario extraído del token:', userFromToken);
                    console.log('🆔 ID del usuario:', userFromToken.id);
                    console.log('📋 Sub del token:', userFromToken.sub);

                    const userId = userFromToken.id || userFromToken.sub;
                    const userProfile = {
                        ...userFromToken,
                        id: userId
                    };

                    setUser(userProfile as UserProfile);
                } else {
                    console.warn('⚠️ No se pudo extraer usuario del token');
                    authService.logout();
                }
            } else {
                console.log('❌ No hay token en localStorage');
            }
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            authService.logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: LoginDto) => {
        try {
            const response = await authService.login(credentials);
            console.log('🔐 Login exitoso');

            const userFromToken = authService.getUserFromToken();

            if (userFromToken) {
                console.log('👤 Usuario después del login:', userFromToken);
                console.log('🆔 ID del usuario:', userFromToken.id);

                localStorage.setItem('user', JSON.stringify(userFromToken));
                setUser(userFromToken);
            } else {
                throw new Error('No se pudo extraer el usuario del token');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            console.log('📝 AuthContext.register llamado con:', { name, email, password: '***' });

            if (!name || !email || !password) {
                throw new Error('Todos los campos son obligatorios');
            }

            const registerData: RegisterDto = {
                name: name.trim(),
                email: email.trim(),
                password: password
            };

            console.log('📤 Enviando a authService:', registerData);

            // 1. Registrar usuario (NO devuelve token)
            await authService.register(registerData);

            console.log('✅ Usuario creado exitosamente');

            // 2. Hacer login automáticamente
            console.log('🔐 Haciendo login automático...');
            await login({ email: email.trim(), password: password });

            console.log('✅ Login exitoso después del registro');

        } catch (error) {
            console.error('❌ Error en AuthContext.register:', error);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.rol === 'admin',
                isCashier: user?.rol === 'cashier',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};