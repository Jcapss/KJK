// src/pages/HomePage.tsx
import React, { useEffect, useMemo, useState } from "react";

import HeroSlider from "../components/HeroSlider";
import type { HeroSlide } from "../components/HeroSlider";
import BrowseCategories from "../components/BrowseCategories";
import HeaderBar from "../components/HeaderBar";
import CartDrawer, { type CartLine } from "../components/CartDrawer";

import { fetchProducts } from "../data/productsApi";
import type { ProductRow } from "../types/db";
import { fetchActiveBanners } from "../data/bannersApi";

type ItemLike = {
  id: string;
  name: string;
  category: string;
  price: number;
};

const CART_KEY = "kjk_cart_v1";
const CART_ITEMS_KEY = "kjk_cart_items_v1";
const BANNERS_REFRESH_KEY = "kjk_banners_refresh_v1";
const BANNERS_BC_NAME = "kjk_banners_channel_v1";

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
  if (!slug) return "All";
  const words = slug.split("-").filter(Boolean);
  return words
    .map((w) => {
      const lw = w.toLowerCase();
      if (lw === "cpu" || lw === "gpu") return w.toUpperCase();
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");
}

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(() =>
    safeParseCart(localStorage.getItem(CART_KEY))
  );

  // ✅ Cached item details (so cart never loses items)
  const [itemCache, setItemCache] = useState<Record<string, ItemLike>>(() =>
    safeParseItemCache(localStorage.getItem(CART_ITEMS_KEY))
  );

  // ✅ Hero slides from DB
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [slidesErr, setSlidesErr] = useState<string | null>(null);

  // persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // persist item cache
  useEffect(() => {
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(itemCache));
  }, [itemCache]);

  // ✅ Fetch hero banners + auto-refresh when Admin saves
  useEffect(() => {
    let alive = true;

    const loadBanners = async () => {
      try {
        setSlidesErr(null);
        const rows = await fetchActiveBanners();
        if (!alive) return;

        setSlides(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle,
            note_text: r.note_text ?? undefined,

            image: r.image_url,
            ctaText: r.cta_text,
            ctaHref: r.cta_href,

            overlay_strength: r.overlay_strength,
            align: r.align,
            show_fb_buttons: r.show_fb_buttons,

            title_color: r.title_color,
            subtitle_color: r.subtitle_color,
            note_color: r.note_color,
          }))
        );
      } catch (e: any) {
        if (!alive) return;
        setSlidesErr(e?.message ?? "Failed to load banners");
      }
    };

    loadBanners();

    const onFocus = () => loadBanners();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadBanners();
    };
    const onBannersUpdated = () => loadBanners();

    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNERS_REFRESH_KEY) loadBanners();
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BANNERS_BC_NAME);
      bc.onmessage = (msg) => {
        if (msg?.data?.type === "BANNERS_UPDATED") loadBanners();
      };
    } catch {}

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("kjk:banners-updated", onBannersUpdated as any);
    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("kjk:banners-updated", onBannersUpdated as any);
      window.removeEventListener("storage", onStorage);
      try {
        bc?.close();
      } catch {}
    };
  }, []);

  // Fetch products (used for cart item details + search)
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

          // ✅ update cache from loaded products
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
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [query]);

  // ✅ itemsById for CartDrawer (cache + current items)
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
        activeCategory="all" // ✅ IMPORTANT: slug-based now
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
        {slidesErr ? (
          <div className="p-4 text-sm text-red-600">{slidesErr}</div>
        ) : (
          <HeroSlider slides={slides} autoPlay={false} />
        )}
      </section>

      <BrowseCategories />

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
                <a className="hover:underline" href="mailto:darylescasinas@gmail.com">
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
            <span>© {new Date().getFullYear()} KJK TechShop. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;