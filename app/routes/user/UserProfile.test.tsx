import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from './UserProfile';
import { useAuth } from '~/context/AuthContext';
import { userService } from '~/services/api/userService';
import { useNavigate } from 'react-router';

// Mock de servicios y hooks
vi.mock('~/services/api/userService', () => ({
    userService: {
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('~/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('react-router', () => ({
    useNavigate: vi.fn(),
}));

describe('UserProfile Component', () => {
    const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user',
    };

    const mockLogout = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            logout: mockLogout,
            login: vi.fn(),
        } as any);
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    describe('Renderizado inicial', () => {
        it('debe renderizar información del usuario', () => {
            render(<UserProfile />);

            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
            expect(screen.getByText('juan@example.com')).toBeInTheDocument();
        });

        it('debe mostrar rol de usuario', () => {
            render(<UserProfile />);

            expect(screen.getByText('🛒 Cliente')).toBeInTheDocument();
        });

        it('debe mostrar rol de administrador', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { ...mockUser, rol: 'admin' },
                logout: mockLogout,
                login: vi.fn(),
            } as any);

            render(<UserProfile />);

            expect(screen.getByText('👑 Administrador')).toBeInTheDocument();
        });

        it('debe mostrar rol de cajero', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { ...mockUser, rol: 'cashier' },
                logout: mockLogout,
                login: vi.fn(),
            } as any);

            render(<UserProfile />);

            expect(screen.getByText('💼 Cajero')).toBeInTheDocument();
        });

        it('debe pre-llenar formulario con datos del usuario', () => {
            render(<UserProfile />);

            const nameInput = screen.getByDisplayValue('Juan Pérez');
            const emailInput = screen.getByDisplayValue('juan@example.com');

            expect(nameInput).toBeInTheDocument();
            expect(emailInput).toBeInTheDocument();
        });

        it('debe mostrar mensaje de carga si no hay usuario', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                logout: mockLogout,
                login: vi.fn(),
            } as any);

            render(<UserProfile />);

            expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
        });
    });

    describe('Actualización de perfil', () => {
        it('debe actualizar nombre y email', async () => {
            vi.mocked(userService.update).mockResolvedValue({} as any);

            render(<UserProfile />);

            const nameInput = screen.getByDisplayValue('Juan Pérez');
            const emailInput = screen.getByDisplayValue('juan@example.com');

            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Pedro García');

            await userEvent.clear(emailInput);
            await userEvent.type(emailInput, 'pedro@example.com');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(userService.update).toHaveBeenCalledWith(1, {
                    name: 'Pedro García',
                    email: 'pedro@example.com',
                });
            });

            expect(screen.getByText('¡Perfil actualizado exitosamente!')).toBeInTheDocument();
        });

        it('debe validar campos requeridos', async () => {
            render(<UserProfile />);

            const nameInput = screen.getByDisplayValue('Juan Pérez');
            await userEvent.clear(nameInput);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Nombre y email son requeridos')).toBeInTheDocument();
            });

            expect(userService.update).not.toHaveBeenCalled();
        });

        it('debe validar email requerido', async () => {
            render(<UserProfile />);

            const emailInput = screen.getByDisplayValue('juan@example.com');
            await userEvent.clear(emailInput);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Nombre y email son requeridos')).toBeInTheDocument();
            });
        });

        it('debe manejar error del servidor', async () => {
            vi.mocked(userService.update).mockRejectedValue({
                response: { data: { message: 'Email ya existe' } },
            });

            render(<UserProfile />);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Email ya existe')).toBeInTheDocument();
            });
        });
    });

    describe('Cambio de contraseña', () => {
        it('debe cambiar contraseña correctamente', async () => {
            vi.mocked(userService.update).mockResolvedValue({} as any);

            render(<UserProfile />);

            const currentPasswordInput = screen.getByPlaceholderText('••••••••');
            const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');

            await userEvent.type(currentPasswordInput, 'oldPassword123');
            await userEvent.type(newPasswordInputs[1], 'newPassword123');
            await userEvent.type(newPasswordInputs[2], 'newPassword123');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(userService.update).toHaveBeenCalledWith(1, {
                    name: 'Juan Pérez',
                    email: 'juan@example.com',
                    password: 'newPassword123',
                });
            });
        });

        it('debe validar que se requiere contraseña actual', async () => {
            render(<UserProfile />);

            const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');
            await userEvent.type(newPasswordInputs[1], 'newPassword123');
            await userEvent.type(newPasswordInputs[2], 'newPassword123');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(
                    screen.getByText('Debes ingresar tu contraseña actual para cambiarla')
                ).toBeInTheDocument();
            });
        });

        it('debe validar que las contraseñas coincidan', async () => {
            render(<UserProfile />);

            const currentPasswordInput = screen.getByPlaceholderText('••••••••');
            const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');

            await userEvent.type(currentPasswordInput, 'oldPassword123');
            await userEvent.type(newPasswordInputs[1], 'newPassword123');
            await userEvent.type(newPasswordInputs[2], 'differentPassword');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
            });
        });

        it('debe validar longitud mínima de contraseña', async () => {
            render(<UserProfile />);

            const currentPasswordInput = screen.getByPlaceholderText('••••••••');
            const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');

            await userEvent.type(currentPasswordInput, 'oldPassword123');
            await userEvent.type(newPasswordInputs[1], '12345');
            await userEvent.type(newPasswordInputs[2], '12345');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(
                    screen.getByText('La contraseña debe tener al menos 6 caracteres')
                ).toBeInTheDocument();
            });
        });

        it('debe limpiar campos de contraseña después de actualización exitosa', async () => {
            vi.mocked(userService.update).mockResolvedValue({} as any);

            render(<UserProfile />);

            const currentPasswordInput = screen.getByPlaceholderText('••••••••');
            const newPasswordInputs = screen.getAllByPlaceholderText('••••••••');

            await userEvent.type(currentPasswordInput, 'oldPassword123');
            await userEvent.type(newPasswordInputs[1], 'newPassword123');
            await userEvent.type(newPasswordInputs[2], 'newPassword123');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(currentPasswordInput).toHaveValue('');
                expect(newPasswordInputs[1]).toHaveValue('');
                expect(newPasswordInputs[2]).toHaveValue('');
            });
        });
    });

    describe('Navegación', () => {
        it('debe navegar a pedidos', async () => {
            render(<UserProfile />);

            const ordersButton = screen.getByText('📦 Ver Mis Pedidos');
            await userEvent.click(ordersButton);

            expect(mockNavigate).toHaveBeenCalledWith('/orders');
        });

        it('debe navegar a la tienda', async () => {
            render(<UserProfile />);

            const storeButton = screen.getByText('🛒 Ir a la Tienda');
            await userEvent.click(storeButton);

            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    describe('Eliminación de cuenta', () => {
        beforeEach(() => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            vi.spyOn(window, 'prompt').mockReturnValue('ELIMINAR');
            vi.spyOn(window, 'alert').mockImplementation(() => {});
        });

        it('debe solicitar confirmación antes de eliminar', async () => {
            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            expect(window.confirm).toHaveBeenCalledWith(
                expect.stringContaining('¿Estás ABSOLUTAMENTE seguro')
            );
        });

        it('debe solicitar escribir "ELIMINAR" para confirmar', async () => {
            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            expect(window.prompt).toHaveBeenCalledWith('Escribe "ELIMINAR" para confirmar:');
        });

        it('debe cancelar si no se confirma en el primer prompt', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);

            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            expect(userService.delete).not.toHaveBeenCalled();
        });

        it('debe cancelar si no se escribe "ELIMINAR" correctamente', async () => {
            vi.spyOn(window, 'prompt').mockReturnValue('eliminar');

            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(
                    screen.getByText('Confirmación incorrecta. Cuenta no eliminada.')
                ).toBeInTheDocument();
            });

            expect(userService.delete).not.toHaveBeenCalled();
        });

        it('debe eliminar cuenta correctamente', async () => {
            vi.mocked(userService.delete).mockResolvedValue({} as any);

            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(userService.delete).toHaveBeenCalledWith(1);
            });

            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });

        it('debe manejar error al eliminar cuenta', async () => {
            vi.mocked(userService.delete).mockRejectedValue({
                response: { data: { message: 'No se puede eliminar' } },
            });

            render(<UserProfile />);

            const deleteButton = screen.getByText('🗑️ Eliminar mi Cuenta');
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(screen.getByText('No se puede eliminar')).toBeInTheDocument();
            });

            expect(mockLogout).not.toHaveBeenCalled();
        });
    });

    describe('Estados de carga', () => {
        it('debe deshabilitar botón mientras procesa', async () => {
            vi.mocked(userService.update).mockImplementation(
                () => new Promise(() => {})
            );

            render(<UserProfile />);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('⏳ Guardando...')).toBeInTheDocument();
            });

            const button = screen.getByText('⏳ Guardando...').closest('button');
            expect(button).toBeDisabled();
        });

        it('debe deshabilitar inputs mientras procesa', async () => {
            vi.mocked(userService.update).mockImplementation(
                () => new Promise(() => {})
            );

            render(<UserProfile />);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                const nameInput = screen.getByDisplayValue('Juan Pérez');
                expect(nameInput).toBeDisabled();
            });
        });
    });

    describe('Mensajes de alerta', () => {
        it('debe ocultar mensaje de éxito después de 3 segundos', async () => {
            vi.useFakeTimers();
            vi.mocked(userService.update).mockResolvedValue({} as any);

            render(<UserProfile />);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('¡Perfil actualizado exitosamente!')).toBeInTheDocument();
            });

            vi.advanceTimersByTime(3000);

            await waitFor(() => {
                expect(
                    screen.queryByText('¡Perfil actualizado exitosamente!')
                ).not.toBeInTheDocument();
            });

            vi.useRealTimers();
        });

        it('debe ocultar mensaje de error después de 3 segundos', async () => {
            vi.useFakeTimers();

            render(<UserProfile />);

            const nameInput = screen.getByDisplayValue('Juan Pérez');
            await userEvent.clear(nameInput);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Nombre y email son requeridos')).toBeInTheDocument();
            });

            vi.advanceTimersByTime(3000);

            await waitFor(() => {
                expect(
                    screen.queryByText('Nombre y email son requeridos')
                ).not.toBeInTheDocument();
            });

            vi.useRealTimers();
        });
    });

    describe('Edge cases', () => {
        it('debe manejar usuario sin ID', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { name: 'Juan', email: 'juan@example.com', rol: 'user' },
                logout: mockLogout,
                login: vi.fn(),
            } as any);

            render(<UserProfile />);

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(
                    screen.getByText('No se pudo identificar al usuario')
                ).toBeInTheDocument();
            });
        });

        it('debe permitir actualizar sin cambiar contraseña', async () => {
            vi.mocked(userService.update).mockResolvedValue({} as any);

            render(<UserProfile />);

            const nameInput = screen.getByDisplayValue('Juan Pérez');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Nuevo Nombre');

            const saveButton = screen.getByText('💾 Guardar Cambios');
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(userService.update).toHaveBeenCalledWith(1, {
                    name: 'Nuevo Nombre',
                    email: 'juan@example.com',
                });
            });

            // No debe incluir password en la actualización
            expect(userService.update).toHaveBeenCalledWith(
                expect.any(Number),
                expect.not.objectContaining({ password: expect.anything() })
            );
        });
    });
});