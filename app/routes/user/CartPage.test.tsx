// src/pages/CartPage/CartPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import CartPage from './CartPage';
import * as AuthContext from '~/context/AuthContext';
import { ventasService } from '~/services/api/ventasService';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('~/services/api/ventasService', () => ({
    ventasService: {
        create: vi.fn()
    }
}));

vi.mock('~/components/molecules/AlertMessage', () => ({
    AlertMessage: ({ type, message, onClose }: any) => (
        <div data-testid="alert-message" data-type={type}>
            {message}
            <button onClick={onClose}>Close</button>
        </div>
    )
}));

vi.mock('~/components/organisms/BoletaOrganism', () => ({
    BoletaOrganism: ({ boleta, venta, cartItems, metodoPago, cajero, onClose, onPrint }: any) => (
        <div data-testid="boleta-organism">
            <div>Boleta: {boleta.numero}</div>
            <div>Total: ${venta.total}</div>
            <div>Items: {cartItems.length}</div>
            <div>Método: {metodoPago}</div>
            <div>Cajero: {cajero}</div>
            <button onClick={onPrint}>Print</button>
            <button onClick={onClose}>Close Boleta</button>
        </div>
    )
}));

const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');

describe('CartPage', () => {
    const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user' as const
    };

    const mockCartItems = [
        {
            id: 1,
            nombre: 'Producto A',
            precio: 10000,
            cantidad: 2,
            stock: 50,
            imagen: 'https://example.com/producto-a.jpg'
        },
        {
            id: 2,
            nombre: 'Producto B',
            precio: 5000,
            cantidad: 1,
            stock: 30
        }
    ];

    beforeEach(() => {
        mockNavigate.mockClear();
        vi.clearAllMocks();
        localStorage.clear();

        mockUseAuth.mockReturnValue({
            user: mockUser,
            logout: vi.fn(),
            login: vi.fn(),
            register: vi.fn(),
            isAuthenticated: true,
            isLoading: false
        });

        // Mock console methods to avoid noise in tests
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('Empty Cart', () => {
        it('displays empty cart message when no items', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
            expect(screen.getByText('¡Agrega productos para comenzar a comprar!')).toBeInTheDocument();
        });

        it('navigates to home when "Ir a la Tienda" clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('🏠 Ir a la Tienda'));
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    describe('Cart with Items', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('loads and displays cart items from localStorage', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            expect(screen.getByText('Producto A')).toBeInTheDocument();
            expect(screen.getByText('Producto B')).toBeInTheDocument();
        });

        it('displays correct prices', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            expect(screen.getByText('$10.000')).toBeInTheDocument();
            expect(screen.getByText('$5.000')).toBeInTheDocument();
        });

        it('displays correct quantities', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const quantities = screen.getAllByText(/^[0-9]+$/);
            expect(quantities.some(el => el.textContent === '2')).toBeTruthy();
            expect(quantities.some(el => el.textContent === '1')).toBeTruthy();
        });

        it('calculates subtotal correctly', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            // 10000*2 + 5000*1 = 25000
            expect(screen.getByText('$25.000')).toBeInTheDocument();
        });

        it('calculates IVA correctly', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            // 25000 * 0.19 = 4750
            expect(screen.getByText('$4.750')).toBeInTheDocument();
        });

        it('calculates total correctly', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            // 25000 + 4750 = 29750
            expect(screen.getByText('$29.750')).toBeInTheDocument();
        });

        it('displays product images', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThan(0);
            expect(images[0]).toHaveAttribute('alt', 'Producto A');
        });
    });

    describe('Quantity Management', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('increases quantity when + button clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const increaseButtons = screen.getAllByText('+');
            fireEvent.click(increaseButtons[0]);

            const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
            expect(cart[0].cantidad).toBe(3);
        });

        it('decreases quantity when - button clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const decreaseButtons = screen.getAllByText('−');
            fireEvent.click(decreaseButtons[0]);

            const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
            expect(cart[0].cantidad).toBe(1);
        });

        it('removes item when quantity reaches 0', () => {
            const singleItem = [{ ...mockCartItems[0], cantidad: 1 }];
            localStorage.setItem('userCart', JSON.stringify(singleItem));

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const decreaseButton = screen.getByText('−');
            fireEvent.click(decreaseButton);

            const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
            expect(cart.length).toBe(0);
        });

        it('shows error when quantity exceeds stock', async () => {
            const lowStockItem = [{ ...mockCartItems[0], cantidad: 1, stock: 2 }];
            localStorage.setItem('userCart', JSON.stringify(lowStockItem));

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const increaseButton = screen.getByText('+');
            fireEvent.click(increaseButton);
            fireEvent.click(increaseButton); // Try to go to 3, but stock is 2

            await waitFor(() => {
                expect(screen.getByText(/Solo hay 2 unidades disponibles/)).toBeInTheDocument();
            });
        });

        it('dispatches cartUpdated event when quantity changes', () => {
            const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const increaseButton = screen.getAllByText('+')[0];
            fireEvent.click(increaseButton);

            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
        });
    });

    describe('Remove Items', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('removes individual item when delete button clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            const deleteButtons = screen.getAllByText('🗑️');
            fireEvent.click(deleteButtons[0]);

            const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
            expect(cart.length).toBe(1);
            expect(cart[0].id).toBe(2);
        });

        it('clears entire cart when "Vaciar Carrito" clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('🗑️ Vaciar Carrito'));

            expect(localStorage.getItem('userCart')).toBeNull();
        });
    });

    describe('Payment Modal', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('opens payment modal when "Procesar Pago" clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            expect(screen.getByText('Método de Pago')).toBeInTheDocument();
        });

        it('displays payment method options', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));

            expect(screen.getByText('💵 Efectivo')).toBeInTheDocument();
            expect(screen.getByText('💳 Tarjeta')).toBeInTheDocument();
            expect(screen.getByText('📱 Transferencia')).toBeInTheDocument();
        });

        it('changes payment method when selected', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));

            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: 'Efectivo' } });

            expect(select).toHaveValue('Efectivo');
        });

        it('closes payment modal when "Cancelar" clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('❌ Cancelar'));

            expect(screen.queryByText('Método de Pago')).not.toBeInTheDocument();
        });

        it('displays total in payment modal', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));

            const totals = screen.getAllByText('$29.750');
            expect(totals.length).toBeGreaterThan(0);
        });
    });

    describe('Checkout Process', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('shows error when user not logged in', async () => {
            mockUseAuth.mockReturnValue({
                user: null,
                logout: vi.fn(),
                login: vi.fn(),
                register: vi.fn(),
                isAuthenticated: false,
                isLoading: false
            });

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByText(/Debes iniciar sesión/)).toBeInTheDocument();
            });
        });

        it('calls ventasService.create with correct data', async () => {
            const mockResponse = {
                id: 1,
                boleta: { numero: 'BOL-001', fecha: '2025-12-08' },
                venta: { subtotal: 25000, iva: 4750, total: 29750 }
            };
            // @ts-ignore
            vi.mocked(ventasService.create).mockResolvedValue(mockResponse);

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(ventasService.create).toHaveBeenCalledWith({
                    usuarioId: 1,
                    metodoPago: 'Tarjeta',
                    detalleProductos: [
                        { productoId: 1, cantidad: 2 },
                        { productoId: 2, cantidad: 1 }
                    ]
                });
            });
        });

        it('shows loading state during checkout', async () => {
            vi.mocked(ventasService.create).mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByText('⏳ Procesando...')).toBeInTheDocument();
            });
        });

        it('shows boleta after successful checkout', async () => {
            const mockResponse = {
                id: 1,
                boleta: { numero: 'BOL-001', fecha: '2025-12-08' },
                venta: { subtotal: 25000, iva: 4750, total: 29750 }
            };
            // @ts-ignore
            vi.mocked(ventasService.create).mockResolvedValue(mockResponse);

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByTestId('boleta-organism')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('handles checkout error gracefully', async () => {
            vi.mocked(ventasService.create).mockRejectedValue({
                response: { data: { message: 'Error en el servidor' } }
            });

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByText(/Error en el servidor/)).toBeInTheDocument();
            });
        });
    });

    describe('Boleta Modal', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('clears cart and navigates when boleta closed', async () => {
            const mockResponse = {
                id: 1,
                boleta: { numero: 'BOL-001', fecha: '2025-12-08' },
                venta: { subtotal: 25000, iva: 4750, total: 29750 }
            };
            // @ts-ignore
            vi.mocked(ventasService.create).mockResolvedValue(mockResponse);

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByTestId('boleta-organism')).toBeInTheDocument();
            }, { timeout: 3000 });

            fireEvent.click(screen.getByText('Close Boleta'));

            expect(localStorage.getItem('userCart')).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('/orders');
        });

        it('calls window.print when print button clicked', async () => {
            const mockPrint = vi.fn();
            window.print = mockPrint;

            const mockResponse = {
                id: 1,
                boleta: { numero: 'BOL-001', fecha: '2025-12-08' },
                venta: { subtotal: 25000, iva: 4750, total: 29750 }
            };
            // @ts-ignore
            vi.mocked(ventasService.create).mockResolvedValue(mockResponse);

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('💳 Procesar Pago'));
            fireEvent.click(screen.getByText('✅ Confirmar'));

            await waitFor(() => {
                expect(screen.getByTestId('boleta-organism')).toBeInTheDocument();
            }, { timeout: 3000 });

            fireEvent.click(screen.getByText('Print'));
            expect(mockPrint).toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));
        });

        it('navigates to home when "Seguir Comprando" clicked', () => {
            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            fireEvent.click(screen.getByText('← Seguir Comprando'));
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });

    describe('Event Listeners', () => {
        it('reloads cart when cartUpdated event fired', () => {
            localStorage.setItem('userCart', JSON.stringify(mockCartItems));

            render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            expect(screen.getByText('Producto A')).toBeInTheDocument();

            // Change cart in localStorage
            const newCart = [{ ...mockCartItems[0] }];
            localStorage.setItem('userCart', JSON.stringify(newCart));

            window.dispatchEvent(new Event('cartUpdated'));

            // Component should reflect new cart
            expect(screen.queryByText('Producto B')).not.toBeInTheDocument();
        });

        it('cleans up event listener on unmount', () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            const { unmount } = render(
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            );

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('cartUpdated', expect.any(Function));
        });
    });
});