import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import CartDrawer, { type CartLine } from "../components/CartDrawer";

import { fetchProductById } from "../data/productsApi";
import type { ProductRow, CategorySlug } from "../types/db";
import { supabase } from "../lib/supabase";

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

type ProfileInfo = {
  role: string;
  approval_status: string;
};

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

  const [item, setItem] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let alive = true;

    async function loadAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!alive) return;

        if (!user) {
          setProfile(null);
          setCheckingAccess(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role, approval_status")
          .eq("id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (error || !data) {
          setProfile(null);
          setCheckingAccess(false);
          return;
        }

        setProfile(data);
        setCheckingAccess(false);
      } catch {
        if (!alive) return;
        setProfile(null);
        setCheckingAccess(false);
      }
    }

    loadAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAccess();
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + (l.qty || 0), 0),
    [cart]
  );

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
          activeCategory="all"
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
          activeCategory="all"
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
          activeCategory="all"
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

  const isSolarService =
    item.category_slug === "services" &&
    (typeof item.kw_size === "number" ||
      !!item.system_type ||
      !!item.includes ||
      !!item.quotation_pdf);

  const canViewPrice =
    !!profile &&
    (profile.role === "admin" || profile.approval_status === "approved");

  const showPendingMessage =
    !!profile &&
    profile.role !== "admin" &&
    (profile.approval_status === "pending" ||
      profile.approval_status === "rejected");

  const canAddToCart = canViewPrice;

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        activeCategory={item.category_slug}
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
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <div className="aspect-[4/3] bg-white">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-contain p-4"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/5 text-5xl">
                  📦
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="text-sm text-black/60">{activeCategory}</div>

            <div className="mt-1 text-3xl font-semibold">{item.name}</div>
            <div className="mt-2 text-sm text-black/60">{item.description}</div>

            {isSolarService ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                <div className="text-sm font-bold">Solar Package Details</div>

                {typeof item.kw_size === "number" ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                      System Size
                    </div>
                    <div className="text-sm font-medium">{item.kw_size} KW</div>
                  </div>
                ) : null}

                {item.system_type ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                      System Type
                    </div>
                    <div className="text-sm font-medium">{item.system_type}</div>
                  </div>
                ) : null}

                {item.includes ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                      Package Inclusions
                    </div>
                    <div className="text-sm text-black/70 whitespace-pre-line">
                      {item.includes}
                    </div>
                  </div>
                ) : null}

                {item.quotation_pdf ? (
                  <div className="pt-1">
                    <a
                      href={item.quotation_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
                    >
                      View Quotation PDF
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5">
              {checkingAccess ? (
                <div className="text-lg font-bold text-black/40">Checking...</div>
              ) : canViewPrice ? (
                <div className="text-lg font-bold">
                  {isQuote ? "For quotation" : `₱${price.toLocaleString()}`}
                </div>
              ) : (
                <div className="text-base font-semibold text-blue-600">
                  {showPendingMessage ? "Awaiting admin approval" : "Login to view price"}
                </div>
              )}

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
                  ? isSolarService
                    ? "Solar Service"
                    : "Service"
                  : item.stock > 0
                  ? `In Stock (${item.stock})`
                  : "AVAILABLE"}
              </div>

              {canAddToCart ? (
                <>
                  <button
                    onClick={() => addToCart(item.id)}
                    className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                    type="button"
                  >
                    Add to Cart
                  </button>

                  <div className="mt-2 text-xs text-black/50">
                    This adds the item to your quotation cart.
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => nav(profile ? "/login" : "/register")}
                    className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                    type="button"
                  >
                    {profile ? "Go to Login" : "Register to View Price"}
                  </button>

                  <div className="mt-2 text-xs text-black/50">
                    {showPendingMessage
                      ? "Your account must be approved by admin before seeing and quoting prices."
                      : "Create an approved account to see pricing and quotation options."}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}