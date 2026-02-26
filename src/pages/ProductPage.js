import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../components/HeaderBar";
import CartDrawer from "../components/CartDrawer";
import { fetchProductById } from "../data/productsApi";
const CART_KEY = "kjk_cart_v1";
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
function slugToCategoryName(slug) {
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
    const { id } = useParams();
    const [query, setQuery] = useState("");
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    // ✅ Cart
    const [cartOpen, setCartOpen] = useState(false);
    const [cart, setCart] = useState(() => safeParseCart(localStorage.getItem(CART_KEY)));
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
                if (!alive)
                    return;
                setItem(product);
            }
            catch (e) {
                if (!alive)
                    return;
                setErr(e?.message ?? "Failed to load product details");
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
    }, [id]);
    const activeCategory = useMemo(() => {
        if (!item)
            return "All";
        return slugToCategoryName(item.category_slug);
    }, [item]);
    // ✅ cart badge count (total qty)
    const cartCount = useMemo(() => cart.reduce((sum, l) => sum + (l.qty || 0), 0), [cart]);
    // ✅ itemsById for CartDrawer (just the current product + safe fallback)
    const itemsById = useMemo(() => {
        const map = {};
        if (item) {
            map[item.id] = {
                id: item.id,
                name: item.name,
                category: item.category_slug?.toLowerCase() === "services"
                    ? "Services"
                    : String(item.category_slug ?? "All"),
                price: Number(item.price ?? 0),
            };
        }
        return map;
    }, [item]);
    // ✅ cart helpers
    function addToCart(productId) {
        setCart((prev) => {
            const found = prev.find((x) => x.id === productId);
            if (found) {
                return prev.map((x) => x.id === productId ? { ...x, qty: x.qty + 1 } : x);
            }
            return [...prev, { id: productId, qty: 1 }];
        });
        setCartOpen(true);
    }
    function setQty(lineId, qty) {
        setCart((prev) => prev.map((x) => (x.id === lineId ? { ...x, qty: Math.max(1, qty) } : x)));
    }
    function removeLine(lineId) {
        setCart((prev) => prev.filter((x) => x.id !== lineId));
    }
    function clearCart() {
        setCart([]);
    }
    if (loading) {
        return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
            React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: "All", cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
            React.createElement("div", { className: "mx-auto max-w-6xl px-4 py-10 text-sm text-black/60" }, "Loading...")));
    }
    if (err) {
        return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
            React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: "All", cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
            React.createElement("div", { className: "mx-auto max-w-6xl px-4 py-10" },
                React.createElement("div", { className: "rounded-2xl border border-red-500/20 bg-white p-4 text-sm text-red-600" }, err),
                React.createElement("button", { onClick: () => nav(-1), className: "mt-4 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5", type: "button" }, "\u2190 Back"))));
    }
    if (!item) {
        return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
            React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: "All", cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
            React.createElement("div", { className: "mx-auto max-w-6xl px-4 py-10 text-sm text-black/60" }, "Product not found.")));
    }
    const price = Number(item.price);
    const isQuote = item.category_slug === "services" && price <= 0;
    return (React.createElement("div", { className: "min-h-screen bg-[#f6f7fb] text-black" },
        React.createElement(HeaderBar, { query: query, setQuery: setQuery, activeCategory: activeCategory, cartCount: cartCount, onOpenCart: () => setCartOpen(true) }),
        React.createElement(CartDrawer, { open: cartOpen, onClose: () => setCartOpen(false), itemsById: itemsById, cart: cart, setQty: setQty, removeLine: removeLine, clearCart: clearCart }),
        React.createElement("section", { className: "mx-auto max-w-6xl px-4 py-6" },
            React.createElement("div", { className: "flex items-start justify-between gap-3" },
                React.createElement("button", { onClick: () => nav(-1), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/5", type: "button" }, "\u2190 Back"),
                React.createElement("button", { onClick: () => setCartOpen(true), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5", type: "button" },
                    "View Cart (",
                    cartCount,
                    ")")),
            React.createElement("div", { className: "mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2" },
                React.createElement("div", { className: "rounded-2xl overflow-hidden border border-black/10 bg-white" },
                    React.createElement("div", { className: "aspect-[4/3] bg-white" }, item.image_url ? (React.createElement("img", { src: item.image_url, alt: item.name, className: "h-full w-full object-contain p-4", loading: "lazy" })) : (React.createElement("div", { className: "flex h-full w-full items-center justify-center text-5xl bg-black/5" }, "\uD83D\uDCE6")))),
                React.createElement("div", { className: "rounded-2xl bg-white p-6 border border-black/10" },
                    React.createElement("div", { className: "text-sm text-black/60" }, activeCategory),
                    React.createElement("div", { className: "mt-1 text-3xl font-semibold" }, item.name),
                    React.createElement("div", { className: "mt-2 text-sm text-black/60" }, item.description),
                    React.createElement("div", { className: "mt-5" },
                        React.createElement("div", { className: "text-lg font-bold" }, isQuote ? "For quotation" : `₱${price.toLocaleString()}`),
                        React.createElement("div", { className: [
                                "mt-2 text-xs font-semibold uppercase tracking-wide",
                                item.category_slug === "services"
                                    ? "text-black/50"
                                    : item.stock > 0
                                        ? "text-black/50"
                                        : "text-green-600",
                            ].join(" ") }, item.category_slug === "services"
                            ? "Service"
                            : item.stock > 0
                                ? `In Stock (${item.stock})`
                                : "AVAILABLE"),
                        React.createElement("button", { onClick: () => addToCart(item.id), className: "mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90", type: "button" }, "Add to Cart"),
                        React.createElement("div", { className: "mt-2 text-xs text-black/50" }, "This adds the item to your quotation cart (no account needed).")))))));
}
