// src/components/AdminLayout.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();

  const isActive = (path: string) =>
    loc.pathname === path || loc.pathname.startsWith(path + "/");

  async function logout() {
    await supabase.auth.signOut();
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl bg-white p-5 shadow-sm border border-black/10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-black text-white grid place-items-center font-black">
                K
              </div>
              <div className="leading-tight">
                <div className="font-extrabold">KJK TechShop</div>
                <div className="text-xs text-black/60">Admin Panel</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Link
                to="/admin-dashboard"
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
                  isActive("/admin-dashboard")
                    ? "bg-black text-white"
                    : "hover:bg-black/5",
                ].join(" ")}
              >
                <span className="text-lg">🏠</span> Dashboard
              </Link>

              <Link
                to="/admin/products"
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
                  isActive("/admin/products")
                    ? "bg-black text-white"
                    : "hover:bg-black/5",
                ].join(" ")}
              >
                <span className="text-lg">📦</span> Products
              </Link>

              {/* ✅ Categories under Products */}
              <Link
                to="/admin/categories"
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
                  isActive("/admin/categories")
                    ? "bg-black text-white"
                    : "hover:bg-black/5",
                ].join(" ")}
              >
                <span className="text-lg">🗂️</span> Categories
              </Link>

              {/* ✅ NEW: Banners under Categories */}
              <Link
                to="/admin/banners"
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
                  isActive("/admin/banners")
                    ? "bg-black text-white"
                    : "hover:bg-black/5",
                ].join(" ")}
              >
                <span className="text-lg">🖼️</span> Banners
              </Link>
            </div>

            <div className="mt-6 border-t border-black/10 pt-4 space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold hover:bg-black/5"
              >
                <span className="text-lg">🌐</span> View Site
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold bg-black text-white hover:opacity-90"
                type="button"
              >
                <span className="text-lg">🔒</span> Logout
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="rounded-3xl bg-white p-6 shadow-sm border border-black/10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}