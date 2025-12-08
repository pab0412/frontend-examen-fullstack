// src/components/organisms/BoletaOrganism/BoletaOrganism.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoletaOrganism } from './BoletaOrganism';
import type { Boleta, CartItem } from '~/services/types';

// Mock subcomponents
vi.mock('../molecules/CartItem', () => ({
    CartItem: ({ id, nombre, precio, cantidad }: any) => (
        <div data-testid={`cart-item-${id}`}>
            <span>{nombre}</span>
            <span>${precio.toLocaleString('es-CL')}</span>
            <span>x{cantidad}</span>
        </div>
    )
}));

vi.mock('../atoms/BoletaHeaderAtom', () => ({
    BoletaHeaderAtom: ({ numero, fecha }: any) => (
        <div data-testid="boleta-header">
            <span>{numero}</span>
            <span>{fecha}</span>
        </div>
    )
}));

vi.mock('../molecules/BoletaTotalsMolecule', () => ({
    BoletaTotalsMolecule: ({ subtotal, iva, total }: any) => (
        <div data-testid="boleta-totals">
            <div>Subtotal: ${subtotal.toLocaleString('es-CL')}</div>
            <div>IVA: ${iva.toLocaleString('es-CL')}</div>
            <div>Total: ${total.toLocaleString('es-CL')}</div>
        </div>
    )
}));

const mockBoleta: Boleta = {
    id: 1,
    numero: 'BOL-000123',
    fechaEmision: '2025-11-30T10:30:00',
    cliente: 'Juan Pérez',
    rut: '12.345.678-9',
    montoTotal: 29225,
    ventaId: 1
};

const mockVenta = {
    id: 1,
    usuarioId: 1,
    fecha: '2025-11-30T10:30:00',
    subtotal: 25000,
    iva: 4225,
    total: 29225,
    metodoPago: 'Efectivo',
    estado: 'completada'
};

const mockCartItems: CartItem[] = [
    {
        id: 1,
        nombre: 'Producto A',
        precio: 12500,
        cantidad: 2,
        stock: 50
    },
    {
        id: 2,
        nombre: 'Producto B',
        precio: 5000,
        cantidad: 1,
        stock: 30
    }
];

describe('BoletaOrganism', () => {
    const mockOnClose = vi.fn();
    const mockOnPrint = vi.fn();

    beforeEach(() => {
        mockOnClose.mockClear();
        mockOnPrint.mockClear();
    });

    it('renders boleta with all main sections', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('Boleta Electrónica')).toBeInTheDocument();
        expect(screen.getByTestId('boleta-header')).toBeInTheDocument();
        expect(screen.getByTestId('boleta-totals')).toBeInTheDocument();
    });

    it('displays client information correctly', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText(/RUT: 12\.345\.678-9/)).toBeInTheDocument();
    });

    it('displays "CONSUMIDOR FINAL" when no client name', () => {
        const boletaSinCliente = { ...mockBoleta, cliente: '' };

        render(
            <BoletaOrganism
                boleta={boletaSinCliente}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('CONSUMIDOR FINAL')).toBeInTheDocument();
    });

    it('does not display RUT when not provided', () => {
        const boletaSinRut = { ...mockBoleta, rut: undefined };

        render(
            <BoletaOrganism
                boleta={boletaSinRut}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.queryByText(/RUT:/)).not.toBeInTheDocument();
    });

    it('displays payment method and cashier', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Tarjeta de Crédito"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText(/Método:/)).toBeInTheDocument();
        expect(screen.getByText(/Tarjeta de Crédito/)).toBeInTheDocument();
        expect(screen.getByText(/Cajero:/)).toBeInTheDocument();
        expect(screen.getByText(/Ana Gómez/)).toBeInTheDocument();
    });

    it('renders all cart items', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('cart-item-2')).toBeInTheDocument();
        expect(screen.getByText('Producto A')).toBeInTheDocument();
        expect(screen.getByText('Producto B')).toBeInTheDocument();
    });

    it('displays product details section header', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('DETALLE DE PRODUCTOS')).toBeInTheDocument();
    });

    it('renders totals with correct values', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        const totalsSection = screen.getByTestId('boleta-totals');
        expect(totalsSection).toHaveTextContent('Subtotal: $25.000');
        expect(totalsSection).toHaveTextContent('IVA: $4.225');
        expect(totalsSection).toHaveTextContent('Total: $29.225');
    });

    it('displays thank you message', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('¡GRACIAS POR TU COMPRA!')).toBeInTheDocument();
    });

    it('displays boleta number in footer', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText(/BOLETA ELECTRÓNICA BOL-000123/)).toBeInTheDocument();
        expect(screen.getByText(/SII CERTIFICADO/)).toBeInTheDocument();
    });

    it('calls onPrint when print button clicked', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        fireEvent.click(screen.getByText(/🖨️ Imprimir/));
        expect(mockOnPrint).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        fireEvent.click(screen.getByText('Cerrar'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders with empty cart items array', () => {
        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={[]}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        expect(screen.getByText('DETALLE DE PRODUCTOS')).toBeInTheDocument();
        expect(screen.queryByTestId(/cart-item-/)).not.toBeInTheDocument();
    });

    it('handles missing venta totals gracefully', () => {
        const ventaSinTotales = {
            ...mockVenta,
            subtotal: undefined,
            iva: undefined,
            total: undefined
        };

        render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={ventaSinTotales}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        const totalsSection = screen.getByTestId('boleta-totals');
        expect(totalsSection).toHaveTextContent('Subtotal: $0');
        expect(totalsSection).toHaveTextContent('IVA: $0');
        expect(totalsSection).toHaveTextContent('Total: $0');
    });

    it('applies correct styling classes for modal overlay', () => {
        const { container } = render(
            <BoletaOrganism
                boleta={mockBoleta}
                venta={mockVenta}
                cartItems={mockCartItems}
                metodoPago="Efectivo"
                cajero="Ana Gómez"
                onClose={mockOnClose}
                onPrint={mockOnPrint}
            />
        );

        const overlay = container.querySelector('.fixed.inset-0');
        expect(overlay).toHaveClass('bg-black/80', 'backdrop-blur-sm', 'z-[9999]');
    });
});