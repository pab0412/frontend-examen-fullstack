// src/layouts/UserLayout.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import UserLayout from './user-layout';
import * as AuthContext from '~/context/AuthContext';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        Outlet: () => <div data-testid="outlet">Main Content</div>
    };
});

// Mock AuthContext
const mockLogout = vi.fn();
const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');

describe('UserLayout', () => {
    const mockUser = {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'user' as const
    };

    beforeEach(() => {
        mockNavigate.mockClear();
        mockLogout.mockClear();
        localStorage.clear();

        // @ts-ignore
        mockUseAuth.mockReturnValue({
            user: mockUser,
            logout: mockLogout,
            login: vi.fn(),
            register: vi.fn(),
            isAuthenticated: true,
            isLoading: false
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('renders the layout with navbar and footer', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('GameZone')).toBeInTheDocument();
        expect(screen.getByText(/© 2024 GameZone/)).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText(/🏠 Tienda/)).toBeInTheDocument();
        expect(screen.getByText(/📦 Mis Pedidos/)).toBeInTheDocument();
    });

    it('displays user name in profile section', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('displays user initial in avatar', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays default values when no user', () => {
        // @ts-ignore
        mockUseAuth.mockReturnValue({
            user: null,
            logout: mockLogout,
            login: vi.fn(),
            register: vi.fn(),
            isAuthenticated: false,
            isLoading: false
        });

        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('Usuario')).toBeInTheDocument();
        expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('renders cart icon with count badge', () => {
        const cart = [
            { id: 1, nombre: 'Producto 1', cantidad: 2, precio: 1000, stock: 10 },
            { id: 2, nombre: 'Producto 2', cantidad: 3, precio: 2000, stock: 5 }
        ];
        localStorage.setItem('userCart', JSON.stringify(cart));

        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('5')).toBeInTheDocument(); // 2 + 3 items
    });

    it('does not show cart badge when cart is empty', () => {
        localStorage.setItem('userCart', JSON.stringify([]));

        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const badge = screen.queryByText('0');
        expect(badge).not.toBeInTheDocument();
    });

    it('updates cart count when localStorage changes', async () => {
        const { rerender } = render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        // Initially empty
        expect(screen.queryByText(/[0-9]+/)).not.toBeInTheDocument();

        // Add items to cart
        const cart = [
            { id: 1, nombre: 'Producto 1', cantidad: 2, precio: 1000, stock: 10 }
        ];
        localStorage.setItem('userCart', JSON.stringify(cart));

        // Trigger storage event
        window.dispatchEvent(new Event('storage'));

        await waitFor(() => {
            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    it('updates cart count on custom cartUpdated event', async () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const cart = [
            { id: 1, nombre: 'Producto 1', cantidad: 3, precio: 1000, stock: 10 }
        ];
        localStorage.setItem('userCart', JSON.stringify(cart));

        window.dispatchEvent(new Event('cartUpdated'));

        await waitFor(() => {
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    it('calls logout and navigates when logout button clicked', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const logoutButton = screen.getByText(/🚪 Salir/);
        fireEvent.click(logoutButton);

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('renders mobile navigation', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        // Mobile nav items (rendered but hidden on desktop)
        const mobileLinks = screen.getAllByText('Tienda');
        expect(mobileLinks.length).toBeGreaterThan(1); // Desktop + Mobile
    });

    it('renders Outlet for child routes', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByTestId('outlet')).toBeInTheDocument();
        expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('has correct links with href attributes', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const homeLinks = screen.getAllByRole('link', { name: /Tienda/ });
        homeLinks.forEach(link => {
            expect(link).toHaveAttribute('href', '/home');
        });

        const orderLinks = screen.getAllByRole('link', { name: /Pedidos/ });
        orderLinks.forEach(link => {
            expect(link).toHaveAttribute('href', '/orders');
        });
    });

    it('cart link points to /cart', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const cartLink = screen.getByRole('link', { name: /🛒/ });
        expect(cartLink).toHaveAttribute('href', '/cart');
    });

    it('profile link points to /profile', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const profileLinks = screen.getAllByRole('link', { name: /Usuario|Juan Pérez/ });
        const profileLink = profileLinks.find(link =>
            link.getAttribute('href') === '/profile'
        );
        expect(profileLink).toBeDefined();
    });

    it('logo links to /home', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const logoLink = screen.getByRole('link', { name: /🎮 GameZone/ });
        expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('applies sticky positioning to navbar', () => {
        const { container } = render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        const navbar = container.querySelector('nav');
        expect(navbar).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('handles empty cart in localStorage gracefully', () => {
        localStorage.removeItem('userCart');

        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        // Should not crash, badge should not appear
        expect(screen.queryByText(/[0-9]+/)).not.toBeInTheDocument();
    });

    it('handles invalid cart data in localStorage', () => {
        localStorage.setItem('userCart', 'invalid json');

        const { container } = render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        // Should not crash
        expect(container).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('cartUpdated', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });

    it('renders footer with copyright', () => {
        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('© 2024 GameZone. Todos los derechos reservados.')).toBeInTheDocument();
    });

    it('cart badge shows correct total for multiple items', () => {
        const cart = [
            { id: 1, nombre: 'Producto 1', cantidad: 1, precio: 1000, stock: 10 },
            { id: 2, nombre: 'Producto 2', cantidad: 4, precio: 2000, stock: 5 },
            { id: 3, nombre: 'Producto 3', cantidad: 2, precio: 3000, stock: 8 }
        ];
        localStorage.setItem('userCart', JSON.stringify(cart));

        render(
            <MemoryRouter>
                <UserLayout />
            </MemoryRouter>
        );

        expect(screen.getByText('7')).toBeInTheDocument(); // 1 + 4 + 2
    });
});