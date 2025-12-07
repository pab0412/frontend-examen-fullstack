import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router';
import { useAuth } from '~/context/AuthContext';

export default function UserLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cartItemsCount, setCartItemsCount] = React.useState(0);

    // Obtener cantidad de items del carrito desde localStorage
    React.useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('userCart') || '[]');
            const totalItems = cart.reduce((sum: number, item: any) => sum + item.cantidad, 0);
            setCartItemsCount(totalItems);
        };

        updateCartCount();
        // Actualizar cada vez que cambie el localStorage
        window.addEventListener('storage', updateCartCount);
        // Custom event para actualizar desde la misma pestaña
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navbar */}
            <nav className="bg-gray-800 shadow-md border-b border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/home" className="flex items-center space-x-3">
                            <div className="text-3xl">🎮</div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                                GameZone
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <Link
                                to="/home"
                                className="text-gray-300 hover:text-green-400 font-medium transition-colors"
                            >
                                🏠 Tienda
                            </Link>
                            <Link
                                to="/orders"
                                className="text-gray-300 hover:text-green-400 font-medium transition-colors"
                            >
                                📦 Mis Pedidos
                            </Link>
                        </div>

                        {/* Right side - Cart, Profile, Logout */}
                        <div className="flex items-center space-x-4">
                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-300 hover:text-green-400 transition-colors"
                            >
                                <span className="text-2xl">🛒</span>
                                {cartItemsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Menu */}
                            <div className="flex items-center space-x-3 border-l border-gray-700 pl-4">
                                <Link
                                    to="/profile"
                                    className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden md:block font-medium">
                                        {user?.name || 'Usuario'}
                                    </span>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    🚪 Salir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden border-t border-gray-700 px-4 py-3 flex justify-around">
                    <Link
                        to="/home"
                        className="flex flex-col items-center text-gray-300 hover:text-green-400"
                    >
                        <span className="text-xl">🏠</span>
                        <span className="text-xs mt-1">Tienda</span>
                    </Link>
                    <Link
                        to="/orders"
                        className="flex flex-col items-center text-gray-300 hover:text-green-400"
                    >
                        <span className="text-xl">📦</span>
                        <span className="text-xs mt-1">Pedidos</span>
                    </Link>
                    <Link
                        to="/profile"
                        className="flex flex-col items-center text-gray-300 hover:text-green-400"
                    >
                        <span className="text-xl">👤</span>
                        <span className="text-xs mt-1">Perfil</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="min-h-[calc(100vh-4rem)]">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-12">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
                    <p>© 2024 GameZone. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}