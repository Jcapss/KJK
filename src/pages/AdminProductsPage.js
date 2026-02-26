// src/pages/AdminProductsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [search, setSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);
    const navigate = useNavigate();
    async function fetchProducts() {
        setErr(null);
        setLoading(true);
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) {
            setErr(error.message);
            setProducts([]);
        }
        else {
            setProducts((data ?? []));
        }
        setLoading(false);
    }
    useEffect(() => {
        fetchProducts();
    }, []);
    function handleEditProduct(productId) {
        navigate(`/admin/products/${productId}`);
    }
    async function handleDeleteProduct(productId) {
        const ok = confirm("Delete this product?");
        if (!ok)
            return;
        setDeletingId(productId);
        const { error } = await supabase.from("products").delete().eq("id", productId);
        setDeletingId(null);
        if (error) {
            alert(error.message);
            return;
        }
        fetchProducts();
    }
    const filteredProducts = useMemo(() => {
        let list = products;
        if (activeOnly)
            list = list.filter((p) => p.is_active);
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter((p) => {
                const hay = `${p.name} ${p.description} ${p.category_slug}`.toLowerCase();
                return hay.includes(q);
            });
        }
        return list;
    }, [products, search, activeOnly]);
    function priceLabel(v) {
        const n = Number(v ?? 0);
        return `₱${Number.isFinite(n) ? n.toLocaleString() : "0"}`;
    }
    return (React.createElement(AdminLayout, null,
        React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" },
            React.createElement("div", null,
                React.createElement("div", { className: "text-2xl font-black" }, "Products"),
                React.createElement("div", { className: "text-sm text-black/60" }, "Add, edit, and delete products.")),
            React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("button", { onClick: fetchProducts, className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5", type: "button" }, "Refresh"),
                React.createElement("button", { onClick: () => navigate("/admin/products/new"), className: "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90", type: "button" }, "+ Add Product"))),
        React.createElement("div", { className: "mt-4 flex flex-wrap items-center gap-3" },
            React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search name / category / description...", className: "w-full sm:w-[360px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" }),
            React.createElement("label", { className: "inline-flex items-center gap-2 text-sm text-black/70" },
                React.createElement("input", { type: "checkbox", checked: activeOnly, onChange: (e) => setActiveOnly(e.target.checked) }),
                "Active only"),
            React.createElement("div", { className: "text-sm text-black/50" }, loading ? "Loading..." : `Showing ${filteredProducts.length} item(s)`)),
        err ? (React.createElement("div", { className: "mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700" }, err)) : null,
        React.createElement("div", { className: "mt-5 grid gap-3 md:hidden" }, loading ? (React.createElement("div", { className: "rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60" }, "Loading products...")) : filteredProducts.length === 0 ? (React.createElement("div", { className: "rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60" }, "No products found.")) : (filteredProducts.map((p) => (React.createElement("div", { key: p.id, className: "rounded-2xl border border-black/10 bg-white p-4" },
            React.createElement("div", { className: "flex items-start gap-3" },
                React.createElement("div", { className: "h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/5" }, p.image_url ? (React.createElement("img", { src: p.image_url, alt: p.name, className: "h-full w-full object-cover" })) : (React.createElement("div", { className: "grid h-full w-full place-items-center text-xl" }, "\uD83D\uDCE6"))),
                React.createElement("div", { className: "min-w-0 flex-1" },
                    React.createElement("div", { className: "flex items-start justify-between gap-2" },
                        React.createElement("div", { className: "min-w-0" },
                            React.createElement("div", { className: "font-semibold leading-tight" }, p.name),
                            React.createElement("div", { className: "mt-1 text-xs text-black/60 line-clamp-2" }, p.description)),
                        React.createElement("span", { className: [
                                "shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                p.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600",
                            ].join(" ") }, p.is_active ? "Active" : "Inactive")),
                    React.createElement("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-sm" },
                        React.createElement("span", { className: "rounded-xl bg-black/5 px-3 py-1 text-xs font-semibold text-black/70" }, String(p.category_slug)),
                        React.createElement("span", { className: "font-semibold" }, priceLabel(p.price)),
                        React.createElement("span", { className: "text-black/60" },
                            "Stock: ",
                            p.stock ?? 0)),
                    React.createElement("div", { className: "mt-3 flex flex-wrap gap-2" },
                        React.createElement("button", { onClick: () => handleEditProduct(p.id), className: "rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5", type: "button" }, "Edit"),
                        React.createElement("button", { disabled: deletingId === p.id, onClick: () => handleDeleteProduct(p.id), className: "rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60", type: "button" }, deletingId === p.id ? "Deleting..." : "Delete"))))))))),
        React.createElement("div", { className: "mt-5 hidden md:block overflow-hidden rounded-2xl border border-black/10 bg-white" },
            React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "w-full text-left text-sm" },
                    React.createElement("thead", { className: "bg-black/5 text-xs uppercase text-black/60" },
                        React.createElement("tr", null,
                            React.createElement("th", { className: "px-4 py-3" }, "Product"),
                            React.createElement("th", { className: "px-4 py-3" }, "Category"),
                            React.createElement("th", { className: "px-4 py-3" }, "Price"),
                            React.createElement("th", { className: "px-4 py-3" }, "Stock"),
                            React.createElement("th", { className: "px-4 py-3" }, "Status"),
                            React.createElement("th", { className: "px-4 py-3" }, "Actions"))),
                    React.createElement("tbody", null, loading ? (React.createElement("tr", null,
                        React.createElement("td", { className: "px-4 py-6 text-black/60", colSpan: 6 }, "Loading products..."))) : filteredProducts.length === 0 ? (React.createElement("tr", null,
                        React.createElement("td", { className: "px-4 py-6 text-black/60", colSpan: 6 }, "No products found."))) : (filteredProducts.map((p) => (React.createElement("tr", { key: p.id, className: "border-t border-black/10" },
                        React.createElement("td", { className: "px-4 py-3" },
                            React.createElement("div", { className: "flex items-center gap-3" },
                                React.createElement("div", { className: "grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-black/5" }, p.image_url ? (React.createElement("img", { src: p.image_url, alt: p.name, className: "h-full w-full object-cover" })) : (React.createElement("span", { className: "text-lg" }, "\uD83D\uDCE6"))),
                                React.createElement("div", { className: "min-w-0" },
                                    React.createElement("div", { className: "font-semibold" }, p.name),
                                    React.createElement("div", { className: "truncate text-xs text-black/60 max-w-[340px]" }, p.description)))),
                        React.createElement("td", { className: "px-4 py-3 text-black/70" }, p.category_slug),
                        React.createElement("td", { className: "px-4 py-3 font-semibold" }, priceLabel(p.price)),
                        React.createElement("td", { className: "px-4 py-3" }, p.stock ?? 0),
                        React.createElement("td", { className: "px-4 py-3" },
                            React.createElement("span", { className: [
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                    p.is_active
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600",
                                ].join(" ") }, p.is_active ? "Active" : "Inactive")),
                        React.createElement("td", { className: "px-4 py-3" },
                            React.createElement("div", { className: "flex flex-wrap gap-2" },
                                React.createElement("button", { onClick: () => handleEditProduct(p.id), className: "rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5", type: "button" }, "Edit"),
                                React.createElement("button", { disabled: deletingId === p.id, onClick: () => handleDeleteProduct(p.id), className: "rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60", type: "button" }, deletingId === p.id ? "Deleting..." : "Delete"))))))))))),
        React.createElement("div", { className: "mt-4 text-xs text-black/50" },
            "Tip: If you see empty products here but you have data, check RLS policies for",
            " ",
            React.createElement("b", null, "SELECT"),
            " on ",
            React.createElement("b", null, "products"),
            ".")));
}
