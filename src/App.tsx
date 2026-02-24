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

// ✅ NEW: Categories page
import AdminCategoriesPage from "./pages/AdminCategoriesPage";

// ✅ NEW: Banners page
import AdminBannersPage from "./pages/AdminBannersPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/category/:categoryName" element={<CategoryPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin */}
      <Route
        path="/admin-dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminProductsPage />
          </AdminRoute>
        }
      />

      {/* ✅ NEW PRODUCT */}
      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AdminProductNewPage />
          </AdminRoute>
        }
      />

      {/* ✅ EDIT PRODUCT */}
      <Route
        path="/admin/products/:id"
        element={
          <AdminRoute>
            <AdminProductEditPage />
          </AdminRoute>
        }
      />

      {/* ✅ NEW: MANAGE CATEGORIES */}
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminCategoriesPage />
          </AdminRoute>
        }
      />

      {/* ✅ NEW: MANAGE HERO BANNERS */}
      <Route
        path="/admin/banners"
        element={
          <AdminRoute>
            <AdminBannersPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}