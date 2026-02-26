// src/components/AdminLayout.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    loc.pathname === path || loc.pathname.startsWith(path + "/");

  async function logout() {
    await supabase.auth.signOut();
    nav("/login");
  }

  // ✅ close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  // ✅ close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Sidebar = (
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
            isActive("/admin-dashboard") ? "bg-black text-white" : "hover:bg-black/5",
          ].join(" ")}
        >
          <span className="text-lg">🏠</span> Dashboard
        </Link>

        <Link
          to="/admin/products"
          className={[
            "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
            isActive("/admin/products") ? "bg-black text-white" : "hover:bg-black/5",
          ].join(" ")}
        >
          <span className="text-lg">📦</span> Products
        </Link>

        <Link
          to="/admin/categories"
          className={[
            "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
            isActive("/admin/categories") ? "bg-black text-white" : "hover:bg-black/5",
          ].join(" ")}
        >
          <span className="text-lg">🗂️</span> Categories
        </Link>

        <Link
          to="/admin/banners"
          className={[
            "flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
            isActive("/admin/banners") ? "bg-black text-white" : "hover:bg-black/5",
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
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
        {/* ✅ Mobile top bar */}
        <div className="lg:hidden mb-4 flex items-center justify-between rounded-3xl bg-white p-3 shadow-sm border border-black/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-black">
              K
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold">Admin</div>
              <div className="text-xs text-black/60">KJK TechShop</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {/* ✅ Desktop layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            {Sidebar}
          </div>

          <main className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-black/10">
            {children}
          </main>
        </div>
      </div>

      {/* ✅ Mobile Drawer */}
      <div
        className={[
          "lg:hidden fixed inset-0 z-50",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={[
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <div
          className={[
            "absolute left-0 top-0 h-full w-[320px] max-w-[85vw] p-4 transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-extrabold">Menu</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          {Sidebar}
        </div>
      </div>
    </div>
  );
}