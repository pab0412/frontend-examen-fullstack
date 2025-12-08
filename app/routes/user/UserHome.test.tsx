import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserHome from './UserHome';
import { productosService } from '~/services/api/productosService';

// Mock del servicio
vi.mock('~/services/api/productosService', () => ({
    productosService: {
        getAll: vi.fn(),
    },
}));

// Mock de localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('UserHome Component', () => {
    const mockProducts = [
        {
            id: 1,
            nombre: 'The Last of Us',
            descripcion: 'Juego de aventura',
            precio: 50000,
            stock: 15,
            categoria: 'Aventura',
            activo: true,
            imagen: 'https://example.com/image1.jpg',
        },
        {
            id: 2,
            nombre: 'FIFA 24',
            descripcion: 'Juego de deportes',
            precio: 60000,
            stock: 5,
            categoria: 'Deportes',
            activo: true,
            imagen: 'https://example.com/image2.jpg',
        },
        {
            id: 3,
            nombre: 'God of War',
            descripcion: 'Acción épica',
            precio: 55000,
            stock: 0,
            categoria: 'Acción',
            activo: true,
            imagen: 'https://example.com/image3.jpg',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        vi.spyOn(window, 'dispatchEvent');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Carga de productos', () => {
        it('debe mostrar loader mientras carga productos', () => {
            vi.mocked(productosService.getAll).mockImplementation(
                () => new Promise(() => {})
            );

            render(<UserHome />);

            expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
        });

        it('debe cargar y mostrar productos activos con stock', async () => {
            vi.mocked(productosService.getAll).mockResolvedValue(mockProducts);

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            expect(screen.getByText('FIFA 24')).toBeInTheDocument();
            expect(screen.queryByText('God of War')).not.toBeInTheDocument(); // Sin stock
        });

        it('debe filtrar productos sin stock', async () => {
            vi.mocked(productosService.getAll).mockResolvedValue(mockProducts);

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            // God of War tiene stock 0, no debe aparecer
            expect(screen.queryByText('God of War')).not.toBeInTheDocument();
        });

        it('debe manejar errores al cargar productos', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(productosService.getAll).mockRejectedValue(new Error('Network error'));

            render(<UserHome />);

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(
                    'Error cargando productos:',
                    expect.any(Error)
                );
            });

            consoleError.mockRestore();
        });
    });

    describe('Búsqueda y filtrado', () => {
        beforeEach(async () => {
            // @ts-ignore
            return vi.mocked(productosService.getAll).mockResolvedValue(mockProducts);
        });

        it('debe filtrar productos por término de búsqueda', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('🔍 Buscar juegos...');
            await userEvent.type(searchInput, 'FIFA');

            await waitFor(() => {
                expect(screen.getByText('FIFA 24')).toBeInTheDocument();
                expect(screen.queryByText('The Last of Us')).not.toBeInTheDocument();
            });
        });

        it('debe ser case-insensitive en la búsqueda', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('🔍 Buscar juegos...');
            await userEvent.type(searchInput, 'fifa');

            await waitFor(() => {
                expect(screen.getByText('FIFA 24')).toBeInTheDocument();
            });
        });

        it('debe filtrar productos por categoría', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const categorySelect = screen.getByRole('combobox');
            await userEvent.selectOptions(categorySelect, 'Deportes');

            await waitFor(() => {
                expect(screen.getByText('FIFA 24')).toBeInTheDocument();
                expect(screen.queryByText('The Last of Us')).not.toBeInTheDocument();
            });
        });

        it('debe combinar búsqueda y filtro de categoría', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const categorySelect = screen.getByRole('combobox');
            await userEvent.selectOptions(categorySelect, 'Aventura');

            const searchInput = screen.getByPlaceholderText('🔍 Buscar juegos...');
            await userEvent.type(searchInput, 'Last');

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
                expect(screen.queryByText('FIFA 24')).not.toBeInTheDocument();
            });
        });
    });

    describe('Carrito de compras', () => {
        beforeEach(async () => {
            vi.mocked(productosService.getAll).mockResolvedValue(mockProducts);
        });

        it('debe agregar producto al carrito', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const addButtons = screen.getAllByText('🛒 Agregar al Carrito');
            await userEvent.click(addButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us agregado al carrito')).toBeInTheDocument();
            });

            const cart = JSON.parse(localStorageMock.getItem('userCart') || '[]');
            expect(cart).toHaveLength(1);
            expect(cart[0].nombre).toBe('The Last of Us');
            expect(cart[0].cantidad).toBe(1);
        });

        it('debe incrementar cantidad si el producto ya está en el carrito', async () => {
            localStorageMock.setItem(
                'userCart',
                JSON.stringify([
                    {
                        id: 1,
                        nombre: 'The Last of Us',
                        precio: 50000,
                        cantidad: 1,
                        stock: 15,
                    },
                ])
            );

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const addButtons = screen.getAllByText('🛒 Agregar al Carrito');
            await userEvent.click(addButtons[0]);

            const cart = JSON.parse(localStorageMock.getItem('userCart') || '[]');
            expect(cart[0].cantidad).toBe(2);
        });

        it('debe prevenir agregar más productos que el stock disponible', async () => {
            localStorageMock.setItem(
                'userCart',
                JSON.stringify([
                    {
                        id: 2,
                        nombre: 'FIFA 24',
                        precio: 60000,
                        cantidad: 5,
                        stock: 5,
                    },
                ])
            );

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('FIFA 24')).toBeInTheDocument();
            });

            const addButtons = screen.getAllByText('🛒 Agregar al Carrito');
            await userEvent.click(addButtons[1]);

            await waitFor(() => {
                expect(
                    screen.getByText('No hay más stock disponible de FIFA 24')
                ).toBeInTheDocument();
            });

            const cart = JSON.parse(localStorageMock.getItem('userCart') || '[]');
            expect(cart[0].cantidad).toBe(5); // No debe incrementar
        });

        it('debe disparar evento cartUpdated al agregar producto', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const addButtons = screen.getAllByText('🛒 Agregar al Carrito');
            await userEvent.click(addButtons[0]);

            await waitFor(() => {
                expect(window.dispatchEvent).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'cartUpdated' })
                );
            });
        });

        it('debe ocultar mensaje de éxito después de 3 segundos', async () => {
            vi.useFakeTimers();

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const addButtons = screen.getAllByText('🛒 Agregar al Carrito');
            await userEvent.click(addButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us agregado al carrito')).toBeInTheDocument();
            });

            vi.advanceTimersByTime(3000);

            await waitFor(() => {
                expect(
                    screen.queryByText('The Last of Us agregado al carrito')
                ).not.toBeInTheDocument();
            });

            vi.useRealTimers();
        });
    });

    describe('UI y visualización', () => {
        beforeEach(async () => {
            vi.mocked(productosService.getAll).mockResolvedValue(mockProducts);
        });

        it('debe mostrar banner de bienvenida', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText(/¡Bienvenido a GameZone!/)).toBeInTheDocument();
            });
        });

        it('debe mostrar badge "Últimas unidades" para productos con stock bajo', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('FIFA 24')).toBeInTheDocument();
            });

            expect(screen.getByText('¡Últimas unidades!')).toBeInTheDocument();
        });

        it('debe mostrar todas las categorías en el select', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('The Last of Us')).toBeInTheDocument();
            });

            const categorySelect = screen.getByRole('combobox');
            const options = Array.from(categorySelect.querySelectorAll('option')).map(
                (opt) => opt.textContent
            );

            expect(options).toContain('Todos');
            expect(options).toContain('Aventura');
            expect(options).toContain('Deportes');
        });

        it('debe mostrar precio formateado correctamente', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('$50.000')).toBeInTheDocument();
            });
        });

        it('debe mostrar stock disponible', async () => {
            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('15 unidades')).toBeInTheDocument();
            });
        });
    });

    describe('Edge cases', () => {
        it('debe manejar lista vacía de productos', async () => {
            vi.mocked(productosService.getAll).mockResolvedValue([]);

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.queryByText('The Last of Us')).not.toBeInTheDocument();
            });
        });

        it('debe manejar productos sin categoría', async () => {
            const productsWithoutCategory = [
                {
                    id: 1,
                    nombre: 'Test Product',
                    precio: 10000,
                    stock: 10,
                    categoria: '',
                    activo: true,
                },
            ];

            vi.mocked(productosService.getAll).mockResolvedValue(productsWithoutCategory);

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('Test Product')).toBeInTheDocument();
            });
        });

        it('debe manejar productos sin imagen', async () => {
            const productsWithoutImage = [
                {
                    id: 1,
                    nombre: 'Test Product',
                    precio: 10000,
                    stock: 10,
                    categoria: 'Test',
                    activo: true,
                    imagen: '',
                },
            ];

            // @ts-ignore
            vi.mocked(productosService.getAll).mockResolvedValue(productsWithoutImage);

            render(<UserHome />);

            await waitFor(() => {
                expect(screen.getByText('Test Product')).toBeInTheDocument();
            });

            const img = screen.getByAltText('Test Product');
            expect(img).toHaveAttribute('src', expect.stringContaining('picsum.photos'));
        });
    });
});