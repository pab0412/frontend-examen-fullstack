import React, { useState, useEffect } from 'react';
import { AlertMessage } from '~/components/molecules/AlertMessage';
import { BoletaOrganism } from '~/components/organisms/BoletaOrganism';
import { productosService } from '~/services/api/productosService';
import { ventasService } from '~/services/api/ventasService';
import { useAuth } from '~/context/AuthContext';

interface CartItem {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    stock: number;
}

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    stock: number;
    activo?: boolean;
    imagen?: string;
    categoria?: string;
}

const CashierHome: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Producto[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showBoletaModal, setShowBoletaModal] = useState(false);
    const [boletaData, setBoletaData] = useState<any>(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
    const [cliente, setCliente] = useState('');
    const [rut, setRut] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, selectedCategory, products]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productosService.getAll();
            setProducts(data.filter(p => p.activo !== false));
        } catch (error) {
            console.error('Error cargando productos:', error);
            setErrorMessage('Error al cargar productos');
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;

        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(p => p.categoria === selectedCategory);
        }

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    const categories = ['Todos', ...new Set(products.map(p => p.categoria).filter(Boolean))];

    const handleAddToCart = (productId: number, cantidad: number = 1) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cartItems.find(item => item.id === productId);
        const currentQuantity = existingItem ? existingItem.cantidad : 0;

        if (currentQuantity + cantidad > product.stock) {
            setErrorMessage(`Stock insuficiente. Solo hay ${product.stock} disponibles.`);
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item.id === productId
                    ? { ...item, cantidad: item.cantidad + cantidad }
                    : item
            ));
        } else {
            setCartItems([...cartItems, {
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                cantidad,
                stock: product.stock,
            }]);
        }
    };

    const handleUpdateQuantity = (id: number, cantidad: number) => {
        if (cantidad <= 0) {
            handleRemoveItem(id);
            return;
        }

        const item = cartItems.find(i => i.id === id);
        if (item && cantidad > item.stock) {
            setErrorMessage(`Stock insuficiente. Solo hay ${item.stock} unidades disponibles.`);
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        setCartItems(cartItems.map(item =>
            item.id === id ? { ...item, cantidad } : item
        ));
    };

    const handleRemoveItem = (id: number) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const handleOpenPaymentModal = () => {
        if (cartItems.length === 0) {
            setErrorMessage('El carrito está vacío');
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }
        setShowPaymentModal(true);
    };

    const handleCheckout = async () => {
        let usuarioIdFinal: number;
        if (user?.id && Number(user.id) > 0 && !isNaN(Number(user.id))) {
            usuarioIdFinal = Number(user.id);
        } else {
            usuarioIdFinal = 2;
        }

        setIsProcessing(true);

        try {
            const ventaData = {
                usuarioId: usuarioIdFinal,
                metodoPago,
                detalleProductos: cartItems.map(item => ({
                    productoId: item.id,
                    cantidad: item.cantidad,
                })),
                ...(cliente && { cliente }),
                ...(rut && { rut }),
            };

            const resultado = await ventasService.create(ventaData);
            const cartCopy = [...cartItems];

            setBoletaData({
                resultado,
                cartItems: cartCopy,
                cliente: cliente || 'CONSUMIDOR FINAL',
                metodoPago,
                cajero: user?.name || 'Cajero GameZone'
            });
            setShowBoletaModal(true);

            setCartItems([]);
            setCliente('');
            setRut('');
            setMetodoPago('Efectivo');
            setShowPaymentModal(false);
            setShowSuccess(true);
            await loadProducts();
            setTimeout(() => setShowSuccess(false), 3000);

        } catch (error: any) {
            console.error('Error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || 'Error procesando venta');
            setShowError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg font-medium">Cargando sistema...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900">
            {/* PANEL IZQUIERDO - Productos */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-100">Punto de Venta</h1>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-400">Cajero:</span>
                            <span className="font-semibold text-gray-100">{user?.name || 'Usuario'}</span>
                        </div>
                    </div>

                    {/* Búsqueda y Filtros */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="🔍 Buscar producto por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2.5 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Alertas */}
                {(showSuccess || showError) && (
                    <div className="px-6 pt-4">
                        {showSuccess && (
                            <AlertMessage
                                type="success"
                                message="¡Venta realizada exitosamente!"
                                onClose={() => setShowSuccess(false)}
                            />
                        )}
                        {showError && (
                            <AlertMessage
                                type="error"
                                message={errorMessage}
                                onClose={() => setShowError(false)}
                            />
                        )}
                    </div>
                )}

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
                    {filteredProducts.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-6xl text-gray-600 mb-4">📦</div>
                                <p className="text-gray-400 text-lg">No se encontraron productos</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => handleAddToCart(product.id, 1)}
                                    disabled={product.stock === 0}
                                    className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:shadow-lg hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                                >
                                    <div className="aspect-square bg-gray-900 rounded-lg mb-3 overflow-hidden">
                                        <img
                                            src={product.imagen || `https://picsum.photos/200/200?random=${product.id}`}
                                            alt={product.nombre}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://picsum.photos/200/200?random=${product.id}`;
                                            }}
                                        />
                                    </div>
                                    <h3 className="font-semibold text-gray-100 text-sm mb-2 line-clamp-2 min-h-[40px]">
                                        {product.nombre}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-green-400">
                                            ${product.precio.toLocaleString()}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            product.stock > 10 ? 'bg-green-900/30 text-green-400 border border-green-700' :
                                                product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                                                    'bg-red-900/30 text-red-400 border border-red-700'
                                        }`}>
                                            {product.stock}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* PANEL DERECHO - Carrito */}
            <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col shadow-lg">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                    <h2 className="text-xl font-bold">Carrito de Compra</h2>
                    <p className="text-green-100 text-sm">{cartItems.length} producto(s)</p>
                </div>

                {/* Items del carrito */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {cartItems.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center">
                            <div>
                                <div className="text-5xl text-gray-600 mb-3">🛒</div>
                                <p className="text-gray-400">Carrito vacío</p>
                                <p className="text-gray-500 text-sm">Selecciona productos para comenzar</p>
                            </div>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-100 text-sm flex-1">{item.nombre}</h3>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-red-400 hover:text-red-300 ml-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded flex items-center justify-center font-bold"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-semibold text-gray-100">{item.cantidad}</span>
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                            className="w-7 h-7 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded flex items-center justify-center font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">${item.precio.toLocaleString()} c/u</div>
                                        <div className="font-bold text-gray-100">${(item.precio * item.cantidad).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totales */}
                <div className="border-t border-gray-700 p-4 space-y-2 bg-gray-900/50">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="font-semibold text-gray-100">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">IVA (19%):</span>
                        <span className="font-semibold text-gray-100">${iva.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold border-t border-gray-700 pt-2">
                        <span className="text-gray-100">TOTAL:</span>
                        <span className="text-green-400">${total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="p-4 space-y-2 border-t border-gray-700">
                    <button
                        onClick={handleOpenPaymentModal}
                        disabled={cartItems.length === 0 || isProcessing}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                    >
                        💳 Procesar Pago
                    </button>
                    <button
                        onClick={() => setCartItems([])}
                        disabled={cartItems.length === 0}
                        className="w-full bg-gray-700 text-gray-100 py-3 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        🗑️ Limpiar Carrito
                    </button>
                </div>
            </div>

            {/* Modal Boleta */}
            {showBoletaModal && boletaData && (
                <BoletaOrganism
                    boleta={boletaData.resultado?.boleta || boletaData.resultado || boletaData}
                    venta={boletaData.resultado?.venta || boletaData.resultado || { subtotal: 0, iva: 0, total: 0 }}
                    cartItems={boletaData.cartItems || []}
                    metodoPago={boletaData.metodoPago || metodoPago}
                    cajero={boletaData.cajero || user?.name || 'Cajero GameZone'}
                    onPrint={() => window.print()}
                    onClose={() => {
                        setShowBoletaModal(false);
                        setBoletaData(null);
                    }}
                />
            )}

            {/* Modal Pago */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold mb-6 text-gray-100">Método de Pago</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Método de Pago *</label>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Transferencia">📱 Transferencia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre Cliente</label>
                                <input
                                    type="text"
                                    value={cliente}
                                    onChange={(e) => setCliente(e.target.value)}
                                    placeholder="Consumidor Final"
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">RUT</label>
                                <input
                                    type="text"
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                    placeholder="12.345.678-9"
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                                />
                            </div>

                            {/* Preview del total */}
                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mt-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mb-1">Total a Pagar</p>
                                    <p className="text-3xl font-bold text-green-400">${total.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg transition-all"
                            >
                                {isProcessing ? '⏳ Procesando...' : '✅ Confirmar'}
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                disabled={isProcessing}
                                className="flex-1 bg-gray-700 text-gray-100 py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 disabled:cursor-not-allowed transition-all"
                            >
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierHome;