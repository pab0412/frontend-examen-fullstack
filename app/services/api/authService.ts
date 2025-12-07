// File: app/services/api/authService.ts

import axiosInstance from './axiosConfig';
import type { LoginDto, RegisterDto, LoginResponse, UserProfile } from '../types';

export const authService = {
    /**
     * Iniciar sesión
     */
    login: async (credentials: LoginDto): Promise<LoginResponse> => {
        try {
            const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);

            console.log('🔥 Respuesta de login:', response.data);

            // ✅ Guardar token en localStorage
            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                console.log('✅ Token guardado correctamente');

                // ✅ Extraer usuario del token y guardarlo
                const userFromToken = authService.getUserFromToken();
                console.log('👤 Usuario extraído del token:', userFromToken);

                if (userFromToken) {
                    localStorage.setItem('user', JSON.stringify(userFromToken));
                }
            } else {
                console.error('❌ No se recibió access_token en la respuesta');
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error en login:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Registrar nuevo usuario
     */
    register: async (data: RegisterDto): Promise<LoginResponse> => {
        try {
            const response = await axiosInstance.post<LoginResponse>('/auth/register', data);

            console.log('🔥 Respuesta COMPLETA de registro:', response);
            console.log('🔥 response.data:', response.data);
            console.log('🔥 access_token existe?:', response.data.access_token);
            console.log('🔥 Propiedades de response.data:', Object.keys(response.data));

            // ✅ Guardar token si el registro incluye auto-login
            if (response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                console.log('✅ Token guardado después del registro');

                // ✅ Extraer usuario del token y guardarlo
                const userFromToken = authService.getUserFromToken();
                if (userFromToken) {
                    localStorage.setItem('user', JSON.stringify(userFromToken));
                }
            } else {
                console.error('❌ NO HAY access_token en la respuesta');
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error en registro:', error.response?.data || error.message);
            throw error;
        }
    },
    /**
     * Cerrar sesión
     */
    logout: (): void => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        console.log('🚪 Sesión cerrada, token eliminado');
    },

    /**
     * Obtener el token actual
     */
    getToken: (): string | null => {
        return localStorage.getItem('access_token');
    },

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            return false;
        }

        // Validar que el token no esté expirado
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < now) {
                console.warn('⚠️ Token expirado');
                localStorage.removeItem('access_token');
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Error al validar token:', error);
            return false;
        }
    },

    /**
     * Obtener perfil del usuario desde el token
     */
    getUserFromToken: (): UserProfile | null => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            console.warn('⚠️ No hay token en localStorage');
            return null;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Payload COMPLETO del token:', payload);
            console.log('🔍 Propiedades disponibles:', Object.keys(payload));

            // ✅ El JWT puede tener el ID en diferentes propiedades
            const userId = payload.id || payload.sub || payload.userId || payload.user_id;

            if (!userId) {
                console.error('❌ No se encontró ID en el token. Payload completo:', payload);
                return null;
            }

            const userProfile: UserProfile = {
                id: Number(userId),
                sub: payload.sub || String(userId),
                email: payload.email,
                name: payload.name || payload.nombre || payload.username,
                rol: payload.rol || payload.role || 'user',
                iat: payload.iat,
                exp: payload.exp
            };

            console.log('✅ UserProfile creado:', userProfile);

            return userProfile;
        } catch (error) {
            console.error('❌ Error al decodificar token:', error);
            return null;
        }
    },

    /**
     * Obtener perfil del usuario desde el backend
     */
    getProfile: async (): Promise<UserProfile> => {
        try {
            const response = await axiosInstance.get<UserProfile>('/auth/profile');
            console.log('📡 Perfil recibido del backend:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo perfil:', error.response?.data || error.message);
            throw error;
        }
    },


};