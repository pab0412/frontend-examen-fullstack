// src/components/organisms/SalesTable/SalesTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesTable } from './SalesTable';
import type { Venta } from '~/services/types';

// Mock subcomponents
vi.mock('~/components/atoms/Badge', () => ({
    Badge: ({ children, variant }: any) => (
        <span data-testid={`badge-${variant}`} data-children={children}>
      {children}
    </span>
    )
}));

vi.mock('~/components/atoms/Spinner', () => ({
    Spinner: () => <div data-testid="spinner" />
}));

const mockSales: Venta[] = [
    {
        id: 1,
        usuarioId: 1,
        fecha: '2025-11-30T10:30:00',
        subtotal: 25000,
        iva: 4225,
        total: 29225,
        metodoPago: 'Efectivo',
        estado: 'completada',
        detalleProductos: [
            {
                productoId: 1,
                nombre: 'Producto A',
                cantidad: 2,
                precioUnitario: 12500,
                subtotal: 25000
            }
        ],
        usuario: {
            id: 1,
            name: 'Ana Gómez',
            email: 'ana@example.com',
            rol: 'cashier'
        }
    },
    {
        id: 2,
        usuarioId: 2,
        fecha: '2025-11-30T14:15:00',
        subtotal: 75000,
        iva: 14990,
        total: 89990,
        metodoPago: 'Tarjeta',
        estado: 'pendiente',
        detalleProductos: [
            {
                productoId: 2,
                nombre: 'Producto B',
                cantidad: 1,
                precioUnitario: 75000,
                subtotal: 75000
            }
        ],
        usuario: {
            id: 2,
            name: 'Carlos López',
            email: 'carlos@example.com',
            rol: 'cashier'
        }
    }
];

describe('SalesTable', () => {
    const mockOnViewDetails = vi.fn();

    beforeEach(() => {
        mockOnViewDetails.mockClear();
    });

    it('renders loading spinner when isLoading=true', () => {
        render(<SalesTable sales={[]} isLoading />);
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('renders empty state when no sales', () => {
        render(<SalesTable sales={[]} />);
        expect(screen.getByText('No hay ventas registradas')).toBeInTheDocument();
    });

    it('renders table with correct headers', () => {
        render(<SalesTable sales={mockSales} onViewDetails={mockOnViewDetails} />);

        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Fecha')).toBeInTheDocument();
        expect(screen.getByText('Cajero')).toBeInTheDocument();
        expect(screen.getByText('Método Pago')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('renders sales data correctly', () => {
        render(<SalesTable sales={mockSales} onViewDetails={mockOnViewDetails} />);

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('30-11-2025')).toBeInTheDocument();
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        expect(screen.getByText('Efectivo')).toBeInTheDocument();
        expect(screen.getByText('$29.225')).toBeInTheDocument();
        expect(screen.getByTestId('badge-success')).toHaveAttribute('data-children', 'completada');
    });

    it('shows "Sin cajero" when no usuario', () => {
        const salesSinCajero: Venta[] = [
            {
                ...mockSales[0],
                usuario: undefined
            }
        ];
        render(<SalesTable sales={salesSinCajero} onViewDetails={mockOnViewDetails} />);
        expect(screen.getByText('Sin cajero')).toBeInTheDocument();
    });

    it('calls onViewDetails when details button clicked', () => {
        render(<SalesTable sales={mockSales} onViewDetails={mockOnViewDetails} />);
        fireEvent.click(screen.getAllByText('Ver detalles')[0]);
        expect(mockOnViewDetails).toHaveBeenCalledWith(1);
    });

    it('does NOT show actions column when onViewDetails not provided', () => {
        render(<SalesTable sales={mockSales} />);
        expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
        expect(screen.queryByText('Ver detalles')).not.toBeInTheDocument();
    });

    it('applies responsive table classes', () => {
        const { container } = render(<SalesTable sales={mockSales} />);
        const tableContainer = container.querySelector('div');
        expect(tableContainer).toHaveClass('overflow-x-auto', 'bg-white', 'rounded-lg', 'shadow');
    });

    it('renders multiple sales correctly', () => {
        render(<SalesTable sales={mockSales} onViewDetails={mockOnViewDetails} />);
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
        expect(screen.getByText('Carlos López')).toBeInTheDocument();
    });

    it('renders correct badge variants based on estado', () => {
        render(<SalesTable sales={mockSales} onViewDetails={mockOnViewDetails} />);
        expect(screen.getByTestId('badge-success')).toBeInTheDocument();
        expect(screen.getByTestId('badge-warning')).toBeInTheDocument();
    });

    it('formats currency correctly', () => {
        render(<SalesTable sales={mockSales} />);
        expect(screen.getByText('$29.225')).toBeInTheDocument();
        expect(screen.getByText('$89.990')).toBeInTheDocument();
    });
});