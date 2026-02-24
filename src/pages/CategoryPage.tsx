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
const CART_ITEMS_KEY = "kjk_cart_items_v1"; // ✅ cache of item details by id

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

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Cart state (shared)
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  // ✅ Cached item details (shared)
  const [itemCache, setItemCache] = useState<Record<string, ItemLike>>(() =>
    safeParseItemCache(localStorage.getItem(CART_ITEMS_KEY))
  );

  // persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // persist cache
  useEffect(() => {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(itemCache));
  }, [itemCache]);

  // ✅ chip/general brands (checkbox)
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  // ✅ partner brand dropdown (GPU/Mobo only)
  const isGpuOrMobo = slug === "gpu" || slug === "motherboard";
  const [partnerOptions, setPartnerOptions] = useState<string[]>([]);
  const [partnerBrand, setPartnerBrand] = useState<string>("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  // Load checkbox brands
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

  // Load products
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
          category: slug,
          q: query,
          brands: selectedBrands,
          partnerBrand: isGpuOrMobo ? partnerBrand || undefined : undefined,
        });

        if (!alive) return;
        setItems(data);

        // ✅ IMPORTANT: update cache from loaded products (so cart can render across pages)
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
  }, [slug, query, selectedBrands, partnerBrand, isGpuOrMobo]);

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

  // ✅ itemsById comes from cache + current items (so never “loses” previous category items)
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

  // ✅ cart helpers
  function addToCart(p: ProductRow) {
    // update cart
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { id: p.id, qty: 1 }];
    });

    // update cache so item renders even after switching categories
    setItemCache((prev) => ({
      ...prev,
      [p.id]: {
        id: p.id,
        name: p.name,
        category:
          String(p.category_slug ?? "").toLowerCase() === "services"
            ? "Services"
            : titleFromSlug(String(p.category_slug ?? "All")),
        price: Number(p.price ?? 0),
      },
    }));

    setCartOpen(true);
  }

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((x) => x.id !== id));
    // optional: you can keep cache entry (better for PDF history)
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        query={query}
        setQuery={setQuery}
        activeCategory={catTitle as any}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        itemsById={itemsById}
        cart={cart}
        setQty={setQty}
        removeLine={removeLine}
        clearCart={clearCart}
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

              {/* Partner dropdown */}
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
  <ProductCard
    key={it.id}
    item={it}
    onView={() => nav(`/product/${it.id}`)}
  />
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
