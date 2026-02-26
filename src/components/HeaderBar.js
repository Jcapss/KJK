// src/components/HeaderBar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCategories } from "../data/categoriesApi";
export default function HeaderBar({ query, setQuery, activeCategory = "all", // slug or "all"
cartCount = 0, onOpenCart, }) {
    const nav = useNavigate();
    const location = useLocation();
    const [cats, setCats] = useState([]);
    const [catsLoading, setCatsLoading] = useState(false);
    async function loadCategories() {
        setCatsLoading(true);
        try {
            const data = await fetchCategories();
            setCats(data);
        }
        catch {
            setCats([]);
        }
        finally {
            setCatsLoading(false);
        }
    }
    useEffect(() => {
        loadCategories();
    }, []);
    // ✅ auto-refresh categories when admin updates
    useEffect(() => {
        const refetch = () => loadCategories();
        window.addEventListener("kjk:categories-updated", refetch);
        const onStorage = (e) => {
            if (e.key === "kjk_categories_refresh_v1")
                refetch();
        };
        window.addEventListener("storage", onStorage);
        let bc = null;
        try {
            bc = new BroadcastChannel("kjk_categories_channel_v1");
            bc.onmessage = (msg) => {
                if (msg?.data?.type === "CATEGORIES_UPDATED")
                    refetch();
            };
        }
        catch { }
        return () => {
            window.removeEventListener("kjk:categories-updated", refetch);
            window.removeEventListener("storage", onStorage);
            try {
                bc?.close();
            }
            catch { }
        };
    }, []);
    const options = useMemo(() => {
        const base = [{ value: "all", label: "All" }];
        const fromDb = cats.map((c) => ({
            value: c.slug,
            label: c.label,
        }));
        return base.concat(fromDb);
    }, [cats]);
    function goToCategory(value) {
        if (value === "all")
            nav("/");
        else
            nav(`/category/${encodeURIComponent(value)}`);
    }
    function scrollToFooter() {
        if (location.pathname !== "/") {
            nav("/");
            setTimeout(() => {
                document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
            }, 50);
            return;
        }
        document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
    }
    return (React.createElement("header", { className: "sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur" },
        React.createElement("div", { className: "mx-auto max-w-7xl px-4 py-3" },
            React.createElement("div", { className: "hidden lg:flex items-center gap-3" },
                React.createElement("button", { type: "button", onClick: () => nav("/"), className: "flex items-center gap-3 text-left shrink-0", "aria-label": "Go to home" },
                    React.createElement("div", { className: "h-11 w-11 rounded-2xl bg-black text-white grid place-items-center font-black" }, "K"),
                    React.createElement("div", { className: "leading-tight" },
                        React.createElement("div", { className: "text-sm font-extrabold tracking-tight" }, "KJK TechShop"),
                        React.createElement("div", { className: "text-xs text-black/60" }, "Parts \u2022 Laptops \u2022 CCTV \u2022 Services"))),
                React.createElement("div", { className: "flex-1" }),
                React.createElement("select", { value: activeCategory, onChange: (e) => goToCategory(e.target.value), className: "shrink-0 w-[240px] rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-medium outline-none hover:bg-black/5", "aria-label": "Choose category" },
                    catsLoading ? React.createElement("option", { value: "all" }, "Loading\u2026") : null,
                    options.map((o) => (React.createElement("option", { key: o.value, value: o.value }, o.label)))),
                React.createElement("button", { onClick: () => onOpenCart?.(), type: "button", className: "relative shrink-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5", "aria-label": "Open cart", title: "Cart" },
                    "Cart",
                    cartCount > 0 ? (React.createElement("span", { className: "absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[11px] font-bold text-white" }, cartCount > 99 ? "99+" : cartCount)) : null),
                React.createElement("button", { onClick: scrollToFooter, type: "button", className: "shrink-0 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap" }, "Contact")),
            React.createElement("div", { className: "lg:hidden" },
                React.createElement("div", { className: "flex items-center justify-between gap-2" },
                    React.createElement("button", { type: "button", onClick: () => nav("/"), className: "flex items-center gap-2 text-left", "aria-label": "Go to home" },
                        React.createElement("div", { className: "h-9 w-9 rounded-2xl bg-black text-white grid place-items-center font-black text-sm" }, "K"),
                        React.createElement("div", { className: "leading-tight" },
                            React.createElement("div", { className: "text-[13px] font-extrabold tracking-tight" }, "KJK TechShop"))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement("button", { onClick: () => onOpenCart?.(), type: "button", className: "relative inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5", "aria-label": "Open cart", title: "Cart" },
                            "\uD83D\uDED2",
                            cartCount > 0 ? (React.createElement("span", { className: "absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-black px-1 text-[10px] font-bold text-white" }, cartCount > 99 ? "99+" : cartCount)) : null))),
                React.createElement("div", { className: "mt-2 flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3" },
                    React.createElement("span", { className: "text-black/35 text-sm" }, "\uD83D\uDD0E"),
                    React.createElement("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search GPU, laptop, CCTV\u2026", className: "w-full bg-transparent py-2 text-[13px] outline-none" })),
                React.createElement("div", { className: "mt-2 grid grid-cols-2 gap-2" },
                    React.createElement("select", { value: activeCategory, onChange: (e) => goToCategory(e.target.value), className: "w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-[13px] outline-none hover:bg-black/5", "aria-label": "Choose category" },
                        catsLoading ? React.createElement("option", { value: "all" }, "Loading\u2026") : null,
                        options.map((o) => (React.createElement("option", { key: o.value, value: o.value }, o.label)))),
                    React.createElement("button", { onClick: scrollToFooter, type: "button", className: "w-full rounded-2xl bg-black px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90" }, "Contact"))))));
}
