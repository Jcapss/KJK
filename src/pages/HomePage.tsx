import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import HeroSlider from "../components/HeroSlider";
import type { HeroSlide } from "../components/HeroSlider"; // ✅ add
import BrowseCategories from "../components/BrowseCategories";
import HeaderBar from "../components/HeaderBar";
import CartDrawer, { type CartLine } from "../components/CartDrawer";

import { fetchProducts } from "../data/productsApi";
import type { ProductRow } from "../types/db";

// ✅ NEW: fetch banners from DB
import { fetchActiveBanners } from "../data/bannersApi";

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

const HomePage = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  // ✅ NEW: Hero slides from DB
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [slidesErr, setSlidesErr] = useState<string | null>(null);

  // persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // ✅ Fetch hero banners from Supabase
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSlidesErr(null);
        const rows = await fetchActiveBanners();
        if (!alive) return;

        setSlides(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle,
            image: r.image_url,
            ctaText: r.cta_text,
            ctaHref: r.cta_href,
          }))
        );
      } catch (e: any) {
        if (!alive) return;
        setSlidesErr(e?.message ?? "Failed to load banners");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Fetch products (for itemsById mapping only; cart needs product info)
  useEffect(() => {
    let alive = true;

    const timeout = setTimeout(() => {
      (async () => {
        try {
          setErr(null);
          setLoading(true);

          const data = await fetchProducts({ q: query });
          if (!alive) return;

          setItems(data);
        } catch (e: any) {
          if (!alive) return;
          setErr(e?.message ?? "Failed to load products");
        } finally {
          if (!alive) return;
          setLoading(false);
        }
      })();
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [query]);

  // ✅ itemsById for CartDrawer (expects Item-like shape)
  const itemsById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of items) {
      map[p.id] = {
        id: p.id,
        name: p.name,
        category:
          p.category_slug?.toLowerCase() === "services"
            ? "Services"
            : String(p.category_slug ?? "All"),
        price: Number(p.price ?? 0),
      };
    }
    return map;
  }, [items]);

  // cart count badge (total qty)
  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + (l.qty || 0), 0),
    [cart]
  );

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((x) => x.id !== id));
  }

  function clearCart() {
    setCart([]);
    localStorage.removeItem(CART_KEY);
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-black">
      <HeaderBar
        query={query}
        setQuery={setQuery}
        activeCategory="All"
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

      <section className="mx-auto max-w-7xl px-0 pt-0">
        {/* ✅ DB-driven banners */}
        {slidesErr ? (
          <div className="p-4 text-sm text-red-600">{slidesErr}</div>
        ) : (
          <HeroSlider slides={slides} autoPlay={false} />
        )}
      </section>

      <BrowseCategories />

      {/* Footer */}
      <footer id="footer" className="mt-16 border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-lg font-extrabold">KJK TechShop</div>
            <p className="mt-2 text-sm text-black/60">
              Computer Parts • Laptops • CCTV • Services
            </p>
          </div>

          <div>
            <div className="text-sm font-bold">Contact</div>
            <ul className="mt-3 space-y-2 text-sm text-black/70">
              <li>
                <span className="font-semibold text-black">Phone:</span>{" "}
                <a className="hover:underline" href="tel:+639758493755">
                  0975-849-3755
                </a>
              </li>
              <li>
                <span className="font-semibold text-black">Email:</span>{" "}
                <a
                  className="hover:underline"
                  href="mailto:darylescasinas@gmail.com"
                >
                  darylescasinas@gmail.com
                </a>
              </li>
              <li>
                <span className="font-semibold text-black">Facebook:</span>{" "}
                <a
                  className="hover:underline"
                  href="https://www.facebook.com/kjktechshop"
                  target="_blank"
                  rel="noreferrer"
                >
                  Message us on Facebook
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold">Address</div>
            <p className="mt-3 text-sm text-black/70">
              21 Jasmine St., Ultra Homes, Matina Aplaya, Davao City
            </p>
          </div>

          <div>
            <div className="text-sm font-bold">Location</div>
            <p className="mt-3 text-sm text-black/70">
              View our location on Google Maps:
            </p>

            <a
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              href="https://maps.app.goo.gl/M1H5MXDiEuWKrcP59"
              target="_blank"
              rel="noreferrer"
            >
              Open Map
            </a>
          </div>
        </div>

        <div className="border-t border-black/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-black/50 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} KJK TechShop. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;