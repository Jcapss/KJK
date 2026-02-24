// src/components/HeaderBar.tsx
import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

  // ✅ NEW
  cartCount?: number; // total qty (ex: 5)
  onOpenCart?: () => void; // open CartDrawer
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
    else nav(`/category/${encodeURIComponent(cat)}`);
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
    <div className="sticky top-0 z-40">
      <div className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {/* Left: Logo + name */}
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="h-10 w-10 rounded-2xl bg-black text-white grid place-items-center font-black">
              K
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold">KJK TechShop</div>
              <div className="text-xs text-black/60">
                Parts • Laptops • CCTV • Services
              </div>
            </div>
          </div>

          {/* Middle: Search + Category */}
          <div className="flex flex-1 items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GPU, laptop, CCTV..."
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />

            <select
              value={activeCategory}
              onChange={(e) => goToCategory(e.target.value as CategoryName)}
              className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none hover:bg-black/5"
              aria-label="Choose category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Cart + Contact + Login */}
          <div className="flex items-center gap-2">
            {/* ✅ Cart button */}
            <button
              onClick={() => onOpenCart?.()}
              className="relative rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
              type="button"
              aria-label="Open cart"
              title="Open cart"
            >
              Cart
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[11px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </button>

            <button
              onClick={scrollToFooter}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              type="button"
            >
              Contact
            </button>

            <button
              onClick={() => nav("/login")}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              type="button"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
