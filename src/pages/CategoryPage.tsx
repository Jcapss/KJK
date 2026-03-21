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

type SortOption = "default" | "price-asc" | "price-desc";

const CART_KEY = "kjk_cart_v1";
const CART_ITEMS_KEY = "kjk_cart_items_v1";
const PRODUCTS_PER_PAGE = 9;

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

  const categoryCandidates = useMemo(() => {
    if (!slug) return [];
    const a = slug;
    const b = slug.endsWith("s") ? slug.slice(0, -1) : `${slug}s`;
    return Array.from(new Set([a, b])).filter(Boolean);
  }, [slug]);

  const activeHeaderCategory = useMemo(() => {
    if (!slug || slug === "all") return "all";

    const map: Record<string, string> = {
      laptops: "laptop",
    };

    return map[slug] ?? slug;
  }, [slug]);

  const isAccessories = slug === "accessories";
  const isSolar = slug === "services";
  const isRam = slug === "ram";
  const isMonitor = slug === "monitor";

  const [query] = useState("");
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

  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  const [partnerOptions, setPartnerOptions] = useState<string[]>([]);
  const [partnerBrand, setPartnerBrand] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  const [kwOptions, setKwOptions] = useState<number[]>([]);
  const [selectedKW, setSelectedKW] = useState<number | "">("");

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const hasPartnerBrands = !isMonitor && partnerOptions.length > 0;

  const leftTitle = isAccessories
    ? "PERIPHERALS"
    : isRam
    ? "GENERATION"
    : "PRODUCT BRANDS";

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(itemCache));
  }, [itemCache]);

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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setPartnerLoading(true);
        setPartnerBrand("");

        if (!slug || isMonitor) {
          setPartnerOptions([]);
          return;
        }

        const brands = await fetchPartnerBrands({ category: slug });
        if (!alive) return;
        setPartnerOptions(brands);
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
  }, [slug, isMonitor]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!isSolar) {
          setKwOptions([]);
          setSelectedKW("");
          return;
        }

        const data = await fetchProducts({
          category: slug,
        });

        if (!alive) return;

        const kws = Array.from(
          new Set(
            data
              .map((p) => p.kw_size)
              .filter((k): k is number => typeof k === "number")
          )
        ).sort((a, b) => a - b);

        setKwOptions(kws);
      } catch {
        if (!alive) return;
        setKwOptions([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug, isSolar]);

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
          partnerBrand: !isMonitor && partnerBrand ? partnerBrand : undefined,
          kw: selectedKW === "" ? undefined : selectedKW,
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
  }, [slug, categoryCandidates, query, selectedBrands, partnerBrand, selectedKW, isMonitor]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, selectedBrands, partnerBrand, selectedKW, query, sortBy]);

  const catTitle = useMemo(() => titleFromSlug(slug), [slug]);

  function toggleBrand(b: string) {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function clearBrands() {
    setSelectedBrands([]);
    setPartnerBrand("");
    setSelectedKW("");
    setSortBy("default");
    setCurrentPage(1);
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

  const sortedItems = useMemo(() => {
    const copy = [...items];

    if (sortBy === "price-asc") {
      copy.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    } else if (sortBy === "price-desc") {
      copy.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    }

    return copy;
  }, [items, sortBy]);

  const totalPages = Math.ceil(sortedItems.length / PRODUCTS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    return sortedItems.slice(start, end);
  }, [sortedItems, currentPage]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        activeCategory={activeHeaderCategory}
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
              {loading
                ? "Loading..."
                : `Showing ${paginatedItems.length} of ${sortedItems.length} item(s)`}
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-white p-4 text-sm text-red-600">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-black/10 bg-white p-4">
            <div className="text-sm font-extrabold tracking-wide">{leftTitle}</div>
            <div className="mt-2 h-[2px] w-full bg-black/10" />
            <div className="mt-1 h-[3px] w-16 bg-red-600" />

            <div className="mt-4">
              {brandLoading ? (
                <div className="text-sm text-black/60">
                  Loading {isAccessories ? "peripherals..." : isRam ? "generations..." : "brands..."}
                </div>
              ) : brandOptions.length === 0 ? (
                <div className="text-sm text-black/60">
                  No {isAccessories ? "peripherals" : isRam ? "generations" : "brands"} found.
                </div>
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

              {hasPartnerBrands ? (
                <div className="mt-5">
                  <div className="text-xs font-extrabold tracking-wide text-black/70">
                    PARTNER BRAND
                  </div>

                  {partnerLoading ? (
                    <div className="mt-2 text-sm text-black/60">Loading partner brands...</div>
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
                </div>
              ) : null}

              {isSolar && kwOptions.length > 0 ? (
                <div className="mt-5">
                  <div className="text-xs font-extrabold tracking-wide text-black/70">
                    SYSTEM SIZE (KW)
                  </div>

                  <select
                    value={selectedKW}
                    onChange={(e) =>
                      setSelectedKW(e.target.value ? Number(e.target.value) : "")
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="">All</option>
                    {kwOptions.map((kw) => (
                      <option key={kw} value={kw}>
                        {kw} KW
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={clearBrands}
                  disabled={selectedBrands.length === 0 && !partnerBrand && selectedKW === ""}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-60"
                >
                  Clear
                </button>

                <div className="ml-auto self-center text-xs text-black/50">
                  {selectedBrands.length > 0 ? `${selectedBrands.length} selected` : ""}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black/10 sm:w-[240px]"
              >
                <option value="default">Sort by Price</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedItems.map((it) => (
                <ProductCard key={it.id} item={it} onView={() => nav(`/product/${it.id}`)} />
              ))}
            </div>

            {!loading && sortedItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
                No items found in <b>{catTitle}</b>.
              </div>
            ) : null}

            {!loading && totalPages > 1 ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      currentPage === page
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black hover:bg-black/5"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}