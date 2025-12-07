import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ventasService } from '~/services/api/ventasService';
import { useAuth } from '~/context/AuthContext';
import { AlertMessage } from '~/components/molecules/AlertMessage';
import { BoletaOrganism } from '~/components/organisms/BoletaOrganism';

interface CartItem {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    stock: number;
    imagen?: string;
}

const CartPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Tarjeta');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showBoletaModal, setShowBoletaModal] = useState(false);
    const [boletaData, setBoletaData] = useState<any>(null);

    useEffect(() => {
        console.log('🎭 showBoletaModal cambió a:', showBoletaModal);
        console.log('📦 boletaData:', boletaData);
    }, [showBoletaModal, boletaData]);

    useEffect(() => {
        loadCart();
        const handleCartUpdate = () => loadCart();
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        setCartItems(cart);
    };

    const updateQuantity = (id: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(id);
            return;
        }

        const item = cartItems.find(i => i.id === id);
        if (item && newQuantity > item.stock) {
            setErrorMessage(`Solo hay ${item.stock} unidades disponibles`);
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        const updatedCart = cartItems.map(item =>
            item.id === id ? { ...item, cantidad: newQuantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('userCart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const removeItem = (id: number) => {
        const updatedCart = cartItems.filter(item => item.id !== id);
        setCartItems(updatedCart);
        localStorage.setItem('userCart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('userCart');
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        if (!user || !user.id) {
            setErrorMessage('Debes iniciar sesión para realizar una compra');
            setShowError(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return;
        }

        console.log('🛒 Procesando compra para usuario:', user.id);
        console.log('👤 Usuario completo:', user);

        setIsProcessing(true);

        try {
            const ventaData = {
                usuarioId: user.id,
                metodoPago,
                detalleProductos: cartItems.map(item => ({
                    productoId: item.id,
                    cantidad: item.cantidad,
                })),
            };

            console.log('📦 Datos de la venta a enviar:', ventaData);

            const resultado = await ventasService.create(ventaData);
            console.log('✅ RESPUESTA COMPLETA DEL SERVIDOR:', resultado);

            const cartCopy = [...cartItems];

            const boletaInfo = resultado.boleta || resultado;
            const ventaInfo = resultado.venta || resultado;

            const dataParaBoleta = {
                boleta: {
                    numero: boletaInfo.numero || boletaInfo.id || Math.floor(Math.random() * 10000),
                    cliente: user?.name || 'Cliente',
                    rut: user?.rut || null,
                    fecha: boletaInfo.fecha || new Date().toISOString(),
                },
                venta: {
                    subtotal: ventaInfo.subtotal || subtotal,
                    iva: ventaInfo.iva || iva,
                    total: ventaInfo.total || total,
                },
                cartItems: cartCopy,
                metodoPago,
                cajero: 'Sistema Web'
            };

            console.log('📋 Datos preparados para la boleta:', dataParaBoleta);

            setBoletaData(dataParaBoleta);
            setShowPaymentModal(false);

            setTimeout(() => {
                console.log('🎭 Intentando mostrar boleta...');
                setShowBoletaModal(true);
            }, 100);

        } catch (error: any) {
            console.error('❌ Error procesando compra:', error);
            console.error('❌ Detalles:', error.response?.data);
            setErrorMessage(error.response?.data?.message || 'Error al procesar la compra');
            setShowError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCloseBoleta = () => {
        console.log('🚪 Cerrando boleta y limpiando carrito...');
        setShowBoletaModal(false);
        setBoletaData(null);
        clearCart();
        navigate('/orders');
    };

    if (cartItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-700">
                    <div className="text-8xl text-gray-600 mb-6">🛒</div>
                    <h2 className="text-3xl font-bold text-gray-100 mb-4">Tu carrito está vacío</h2>
                    <p className="text-gray-400 mb-8">¡Agrega productos para comenzar a comprar!</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                    >
                        🏠 Ir a la Tienda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-100 mb-8">🛒 Mi Carrito</h1>

            {showError && (
                <div className="mb-6">
                    <AlertMessage
                        type="error"
                        message={errorMessage}
                        onClose={() => setShowError(false)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-700 hover:shadow-md hover:border-green-500 transition-all">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={item.imagen || `https://picsum.photos/200/200?random=${item.id}`}
                                        alt={item.nombre}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = `https://picsum.photos/200/200?random=${item.id}`;
                                        }}
                                    />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-100 text-lg mb-2">{item.nombre}</h3>
                                    <p className="text-green-400 font-bold text-xl mb-3">
                                        ${item.precio.toLocaleString()}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg flex items-center justify-center font-bold"
                                            >
                                                −
                                            </button>
                                            <span className="w-12 text-center font-semibold text-lg text-gray-100">
                                                {item.cantidad}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg flex items-center justify-center font-bold"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-gray-400 text-sm mb-1">Subtotal</p>
                                            <p className="font-bold text-gray-100 text-lg">
                                                ${(item.precio * item.cantidad).toLocaleString()}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <span className="text-2xl">🗑️</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={clearCart}
                        className="w-full py-3 bg-gray-700 text-gray-100 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                        🗑️ Vaciar Carrito
                    </button>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24 border border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-100 mb-6">Resumen</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal:</span>
                                <span className="font-semibold">${subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>IVA (19%):</span>
                                <span className="font-semibold">${iva.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-700 pt-3">
                                <div className="flex justify-between text-2xl font-bold text-gray-100">
                                    <span>Total:</span>
                                    <span className="text-green-400">${total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                        >
                            💳 Procesar Pago
                        </button>

                        <button
                            onClick={() => navigate('/home')}
                            className="w-full mt-3 py-3 bg-gray-700 text-gray-100 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                        >
                            ← Seguir Comprando
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold mb-6 text-gray-100">Método de Pago</h2>

                        <div className="space-y-4 mb-6">
                            <label className="block">
                                <span className="text-sm font-semibold text-gray-300 mb-2 block">Selecciona un método</span>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Transferencia">📱 Transferencia</option>
                                </select>
                            </label>

                            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                                <p className="text-center text-sm text-gray-400 mb-2">Total a Pagar</p>
                                <p className="text-center text-3xl font-bold text-green-400">
                                    ${total.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
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

            {/* Boleta Modal */}
            {showBoletaModal && boletaData && (
                <BoletaOrganism
                    boleta={boletaData.boleta}
                    venta={boletaData.venta}
                    cartItems={boletaData.cartItems}
                    metodoPago={boletaData.metodoPago}
                    cajero={boletaData.cajero}
                    onPrint={() => window.print()}
                    onClose={handleCloseBoleta}
                />
            )}
        </div>
    );
};

export default CartPage;