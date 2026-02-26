// src/components/HeaderBar.tsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type CategoryName =
  | "All"
  | "CPU"
  | "GPU"
  | "Motherboard"
  | "Monitor"
  | "Laptops"
  | "Storage"
  | "Accessories"
  | "Services";

export default function HeaderBar({
  query,
  setQuery,
  activeCategory = "All",
  cartCount = 0,
  onOpenCart,
}: {
  query: string;
  setQuery: (v: string) => void;
  activeCategory?: CategoryName;
  cartCount?: number;
  onOpenCart?: () => void;
}) {
  const nav = useNavigate();
  const location = useLocation();

  const categories = useMemo<CategoryName[]>(
    () => [
      "All",
      "CPU",
      "GPU",
      "Motherboard",
      "Monitor",
      "Laptops",
      "Storage",
      "Accessories",
      "Services",
    ],
    []
  );

  function goToCategory(cat: CategoryName) {
    if (cat === "All") nav("/");
    else nav(`/category/${encodeURIComponent(cat.toLowerCase())}`);
  }

  function scrollToFooter() {
    if (location.pathname !== "/") {
      nav("/");
      setTimeout(() => {
        document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return;
    }
    document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        {/* ✅ DESKTOP (one row like your screenshot) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => nav("/")}
            className="flex items-center gap-3 text-left shrink-0"
            aria-label="Go to home"
          >
            <div className="h-11 w-11 rounded-2xl bg-black text-white grid place-items-center font-black">
              K
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">
                KJK TechShop
              </div>
              <div className="text-xs text-black/60">
                Parts • Laptops • CCTV • Services
              </div>
            </div>
          </button>

          {/* Search (fills remaining space) */}
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4">
              <span className="text-black/35">🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search GPU, laptop, CCTV…"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <select
            value={activeCategory}
            onChange={(e) => goToCategory(e.target.value as CategoryName)}
            className="shrink-0 w-[160px] rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-medium outline-none hover:bg-black/5"
            aria-label="Choose category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Cart */}
          <button
            onClick={() => onOpenCart?.()}
            type="button"
            className="relative shrink-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5"
            aria-label="Open cart"
            title="Cart"
          >
            Cart
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[11px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </button>

          {/* Contact */}
          <button
            onClick={scrollToFooter}
            type="button"
            className="shrink-0 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap"
          >
            Contact
          </button>

          {/* Login */}
          <button
            onClick={() => nav("/login")}
            type="button"
            className="shrink-0 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Login
          </button>
        </div>

        {/* ✅ MOBILE/TABLET (compact, stacked) */}
        <div className="lg:hidden">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => nav("/")}
              className="flex items-center gap-2 text-left"
              aria-label="Go to home"
            >
              <div className="h-9 w-9 rounded-2xl bg-black text-white grid place-items-center font-black text-sm">
                K
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-extrabold tracking-tight">
                  KJK TechShop
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenCart?.()}
                type="button"
                className="relative inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
                aria-label="Open cart"
                title="Cart"
              >
                🛒
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => nav("/login")}
                type="button"
                className="rounded-2xl bg-black px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90"
              >
                Login
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3">
            <span className="text-black/35 text-sm">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GPU, laptop, CCTV…"
              className="w-full bg-transparent py-2 text-[13px] outline-none"
            />
          </div>

          {/* Category + Contact */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select
              value={activeCategory}
              onChange={(e) => goToCategory(e.target.value as CategoryName)}
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-[13px] outline-none hover:bg-black/5"
              aria-label="Choose category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={scrollToFooter}
              type="button"
              className="w-full rounded-2xl bg-black px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 