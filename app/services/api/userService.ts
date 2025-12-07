// app/services/api/userService.ts
import axiosInstance from './axiosConfig';
import type { CreateUserDto, UpdateUserDto, UserResponse } from '../types';

export const userService = {
    getAll: async (): Promise<UserResponse[]> => {
        const response = await axiosInstance.get<UserResponse[]>('/auth/users');
        return response.data;
    },

    getOne: async (id: number): Promise<UserResponse> => {
        const response = await axiosInstance.get<UserResponse>(`/auth/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserDto): Promise<UserResponse> => {
        const response = await axiosInstance.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    update: async (id: number, data: UpdateUserDto): Promise<UserResponse> => {
        const response = await axiosInstance.patch<UserResponse>(`/auth/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/auth/users/${id}`);
    },
};