import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import CartDrawer, { type CartLine } from "../components/CartDrawer";

import { fetchProductById } from "../data/productsApi";
import type { ProductRow, CategorySlug } from "../types/db";

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

const CART_KEY = "kjk_cart_v1";

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

function slugToCategoryName(slug: CategorySlug): CategoryName {
  switch (slug) {
    case "cpu":
      return "CPU";
    case "gpu":
      return "GPU";
    case "motherboard":
      return "Motherboard";
    case "monitor":
      return "Monitor";
    case "laptops":
      return "Laptops";
    case "storage":
      return "Storage";
    case "accessories":
      return "Accessories";
    case "services":
      return "Services";
    default:
      return "All";
  }
}

export default function ProductPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [query, setQuery] = useState("");
  const [item, setItem] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  // persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // load product
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!id) {
          setErr("Missing product ID");
          setLoading(false);
          return;
        }

        setErr(null);
        setLoading(true);

        const product = await fetchProductById(id);
        if (!alive) return;

        setItem(product);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load product details");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const activeCategory: CategoryName = useMemo(() => {
    if (!item) return "All";
    return slugToCategoryName(item.category_slug);
  }, [item]);

  // ✅ cart badge count (total qty)
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + (l.qty || 0), 0),
    [cart]
  );

  // ✅ itemsById for CartDrawer (just the current product + safe fallback)
  const itemsById = useMemo(() => {
    const map: Record<string, any> = {};
    if (item) {
      map[item.id] = {
        id: item.id,
        name: item.name,
        category:
          item.category_slug?.toLowerCase() === "services"
            ? "Services"
            : String(item.category_slug ?? "All"),
        price: Number(item.price ?? 0),
      };
    }
    return map;
  }, [item]);

  // ✅ cart helpers
  function addToCart(productId: string) {
    setCart((prev) => {
      const found = prev.find((x) => x.id === productId);
      if (found) {
        return prev.map((x) =>
          x.id === productId ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, { id: productId, qty: 1 }];
    });
    setCartOpen(true);
  }

  function setQty(lineId: string, qty: number) {
    setCart((prev) =>
      prev.map((x) => (x.id === lineId ? { ...x, qty: Math.max(1, qty) } : x))
    );
  }

  function removeLine(lineId: string) {
    setCart((prev) => prev.filter((x) => x.id !== lineId));
  }

  function clearCart() {
    setCart([]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] text-black">
        <HeaderBar
          query={query}
          setQuery={setQuery}
          activeCategory="All"
          cartCount={cartCount}
          onOpenCart={() => setCartOpen(true)}
        />
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-black/60">
          Loading...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] text-black">
        <HeaderBar
          query={query}
          setQuery={setQuery}
          activeCategory="All"
          cartCount={cartCount}
          onOpenCart={() => setCartOpen(true)}
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-red-500/20 bg-white p-4 text-sm text-red-600">
            {err}
          </div>
          <button
            onClick={() => nav(-1)}
            className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
            type="button"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] text-black">
        <HeaderBar
          query={query}
          setQuery={setQuery}
          activeCategory="All"
          cartCount={cartCount}
          onOpenCart={() => setCartOpen(true)}
        />
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-black/60">
          Product not found.
        </div>
      </div>
    );
  }

  const price = Number(item.price);
  const isQuote = item.category_slug === "services" && price <= 0;

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        query={query}
        setQuery={setQuery}
        activeCategory={activeCategory}
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
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => nav(-1)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5"
            type="button"
          >
            ← Back
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
            type="button"
          >
            View Cart ({cartCount})
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-black/10 bg-white">
            <div className="aspect-[4/3] bg-white">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-contain p-4"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl bg-black/5">
                  📦
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl bg-white p-6 border border-black/10">
            <div className="text-sm text-black/60">{activeCategory}</div>

            <div className="mt-1 text-3xl font-semibold">{item.name}</div>
            <div className="mt-2 text-sm text-black/60">{item.description}</div>

            <div className="mt-5">
              <div className="text-lg font-bold">
                {isQuote ? "For quotation" : `₱${price.toLocaleString()}`}
              </div>

              <div
                className={[
                  "mt-2 text-xs font-semibold uppercase tracking-wide",
                  item.category_slug === "services"
                    ? "text-black/50"
                    : item.stock > 0
                    ? "text-black/50"
                    : "text-green-600",
                ].join(" ")}
              >
                {item.category_slug === "services"
                  ? "Service"
                  : item.stock > 0
                  ? `In Stock (${item.stock})`
                  : "AVAILABLE"}
              </div>

              {/* ✅ Add to cart button */}
              <button
                onClick={() => addToCart(item.id)}
                className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                type="button"
              >
                Add to Cart
              </button>

              <div className="mt-2 text-xs text-black/50">
                This adds the item to your quotation cart (no account needed).
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
