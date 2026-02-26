// src/pages/CategoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import ProductCard from "../components/ProductCard";
import CartDrawer, { type CartLine } from "../components/CartDrawer";

import type { ProductRow } from "../types/db";
import { fetchBrands, fetchPartnerBrands, fetchProducts } from "../data/productsApi";

type ItemLike = {
  id: string;
  name: string;
  category: string;
  price: number;
};

const CART_KEY = "kjk_cart_v1";
const CART_ITEMS_KEY = "kjk_cart_items_v1";

function safeParseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const val = JSON.parse(raw);
    if (!Array.isArray(val)) return [];
    return val
      .map((x: any) => ({
        id: String(x?.id ?? ""),
        qty: Math.max(1, Number(x?.qty ?? 1)),
      }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

function safeParseItemCache(raw: string | null): Record<string, ItemLike> {
  if (!raw) return {};
  try {
    const val = JSON.parse(raw);
    if (!val || typeof val !== "object") return {};
    return val as Record<string, ItemLike>;
  } catch {
    return {};
  }
}

function titleFromSlug(slug: string) {
  if (!slug) return "Category";
  const words = slug.split("-").filter(Boolean);
  return words
    .map((w) => {
      const lw = w.toLowerCase();
      if (lw === "cpu" || lw === "gpu") return w.toUpperCase();
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");
}

export default function CategoryPage() {
  const nav = useNavigate();
  const { categoryName } = useParams();

  const slug = useMemo(
    () => decodeURIComponent(categoryName || "").trim().toLowerCase(),
    [categoryName]
  );

  // ✅ allow singular/plural fallback (laptop/laptops)
  const categoryCandidates = useMemo(() => {
    if (!slug) return [];
    const a = slug;
    const b = slug.endsWith("s") ? slug.slice(0, -1) : `${slug}s`;
    return Array.from(new Set([a, b])).filter(Boolean);
  }, [slug]);

  // ✅ Header dropdown value must match DB slug
  const activeHeaderCategory = useMemo(() => {
    if (!slug || slug === "all") return "all";

    // If your route uses plural but DB uses singular:
    const map: Record<string, string> = {
      laptops: "laptop",
      // add more only if needed:
      // monitors: "monitor",
    };

    return map[slug] ?? slug;
  }, [slug]);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  const [itemCache, setItemCache] = useState<Record<string, ItemLike>>(() =>
    safeParseItemCache(localStorage.getItem(CART_ITEMS_KEY))
  );

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(itemCache));
  }, [itemCache]);

  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  const isGpuOrMobo = slug === "gpu" || slug === "motherboard";
  const [partnerOptions, setPartnerOptions] = useState<string[]>([]);
  const [partnerBrand, setPartnerBrand] = useState<string>("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Load checkbox brands (use base slug)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setBrandLoading(true);
        setSelectedBrands([]);
        if (!slug) {
          setBrandOptions([]);
          return;
        }
        const brands = await fetchBrands({ category: slug });
        if (!alive) return;
        setBrandOptions(brands);
      } catch {
        if (!alive) return;
        setBrandOptions([]);
      } finally {
        if (!alive) return;
        setBrandLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  // Load partner dropdown options (only GPU/Mobo)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setPartnerBrand("");
        setPartnerOptions([]);

        if (!isGpuOrMobo || !slug) return;

        setPartnerLoading(true);
        const opts = await fetchPartnerBrands({ category: slug });
        if (!alive) return;
        setPartnerOptions(opts);
      } catch {
        if (!alive) return;
        setPartnerOptions([]);
      } finally {
        if (!alive) return;
        setPartnerLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, isGpuOrMobo]);

  // Load products ✅ (supports laptop/laptops)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr(null);
        setLoading(true);

        if (!slug) {
          setItems([]);
          return;
        }

        const data = await fetchProducts({
          category: categoryCandidates.length ? categoryCandidates : slug,
          q: query,
          brands: selectedBrands,
          partnerBrand: isGpuOrMobo ? partnerBrand || undefined : undefined,
        });

        if (!alive) return;
        setItems(data);

        setItemCache((prev) => {
          const next = { ...prev };
          for (const p of data) {
            next[p.id] = {
              id: p.id,
              name: p.name,
              category:
                String(p.category_slug ?? "").toLowerCase() === "services"
                  ? "Services"
                  : titleFromSlug(String(p.category_slug ?? "All")),
              price: Number(p.price ?? 0),
            };
          }
          return next;
        });
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load products");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, categoryCandidates, query, selectedBrands, partnerBrand, isGpuOrMobo]);

  const catTitle = useMemo(() => titleFromSlug(slug), [slug]);

  function toggleBrand(b: string) {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function clearBrands() {
    setSelectedBrands([]);
    setPartnerBrand("");
  }

  const itemsById = useMemo(() => {
    const map: Record<string, any> = { ...itemCache };

    for (const p of items) {
      map[p.id] = {
        id: p.id,
        name: p.name,
        category:
          String(p.category_slug ?? "").toLowerCase() === "services"
            ? "Services"
            : titleFromSlug(String(p.category_slug ?? "All")),
        price: Number(p.price ?? 0),
      };
    }
    return map;
  }, [itemCache, items]);

  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + (l.qty || 0), 0),
    [cart]
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        query={query}
        setQuery={setQuery}
        activeCategory={activeHeaderCategory} // ✅ slug-based now
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        itemsById={itemsById}
        cart={cart}
        setQty={(id, qty) =>
          setCart((prev) =>
            prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
          )
        }
        removeLine={(id) => setCart((prev) => prev.filter((x) => x.id !== id))}
        clearCart={() => setCart([])}
      />

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-start gap-3">
          <button
            onClick={() => nav("/")}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
            type="button"
          >
            ← Back to Home
          </button>

          <div>
            <div className="text-3xl font-black">{catTitle}</div>
            <div className="text-sm text-black/60">
              {loading ? "Loading..." : `Showing ${items.length} item(s)`}
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-white p-4 text-sm text-red-600">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* FILTER SIDEBAR */}
          <aside className="rounded-2xl border border-black/10 bg-white p-4 h-fit">
            <div className="text-sm font-extrabold tracking-wide">PRODUCT BRANDS</div>
            <div className="mt-2 h-[2px] w-full bg-black/10" />
            <div className="mt-1 h-[3px] w-16 bg-red-600" />

            <div className="mt-4">
              {brandLoading ? (
                <div className="text-sm text-black/60">Loading brands...</div>
              ) : brandOptions.length === 0 ? (
                <div className="text-sm text-black/60">No brands found.</div>
              ) : (
                <div className="space-y-2">
                  {brandOptions.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm text-black/80">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => toggleBrand(b)}
                      />
                      <span className="leading-tight">{b}</span>
                    </label>
                  ))}
                </div>
              )}

              {isGpuOrMobo ? (
                <div className="mt-4">
                  <div className="text-xs font-extrabold tracking-wide text-black/70">
                    PARTNER BRAND
                  </div>

                  {partnerLoading ? (
                    <div className="mt-2 text-sm text-black/60">
                      Loading partner brands...
                    </div>
                  ) : (
                    <select
                      value={partnerBrand}
                      onChange={(e) => setPartnerBrand(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    >
                      <option value="">All</option>
                      {partnerOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="mt-2 text-[11px] text-black/50">
                    GPU/Motherboard partners like MSI, Gigabyte, ASUS, etc.
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={clearBrands}
                  disabled={selectedBrands.length === 0 && !partnerBrand}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-60"
                >
                  Clear
                </button>

                <div className="ml-auto text-xs text-black/50 self-center">
                  {selectedBrands.length > 0 ? `${selectedBrands.length} selected` : ""}
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCTS GRID */}
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((it) => (
                <ProductCard key={it.id} item={it} onView={() => nav(`/product/${it.id}`)} />
              ))}
            </div>

            {!loading && items.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
                No items found in <b>{catTitle}</b>.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}