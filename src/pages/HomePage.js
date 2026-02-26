// src/pages/HomePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import HeroSlider from "../components/HeroSlider";
import BrowseCategories from "../components/BrowseCategories";
import HeaderBar from "../components/HeaderBar";
import CartDrawer from "../components/CartDrawer";
import { fetchProducts } from "../data/productsApi";
import { fetchActiveBanners } from "../data/bannersApi";
const CART_KEY = "kjk_cart_v1";
const CART_ITEMS_KEY = "kjk_cart_items_v1";
const BANNERS_REFRESH_KEY = "kjk_banners_refresh_v1";
const BANNERS_BC_NAME = "kjk_banners_channel_v1";
function safeParseCart(raw) {
    if (!raw)
        return [];
    try {
        const val = JSON.parse(raw);
        if (!Array.isArray(val))
            return [];
        return val
            .map((x) => ({
            id: String(x?.id ?? ""),
            qty: Math.max(1, Number(x?.qty ?? 1)),
        }))
            .filter((x) => x.id);
    }
    catch {
        return [];
    }
}
function safeParseItemCache(raw) {
    if (!raw)
        return {};
    try {
        const val = JSON.parse(raw);
        if (!val || typeof val !== "object")
            return {};
        return val;
    }
    catch {
        return {};
    }
}
function titleFromSlug(slug) {
    if (!slug)
        return "All";
    const words = slug.split("-").filter(Boolean);
    return words
        .map((w) => {
        const lw = w.toLowerCase();
        if (lw === "cpu" || lw === "gpu")
            return w.toUpperCase();
        return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
        .join(" ");
}
const HomePage = () => {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    // ✅ Cart
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState(() => safeParseCart(localStorage.getItem(CART_KEY)));
    // ✅ Cached item details (so cart never loses items)
    const [itemCache, setItemCache] = useState(() => safeParseItemCache(localStorage.getItem(CART_ITEMS_KEY)));
    // ✅ Hero slides from DB
    const [slides, setSlides] = useState([]);
    const [slidesErr, setSlidesErr] = useState(null);
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
                if (!alive)
                    return;
                setSlides(rows.map((r) => ({
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
                })));
            }
            catch (e) {
                if (!alive)
                    return;
                setSlidesErr(e?.message ?? "Failed to load banners");
            }
        };
        loadBanners();
        const onFocus = () => loadBanners();
        const onVisibility = () => {
            if (document.visibilityState === "visible")
                loadBanners();
        };
        const onBannersUpdated = () => loadBanners();
        const onStorage = (e) => {
            if (e.key === BANNERS_REFRESH_KEY)
                loadBanners();
        };
        let bc = null;
        try {
            bc = new BroadcastChannel(BANNERS_BC_NAME);
            bc.onmessage = (msg) => {
                if (msg?.data?.type === "BANNERS_UPDATED")
                    loadBanners();
            };
        }
        catch { }
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("kjk:banners-updated", onBannersUpdated);
        window.addEventListener("storage", onStorage);
        return () => {
            alive = false;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("kjk:banners-updated", onBannersUpdated);
            window.removeEventListener("storage", onStorage);
            try {
                bc?.close();
            }
            catch { }
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
                    if (!alive)
                        return;
                    setItems(data);
                    // ✅ update cache from loaded products
                    setItemCache((prev) => {
                        const next = { ...prev };
                        for (const p of data) {
                            next[p.id] = {
                                id: p.id,
                                name: p.name,
                                category: String(p.category_slug ?? "").toLowerCase() === "services"
                                    ? "Services"
                                    : titleFromSlug(String(p.category_slug ?? "All")),
                                price: Number(p.price ?? 0),
                            };
                        }
                        return next;
                    });
                }
                catch (e) {
                    if (!alive)
                        return;
                    setErr(e?.message ?? "Failed to load products");
                }
                finally {
                    if (!alive)
                        return;
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
        const map = { ...itemCache };
        for (const p of items) {
            map[p.id] = {
                id: p.id,
                name: p.name,
                category: String(p.category_slug ?? "").toLowerCase() === "services"
                    ? "Services"
                    : titleFromSlug(String(p.category_slug ?? "All")),
                price: Number(p.price ?? 0),
            };
        }
        return map;
    }, [itemCache, items]);
    const cartCount = useMemo(() => cart.reduce((sum, l) => sum + (l.qty || 0), 0), [cart]);
    function setQty(id, qty) {
        setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));
    }
    function removeLine(id) {
        setCart((prev) => prev.filter((x) => x.id !== id));
    }
    function clearCart() {
        setCart([]);
        localStorage.removeItem(CART_KEY);
    }
    return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
        React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: "all" // ✅ IMPORTANT: slug-based now
            , cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
        React.createElement(CartDrawer, { open: cartOpen, onClose: () => setCartOpen(false), itemsById: itemsById, cart: cart, setQty: setQty, removeLine: removeLine, clearCart: clearCart }),
        React.createElement("section", { className: "mx-auto max-w-7xl px-0 pt-0" }, slidesErr ? (React.createElement("div", { className: "p-4 text-sm text-red-600" }, slidesErr)) : (React.createElement(HeroSlider, { slides: slides, autoPlay: false }))),
        React.createElement(BrowseCategories, null),
        React.createElement("footer", { id: "footer", className: "mt-16 border-t border-black/10 bg-white" },
            React.createElement("div", { className: "mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-lg font-extrabold" }, "KJK TechShop"),
                    React.createElement("p", { className: "mt-2 text-sm text-black/60" }, "Computer Parts \u2022 Laptops \u2022 CCTV \u2022 Services")),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-sm font-bold" }, "Contact"),
                    React.createElement("ul", { className: "mt-3 space-y-2 text-sm text-black/70" },
                        React.createElement("li", null,
                            React.createElement("span", { className: "font-semibold text-black" }, "Phone:"),
                            " ",
                            React.createElement("a", { className: "hover:underline", href: "tel:+639758493755" }, "0975-849-3755")),
                        React.createElement("li", null,
                            React.createElement("span", { className: "font-semibold text-black" }, "Email:"),
                            " ",
                            React.createElement("a", { className: "hover:underline", href: "mailto:darylescasinas@gmail.com" }, "darylescasinas@gmail.com")),
                        React.createElement("li", null,
                            React.createElement("span", { className: "font-semibold text-black" }, "Facebook:"),
                            " ",
                            React.createElement("a", { className: "hover:underline", href: "https://www.facebook.com/kjktechshop", target: "_blank", rel: "noreferrer" }, "Message us on Facebook")))),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-sm font-bold" }, "Address"),
                    React.createElement("p", { className: "mt-3 text-sm text-black/70" }, "21 Jasmine St., Ultra Homes, Matina Aplaya, Davao City")),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-sm font-bold" }, "Location"),
                    React.createElement("p", { className: "mt-3 text-sm text-black/70" }, "View our location on Google Maps:"),
                    React.createElement("a", { className: "mt-3 inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90", href: "https://maps.app.goo.gl/M1H5MXDiEuWKrcP59", target: "_blank", rel: "noreferrer" }, "Open Map"))),
            React.createElement("div", { className: "border-t border-black/10" },
                React.createElement("div", { className: "mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-black/50 sm:flex-row sm:items-center sm:justify-between" },
                    React.createElement("span", null,
                        "\u00A9 ",
                        new Date().getFullYear(),
                        " KJK TechShop. All rights reserved."))))));
};
export default HomePage;
