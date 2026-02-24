// src/pages/AdminDashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Admin</div>
          <div className="text-sm text-black/60">Manage products and categories</div>
        </div>
        {/* ✅ removed top-right buttons */}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/admin/products")}
          className="rounded-2xl border border-black/10 bg-white p-5 text-left hover:bg-black/5"
          type="button"
        >
          <div className="text-lg font-extrabold">Manage Products</div>
          <div className="mt-1 text-sm text-black/60">
            Add, edit, delete products from your store.
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/categories")}
          className="rounded-2xl border border-black/10 bg-white p-5 text-left hover:bg-black/5"
          type="button"
        >
          <div className="text-lg font-extrabold">Manage Categories</div>
          <div className="mt-1 text-sm text-black/60">
            Add, rename, and activate/deactivate categories.
          </div>
        </button>
      </div>
    </AdminLayout>
  );
}
