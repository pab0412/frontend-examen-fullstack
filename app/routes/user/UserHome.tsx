import React, { useState, useEffect } from 'react';
import { productosService } from '~/services/api/productosService';
import { AlertMessage } from '~/components/molecules/AlertMessage';
import type { Producto } from '~/services/types';

const UserHome: React.FC = () => {
    const [products, setProducts] = useState<Producto[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
            setProducts(data.filter(p => p.activo !== false && p.stock > 0));
        } catch (error) {
            console.error('Error cargando productos:', error);
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

    const addToCart = (product: Producto) => {
        const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
        const existingItem = cart.find((item: any) => item.id === product.id);

        if (existingItem) {
            if (existingItem.cantidad >= product.stock) {
                setSuccessMessage(`No hay más stock disponible de ${product.nombre}`);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                return;
            }
            existingItem.cantidad += 1;
        } else {
            cart.push({
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                cantidad: 1,
                stock: product.stock,
                imagen: product.imagen,
            });
        }

        localStorage.setItem('userCart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        setSuccessMessage(`${product.nombre} agregado al carrito`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Cargando productos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-green-600 to-cyan-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
                    <h1 className="text-4xl font-bold mb-2">¡Bienvenido a GameZone! 🎮</h1>
                    <p className="text-xl opacity-90">Los mejores juegos gaming al mejor precio</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="🔍 Buscar juegos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-green-500 group"
                        >
                            {/* Product Image */}
                            <div className="relative aspect-square bg-gray-900 overflow-hidden">
                                <img
                                    src={product.imagen || `https://picsum.photos/400/400?random=${product.id}`}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {product.stock < 10 && (
                                    <div
                                        className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        ¡Últimas unidades!
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-100 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {product.nombre}
                                </h3>

                                {product.descripcion && (
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                        {product.descripcion}
                                    </p>
                                )}

                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-2xl font-bold text-green-400">
                                            ${product.precio.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Stock disponible</p>
                                        <p className={`text-sm font-semibold ${
                                            product.stock > 10 ? 'text-green-400' :
                                                product.stock > 0 ? 'text-orange-400' : 'text-red-400'
                                        }`}>
                                            {product.stock} unidades
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    🛒 Agregar al Carrito
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserHome;