// Auth Types (no Users)
export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    email: string;
    name: string;
    rol: 'admin' | 'cashier' | 'user';
}

export interface UserProfile {
    id: number;
    sub: string;
    email: string;
    name: string;
    rol: 'admin' | 'cashier' | 'user';
    iat: number;
    exp: number;
}

// User Types (para gestión de usuarios desde /auth)
export interface User {
    id: number;
    name: string;
    email: string;
    rol: 'admin' | 'cashier' | 'user';
    ventas?: Venta[];
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    rol?: 'admin' | 'cashier' | 'user';
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    rol?: 'admin' | 'cashier' | 'user';
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    rol: string;
}

// Producto Types
export interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    categoria?: string;
    imagen?: string;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductoDto {
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    categoria?: string;
    imagen?: string;
}

export interface UpdateProductoDto {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    stock?: number;
    categoria?: string;
    imagen?: string;
    activo?: boolean;
}

// Venta Types
export interface DetalleProducto {
    productoId: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface Venta {
    id: number;
    usuarioId: number;
    fecha: string;
    subtotal: number;
    iva: number;
    total: number;
    metodoPago: string; // 'efectivo', 'tarjeta_debito', 'tarjeta_credito'
    estado: string; // 'completada', 'anulada', 'pendiente'
    detalleProductos: DetalleProducto[];
    usuario?: {
        id: number;
        name: string;
        email: string;
        rol: string;
    };
    boleta?: Boleta;
}

export interface CreateVentaDto {
    usuarioId: number;
    metodoPago: string;
    detalleProductos: {
        productoId: number;
        cantidad: number;
    }[];
    cliente?: string;
    rut?: string;
}

export interface UpdateVentaDto {
    estado?: 'completada' | 'anulada' | 'pendiente';
}

// Boleta Types
export interface Boleta {
    id: number;
    numero: string; // BOL-000001
    fechaEmision: string;
    cliente: string;
    rut?: string;
    montoTotal: number;
    ventaId: number;
    venta?: Venta;
}

export interface CreateBoletaDto {
    ventaId: number;
    cliente?: string;
    rut?: string;
}

export interface UpdateBoletaDto {
    ventaId?: number;
    cliente?: string;
    rut?: string;
}

// Dashboard Stats
export interface DashboardStats {
    totalVentas: number;
    ventasHoy: number;
    productosVendidos: number;
    ingresoTotal: string;
}

// Cart Types
export interface CartItem {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    stock: number;
}

export interface BoletaOrganismProps {
    boleta: Boleta;
    venta: {
        subtotal: number;
        iva: number;
        total: number;
    };
    cartItems: CartItem[];
    metodoPago: string;
    cajero: string;
    onPrint: () => void;
    onClose: () => void;
}