// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminProductNewPage from "./pages/AdminProductNewPage";
import AdminProductEditPage from "./pages/AdminProductEditPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminBannersPage from "./pages/AdminBannersPage";
export default function App() {
    return (React.createElement(Routes, null,
        React.createElement(Route, { path: "/", element: React.createElement(HomePage, null) }),
        React.createElement(Route, { path: "/category/:categoryName", element: React.createElement(CategoryPage, null) }),
        React.createElement(Route, { path: "/product/:id", element: React.createElement(ProductPage, null) }),
        React.createElement(Route, { path: "/login", element: React.createElement(LoginPage, null) }),
        React.createElement(Route, { path: "/admin-dashboard", element: React.createElement(AdminRoute, null,
                React.createElement(AdminDashboard, null)) }),
        React.createElement(Route, { path: "/admin/products", element: React.createElement(AdminRoute, null,
                React.createElement(AdminProductsPage, null)) }),
        React.createElement(Route, { path: "/admin/products/new", element: React.createElement(AdminRoute, null,
                React.createElement(AdminProductNewPage, null)) }),
        React.createElement(Route, { path: "/admin/products/:id", element: React.createElement(AdminRoute, null,
                React.createElement(AdminProductEditPage, null)) }),
        React.createElement(Route, { path: "/admin/categories", element: React.createElement(AdminRoute, null,
                React.createElement(AdminCategoriesPage, null)) }),
        React.createElement(Route, { path: "/admin/banners", element: React.createElement(AdminRoute, null,
                React.createElement(AdminBannersPage, null)) })));
}
