import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserOrders from './UserOrders';
import { ventasService } from '~/services/api/ventasService';
import { useAuth } from '~/context/AuthContext';

// Mock de servicios
vi.mock('~/services/api/ventasService', () => ({
    ventasService: {
        getByUsuario: vi.fn(),
    },
}));

vi.mock('~/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('UserOrders Component', () => {
    const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user',
    };

    const mockOrders = [
        {
            id: 1,
            fecha: '2024-12-01T10:30:00.000Z',
            total: 110000,
            subtotal: 92437,
            iva: 17563,
            estado: 'completada',
            metodoPago: 'Tarjeta',
            usuarioId: 1,
            detalleProductos: [
                {
                    nombre: 'The Last of Us',
                    cantidad: 2,
                    precioUnitario: 50000,
                    subtotal: 100000,
                },
            ],
        },
        {
            id: 2,
            fecha: '2024-12-05T15:45:00.000Z',
            total: 60000,
            subtotal: 50420,
            iva: 9580,
            estado: 'pendiente',
            metodoPago: 'Efectivo',
            usuarioId: 1,
            detalleProductos: [
                {
                    nombre: 'FIFA 24',
                    cantidad: 1,
                    precioUnitario: 60000,
                    subtotal: 60000,
                },
            ],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: mockUser,
            logout: vi.fn(),
            login: vi.fn(),
        } as any);
    });

    describe('Carga de pedidos', () => {
        it('debe mostrar loader mientras verifica usuario', () => {
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                logout: vi.fn(),
                login: vi.fn(),
            } as any);

            render(<UserOrders />);

            expect(screen.getByText('Verificando usuario...')).toBeInTheDocument();
        });

        it('debe mostrar loader mientras carga pedidos', () => {
            vi.mocked(ventasService.getByUsuario).mockImplementation(
                () => new Promise(() => {})
            );

            render(<UserOrders />);

            expect(screen.getByText('Cargando pedidos...')).toBeInTheDocument();
        });

        it('debe cargar y mostrar pedidos del usuario', async () => {
            // @ts-ignore
            vi.mocked(ventasService.getByUsuario).mockResolvedValue(mockOrders);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('Pedido #1')).toBeInTheDocument();
            });

            expect(screen.getByText('Pedido #2')).toBeInTheDocument();
            expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            expect(screen.getByText('FIFA 24')).toBeInTheDocument();
        });

        it('debe llamar al servicio con el ID del usuario correcto', async () => {
            // @ts-ignore
            vi.mocked(ventasService.getByUsuario).mockResolvedValue(mockOrders);

            render(<UserOrders />);

            await waitFor(() => {
                expect(ventasService.getByUsuario).toHaveBeenCalledWith(1);
            });
        });

        it('debe manejar error cuando no hay ID de usuario', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: { name: 'Juan', email: 'juan@example.com', rol: 'user' },
                logout: vi.fn(),
                login: vi.fn(),
            } as any);

            render(<UserOrders />);

            await waitFor(() => {
                expect(
                    screen.getByText(/El usuario no tiene un ID válido/)
                ).toBeInTheDocument();
            });
        });

        it('debe manejar error cuando no hay usuario', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                logout: vi.fn(),
                login: vi.fn(),
            } as any);

            render(<UserOrders />);

            await waitFor(() => {
                expect(
                    screen.getByText(/No has iniciado sesión/)
                ).toBeInTheDocument();
            });
        });

        it('debe manejar errores del servicio', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(ventasService.getByUsuario).mockRejectedValue({
                response: { data: { message: 'Error del servidor' } },
            });

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('Error del servidor')).toBeInTheDocument();
            });

            consoleError.mockRestore();
        });
    });

    describe('Visualización de pedidos', () => {
        beforeEach(() => {
            // @ts-ignore
            return vi.mocked(ventasService.getByUsuario).mockResolvedValue(mockOrders);
        });

        it('debe mostrar información de usuario', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText(/Bienvenido\/a/)).toBeInTheDocument();
            });

            expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        });

        it('debe mostrar estado "Completado" correctamente', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('✅ Completado')).toBeInTheDocument();
            });
        });

        it('debe mostrar estado "Pendiente" correctamente', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('⏳ Pendiente')).toBeInTheDocument();
            });
        });

        it('debe mostrar método de pago', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('💳 Tarjeta')).toBeInTheDocument();
            });

            expect(screen.getByText('💵 Efectivo')).toBeInTheDocument();
        });

        it('debe formatear fecha correctamente', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText(/1 de diciembre de 2024/)).toBeInTheDocument();
            });
        });

        it('debe formatear precios con separador de miles', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('$110.000')).toBeInTheDocument();
            });
        });

        it('debe mostrar número de productos', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                const productCounts = screen.getAllByText(/producto\(s\)/);
                expect(productCounts).toHaveLength(2);
            });
        });
    });

    describe('Expandir/colapsar detalles', () => {
        beforeEach(() => {
            // @ts-ignore
            return vi.mocked(ventasService.getByUsuario).mockResolvedValue(mockOrders);
        });

        it('debe expandir detalles al hacer click', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('Pedido #1')).toBeInTheDocument();
            });

            const expandButtons = screen.getAllByText('▼ Ver detalles');
            await userEvent.click(expandButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Cantidad: 2 x $50.000')).toBeInTheDocument();
            });
        });

        it('debe colapsar detalles al hacer click nuevamente', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('Pedido #1')).toBeInTheDocument();
            });

            const expandButtons = screen.getAllByText('▼ Ver detalles');
            await userEvent.click(expandButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('▲ Ocultar detalles')).toBeInTheDocument();
            });

            const collapseButton = screen.getByText('▲ Ocultar detalles');
            await userEvent.click(collapseButton);

            await waitFor(() => {
                expect(screen.queryByText('Cantidad: 2 x $50.000')).not.toBeInTheDocument();
            });
        });

        it('debe mostrar subtotal, IVA y total en detalles', async () => {
            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('Pedido #1')).toBeInTheDocument();
            });

            const expandButtons = screen.getAllByText('▼ Ver detalles');
            await userEvent.click(expandButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Subtotal:')).toBeInTheDocument();
                expect(screen.getByText('IVA (19%):')).toBeInTheDocument();
            });
        });
    });

    describe('Estado vacío', () => {
        it('debe mostrar mensaje cuando no hay pedidos', async () => {
            vi.mocked(ventasService.getByUsuario).mockResolvedValue([]);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('No tienes pedidos aún')).toBeInTheDocument();
            });

            expect(
                screen.getByText('¡Comienza a comprar para ver tus pedidos aquí!')
            ).toBeInTheDocument();
        });

        it('debe mostrar enlace a la tienda cuando no hay pedidos', async () => {
            vi.mocked(ventasService.getByUsuario).mockResolvedValue([]);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('🏠 Ir a la Tienda')).toBeInTheDocument();
            });

            const link = screen.getByText('🏠 Ir a la Tienda').closest('a');
            expect(link).toHaveAttribute('href', '/home');
        });
    });

    describe('Manejo de errores', () => {
        it('debe mostrar botón de reintentar en caso de error', async () => {
            vi.mocked(ventasService.getByUsuario).mockRejectedValue(new Error('Network error'));

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('🔄 Reintentar')).toBeInTheDocument();
            });
        });

        it('debe reintentar carga al hacer click en reintentar', async () => {
            // @ts-ignore
            vi.mocked(ventasService.getByUsuario)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockOrders);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('🔄 Reintentar')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('🔄 Reintentar');
            await userEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByText('Pedido #1')).toBeInTheDocument();
            });
        });

        it('debe mostrar enlace a login cuando no hay usuario', async () => {
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                logout: vi.fn(),
                login: vi.fn(),
            } as any);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('🔑 Ir a Iniciar Sesión')).toBeInTheDocument();
            });

            const link = screen.getByText('🔑 Ir a Iniciar Sesión').closest('a');
            expect(link).toHaveAttribute('href', '/login');
        });
    });

    describe('Edge cases', () => {
        it('debe manejar pedidos con múltiples productos', async () => {
            const orderWithMultipleProducts = [
                {
                    ...mockOrders[0],
                    detalleProductos: [
                        {
                            nombre: 'Producto 1',
                            cantidad: 1,
                            precioUnitario: 10000,
                            subtotal: 10000,
                        },
                        {
                            nombre: 'Producto 2',
                            cantidad: 2,
                            precioUnitario: 20000,
                            subtotal: 40000,
                        },
                    ],
                },
            ];

            // @ts-ignore
            vi.mocked(ventasService.getByUsuario).mockResolvedValue(orderWithMultipleProducts);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('2 producto(s)')).toBeInTheDocument();
            });

            const expandButton = screen.getByText('▼ Ver detalles');
            await userEvent.click(expandButton);

            await waitFor(() => {
                expect(screen.getByText('Producto 1')).toBeInTheDocument();
                expect(screen.getByText('Producto 2')).toBeInTheDocument();
            });
        });

        it('debe manejar estado "anulado"', async () => {
            const cancelledOrder = [
                {
                    ...mockOrders[0],
                    estado: 'anulada',
                },
            ];

            // @ts-ignore
            vi.mocked(ventasService.getByUsuario).mockResolvedValue(cancelledOrder);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('❌ Anulado')).toBeInTheDocument();
            });
        });

        it('debe manejar método de pago "Transferencia"', async () => {
            const orderWithTransfer = [
                {
                    ...mockOrders[0],
                    metodoPago: 'Transferencia',
                },
            ];

            // @ts-ignore
            vi.mocked(ventasService.getByUsuario).mockResolvedValue(orderWithTransfer);

            render(<UserOrders />);

            await waitFor(() => {
                expect(screen.getByText('📱 Transferencia')).toBeInTheDocument();
            });
        });
    });
});