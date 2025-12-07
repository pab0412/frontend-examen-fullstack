import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '~/components/atoms/Button';
import { SearchBar } from '~/components/molecules/SearchBar';
import { Badge } from '~/components/atoms/Badge';
import DeleteModal from '~/components/molecules/DeleteModal';
import { productosService } from '~/services/api/productosService';
import type { Producto } from '~/services/types';

const Products: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Producto | null }>({
        isOpen: false,
        product: null
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await productosService.getAll();
            setProducts(data);
            console.log('✅ Productos cargados:', data.length);
        } catch (err: any) {
            console.error('❌ Error cargando productos:', err);
            setError('Error al cargar los productos');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        navigate('/admin/products/new');
    };

    const handleEdit = (productId: number) => {
        navigate(`/admin/products/edit/${productId}`);
    };

    const handleDeleteClick = (product: Producto) => {
        setDeleteModal({ isOpen: true, product });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.product) return;

        try {
            await productosService.delete(deleteModal.product.id);
            setProducts(prev => prev.filter(p => p.id !== deleteModal.product!.id));
            console.log('✅ Producto eliminado:', deleteModal.product.id);
            setDeleteModal({ isOpen: false, product: null });
            alert('Producto eliminado exitosamente');

        } catch (err: any) {
            console.error('❌ Error eliminando producto:', err);
            alert('Error al eliminar el producto');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, product: null });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Cargando productos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded backdrop-blur-sm">
                {error}
                <button
                    onClick={loadProducts}
                    className="ml-4 underline hover:no-underline"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-100">Gestión de Productos</h1>
                <Button variant="primary" onClick={handleCreate}>
                    + Nuevo Producto
                </Button>
            </div>

            <div className="mb-6">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar productos por nombre o categoría..."
                />
            </div>

            <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                            Acciones
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-100">
                                        {product.nombre}
                                    </div>
                                    {product.descripcion && (
                                        <div className="text-xs text-gray-400 truncate max-w-xs">
                                            {product.descripcion}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {product.categoria}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                                    ${product.precio.toLocaleString('es-CL')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                                    <span className={product.stock < 5 ? 'text-red-400 font-semibold' : ''}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={product.activo ? 'success' : 'danger'}>
                                        {product.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleEdit(product.id)}
                                        className="text-blue-400 hover:text-blue-300 mr-3 font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(product)}
                                        className="text-red-400 hover:text-red-300 font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                {searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos registrados'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {products.length > 0 && (
                <div className="mt-4 text-sm text-gray-400">
                    Mostrando {filteredProducts.length} de {products.length} productos
                </div>
            )}

            <DeleteModal
                isOpen={deleteModal.isOpen}
                productName={deleteModal.product?.nombre || ''}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
};

export default Products;