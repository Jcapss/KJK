// src/pages/CategoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../components/HeaderBar";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { fetchBrands, fetchPartnerBrands, fetchProducts } from "../data/productsApi";
const CART_KEY = "kjk_cart_v1";
const CART_ITEMS_KEY = "kjk_cart_items_v1";
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
        return "Category";
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
export default function CategoryPage() {
    const nav = useNavigate();
    const { categoryName } = useParams();
    const slug = useMemo(() => decodeURIComponent(categoryName || "").trim().toLowerCase(), [categoryName]);
    // ✅ allow singular/plural fallback (laptop/laptops)
    const categoryCandidates = useMemo(() => {
        if (!slug)
            return [];
        const a = slug;
        const b = slug.endsWith("s") ? slug.slice(0, -1) : `${slug}s`;
        return Array.from(new Set([a, b])).filter(Boolean);
    }, [slug]);
    // ✅ Header dropdown value must match DB slug
    const activeHeaderCategory = useMemo(() => {
        if (!slug || slug === "all")
            return "all";
        // If your route uses plural but DB uses singular:
        const map = {
            laptops: "laptop",
            // add more only if needed:
            // monitors: "monitor",
        };
        return map[slug] ?? slug;
    }, [slug]);
    const [query, setQuery] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState(() => safeParseCart(localStorage.getItem(CART_KEY)));
    const [itemCache, setItemCache] = useState(() => safeParseItemCache(localStorage.getItem(CART_ITEMS_KEY)));
    useEffect(() => {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }, [cart]);
    useEffect(() => {
        localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(itemCache));
    }, [itemCache]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [brandLoading, setBrandLoading] = useState(false);
    const isGpuOrMobo = slug === "gpu" || slug === "motherboard";
    const [partnerOptions, setPartnerOptions] = useState([]);
    const [partnerBrand, setPartnerBrand] = useState("");
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
                if (!alive)
                    return;
                setBrandOptions(brands);
            }
            catch {
                if (!alive)
                    return;
                setBrandOptions([]);
            }
            finally {
                if (!alive)
                    return;
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
                if (!isGpuOrMobo || !slug)
                    return;
                setPartnerLoading(true);
                const opts = await fetchPartnerBrands({ category: slug });
                if (!alive)
                    return;
                setPartnerOptions(opts);
            }
            catch {
                if (!alive)
                    return;
                setPartnerOptions([]);
            }
            finally {
                if (!alive)
                    return;
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
                if (!alive)
                    return;
                setItems(data);
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
        return () => {
            alive = false;
        };
    }, [slug, categoryCandidates, query, selectedBrands, partnerBrand, isGpuOrMobo]);
    const catTitle = useMemo(() => titleFromSlug(slug), [slug]);
    function toggleBrand(b) {
        setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
    }
    function clearBrands() {
        setSelectedBrands([]);
        setPartnerBrand("");
    }
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
    return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
        React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: activeHeaderCategory, cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
        React.createElement(CartDrawer, { open: cartOpen, onClose: () => setCartOpen(false), itemsById: itemsById, cart: cart, setQty: (id, qty) => setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))), removeLine: (id) => setCart((prev) => prev.filter((x) => x.id !== id)), clearCart: () => setCart([]) }),
        React.createElement("section", { className: "mx-auto max-w-6xl px-4 py-6" },
            React.createElement("div", { className: "flex flex-wrap items-start gap-3" },
                React.createElement("button", { onClick: () => nav("/"), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5", type: "button" }, "\u2190 Back to Home"),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-3xl font-black" }, catTitle),
                    React.createElement("div", { className: "text-sm text-black/60" }, loading ? "Loading..." : `Showing ${items.length} item(s)`))),
            err ? (React.createElement("div", { className: "mt-4 rounded-2xl border border-red-500/20 bg-white p-4 text-sm text-red-600" }, err)) : null,
            React.createElement("div", { className: "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]" },
                React.createElement("aside", { className: "rounded-2xl border border-black/10 bg-white p-4 h-fit" },
                    React.createElement("div", { className: "text-sm font-extrabold tracking-wide" }, "PRODUCT BRANDS"),
                    React.createElement("div", { className: "mt-2 h-[2px] w-full bg-black/10" }),
                    React.createElement("div", { className: "mt-1 h-[3px] w-16 bg-red-600" }),
                    React.createElement("div", { className: "mt-4" },
                        brandLoading ? (React.createElement("div", { className: "text-sm text-black/60" }, "Loading brands...")) : brandOptions.length === 0 ? (React.createElement("div", { className: "text-sm text-black/60" }, "No brands found.")) : (React.createElement("div", { className: "space-y-2" }, brandOptions.map((b) => (React.createElement("label", { key: b, className: "flex items-center gap-2 text-sm text-black/80" },
                            React.createElement("input", { type: "checkbox", checked: selectedBrands.includes(b), onChange: () => toggleBrand(b) }),
                            React.createElement("span", { className: "leading-tight" }, b)))))),
                        isGpuOrMobo ? (React.createElement("div", { className: "mt-4" },
                            React.createElement("div", { className: "text-xs font-extrabold tracking-wide text-black/70" }, "PARTNER BRAND"),
                            partnerLoading ? (React.createElement("div", { className: "mt-2 text-sm text-black/60" }, "Loading partner brands...")) : (React.createElement("select", { value: partnerBrand, onChange: (e) => setPartnerBrand(e.target.value), className: "mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" },
                                React.createElement("option", { value: "" }, "All"),
                                partnerOptions.map((p) => (React.createElement("option", { key: p, value: p }, p))))),
                            React.createElement("div", { className: "mt-2 text-[11px] text-black/50" }, "GPU/Motherboard partners like MSI, Gigabyte, ASUS, etc."))) : null,
                        React.createElement("div", { className: "mt-4 flex gap-2" },
                            React.createElement("button", { type: "button", onClick: clearBrands, disabled: selectedBrands.length === 0 && !partnerBrand, className: "rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-60" }, "Clear"),
                            React.createElement("div", { className: "ml-auto text-xs text-black/50 self-center" }, selectedBrands.length > 0 ? `${selectedBrands.length} selected` : "")))),
                React.createElement("div", null,
                    React.createElement("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" }, items.map((it) => (React.createElement(ProductCard, { key: it.id, item: it, onView: () => nav(`/product/${it.id}`) })))),
                    !loading && items.length === 0 ? (React.createElement("div", { className: "mt-6 rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60" },
                        "No items found in ",
                        React.createElement("b", null, catTitle),
                        ".")) : null)))));
}
