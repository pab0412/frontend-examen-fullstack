import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/Dashboard";
import { DashboardStats } from '~/components/organisms/DashboardStats';
import { SalesTable } from '~/components/organisms/SalesTable';
import { Button } from '~/components/atoms/Button';
import { dashboardService, ventasService } from '~/services/api';
import type { DashboardStats as DashboardStatsType, Venta } from '~/services/types';

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Dashboard - Admin GameZone" },
    ];
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStatsType>({
        totalVentas: 0,
        ventasHoy: 0,
        productosVendidos: 0,
        ingresoTotal: "$0",
    });
    const [recentSales, setRecentSales] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            const statsData = await dashboardService.getStats();
            setStats(statsData);

            const allSales = await ventasService.getAll();
            const recent = allSales
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .slice(0, 10);
            setRecentSales(recent);

        } catch (err: any) {
            console.error('Error cargando dashboard:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded backdrop-blur-sm">
                {error}
                <button
                    onClick={loadDashboardData}
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
                <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
                <div className="flex gap-3">
                    <Link to="/admin/products">
                        <Button variant="primary">📦 Productos</Button>
                    </Link>
                    <Link to="/admin/sales">
                        <Button variant="secondary">💰 Ventas</Button>
                    </Link>
                    <Link to="/admin/users">
                        <Button variant="secondary">👥 Usuarios</Button>
                    </Link>
                </div>
            </div>

            <DashboardStats
                totalVentas={stats.totalVentas}
                ventasHoy={stats.ventasHoy}
                productosVendidos={stats.productosVendidos}
                ingresoTotal={stats.ingresoTotal}
            />

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-100">Ventas Recientes</h2>
                    <Link to="/admin/sales">
                        <Button variant="secondary" size="sm">
                            Ver todas las ventas →
                        </Button>
                    </Link>
                </div>

                {recentSales.length > 0 ? (
                    <SalesTable sales={recentSales} />
                ) : (
                    <div className="bg-gray-800 p-8 rounded-lg shadow border border-gray-700 text-center">
                        <p className="text-gray-400">No hay ventas registradas aún</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Link to="/admin/products" className="block">
                    <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-gray-700 hover:border-green-500">
                        <div className="text-4xl mb-3">📦</div>
                        <h3 className="text-xl font-bold text-gray-100 mb-2">Gestionar Productos</h3>
                        <p className="text-gray-400">Administra el inventario de productos</p>
                    </div>
                </Link>

                <Link to="/admin/sales" className="block">
                    <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-gray-700 hover:border-green-500">
                        <div className="text-4xl mb-3">💰</div>
                        <h3 className="text-xl font-bold text-gray-100 mb-2">Ver Ventas</h3>
                        <p className="text-gray-400">Revisa el historial de ventas</p>
                    </div>
                </Link>

                <Link to="/admin/users" className="block">
                    <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-gray-700 hover:border-cyan-500">
                        <div className="text-4xl mb-3">👥</div>
                        <h3 className="text-xl font-bold text-gray-100 mb-2">Gestionar Usuarios</h3>
                        <p className="text-gray-400">Administra cajeros y roles</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}