import type { Route } from "./+types/home";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Game Zone - Tienda Gamer" },
        { name: "description", content: "Venta de articulos gamers" },
    ];
}

export default function Home() {
    return <Navigate to="/login" replace />;
}