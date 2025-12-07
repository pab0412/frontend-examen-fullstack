import React, { useState, useEffect } from 'react';
import { ventasService } from '~/services/api/ventasService';
import { useAuth } from '~/context/AuthContext';
import type { Venta } from '~/services/types';

const UserOrders: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [selectedOrder, setSelectedOrder] = useState<Venta | null>(null);

    useEffect(() => {
        console.log('🔍 User completo:', user);
        console.log('🔍 User ID:', user?.id);
        console.log('🔍 Todas las propiedades de user:', Object.keys(user || {}));

        if (user && user.id) {
            loadOrders();
        } else if (user && !user.id) {
            setError('El usuario no tiene un ID válido. Por favor, cierra sesión e inicia sesión nuevamente.');
            setLoading(false);
        } else {
            setError('No has iniciado sesión. Por favor, inicia sesión para ver tus pedidos.');
            setLoading(false);
        }
    }, [user?.id]);

    const loadOrders = async () => {
        if (!user?.id) {
            setError('No se pudo obtener el ID del usuario');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');
            console.log('📞 Llamando a ventasService.getByUsuario con ID:', user.id);

            const userOrders = await ventasService.getByUsuario(user.id);
            console.log('✅ Pedidos recibidos:', userOrders);

            setOrders(userOrders);
        } catch (err: any) {
            console.error('❌ Error cargando pedidos:', err);
            console.error('❌ Detalles del error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al cargar los pedidos. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg font-medium">Verificando usuario...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg font-medium">Cargando pedidos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex items-start">
                            <span className="text-3xl mr-3">⚠️</span>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
                                <p className="text-red-300">{error}</p>
                                {user && user.id && (
                                    <button
                                        onClick={loadOrders}
                                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        🔄 Reintentar
                                    </button>
                                )}
                                {!user && (
                                    <a
                                        href="/login"
                                        className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        🔑 Ir a Iniciar Sesión
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-100 mb-2">📦 Mis Pedidos</h1>
                    {user && (
                        <p className="text-gray-400">
                            Bienvenido/a, <span className="font-semibold text-gray-300">{user.name || user.email || 'Usuario'}</span>
                        </p>
                    )}
                </div>

                {orders.length === 0 ? (
                    <div className="bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-700">
                        <div className="text-8xl text-gray-600 mb-6">📦</div>
                        <h2 className="text-3xl font-bold text-gray-100 mb-4">No tienes pedidos aún</h2>
                        <p className="text-gray-400 mb-8">¡Comienza a comprar para ver tus pedidos aquí!</p>
                        <a
                            href="/home"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                        >
                            🏠 Ir a la Tienda
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div
                                key={order.id}
                                className="bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-700 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-100 mb-1">
                                                Pedido #{order.id}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                {new Date(order.fecha).toLocaleDateString('es-CL', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-400">
                                                ${order.total.toLocaleString()}
                                            </p>
                                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                                order.estado === 'completada' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                                                    order.estado === 'pendiente' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                                                        'bg-red-900/30 text-red-400 border border-red-700'
                                            }`}>
                                            {order.estado === 'completada' ? '✅ Completado' :
                                                order.estado === 'pendiente' ? '⏳ Pendiente' :
                                                    '❌ Anulado'}
                                        </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Método de Pago</p>
                                                <p className="font-semibold text-gray-100">
                                                    {order.metodoPago === 'Efectivo' ? '💵 Efectivo' :
                                                        order.metodoPago === 'Tarjeta' ? '💳 Tarjeta' :
                                                            '📱 Transferencia'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Productos</p>
                                                <p className="font-semibold text-gray-100">
                                                    {order.detalleProductos.length} producto(s)
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                            className="text-green-400 hover:text-green-300 font-semibold text-sm transition-colors"
                                        >
                                            {selectedOrder?.id === order.id ? '▲ Ocultar detalles' : '▼ Ver detalles'}
                                        </button>

                                        {selectedOrder?.id === order.id && (
                                            <div className="mt-4 space-y-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                                {order.detalleProductos.map((producto, index) => (
                                                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-100">{producto.nombre}</p>
                                                            <p className="text-sm text-gray-400">
                                                                Cantidad: {producto.cantidad} x ${producto.precioUnitario.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <p className="font-bold text-gray-100">
                                                            ${producto.subtotal.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                                <div className="border-t border-gray-600 pt-3 mt-3">
                                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                                        <span>Subtotal:</span>
                                                        <span>${order.subtotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                        <span>IVA (19%):</span>
                                                        <span>${order.iva.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-lg font-bold text-gray-100">
                                                        <span>Total:</span>
                                                        <span className="text-green-400">${order.total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserOrders;