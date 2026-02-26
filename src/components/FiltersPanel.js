import { CATEGORIES } from "../data/catalog";
import { PillButton } from "./ui";
import React from 'react';
export default function FiltersPanel({ activeCat, setActiveCat, query, setQuery, sort, setSort, minPrice, setMinPrice, maxPrice, setMaxPrice, }) {
    return (React.createElement("div", { className: "rounded-3xl border border-black/10 bg-white p-4 shadow-sm" },
        React.createElement("div", { className: "text-sm font-extrabold" }, "Filter Products"),
        React.createElement("div", { className: "mt-3" },
            React.createElement("label", { className: "text-xs font-semibold text-black/60" }, "Search"),
            React.createElement("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search GPU, laptop, CCTV...", className: "mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10" })),
        React.createElement("div", { className: "mt-4" },
            React.createElement("div", { className: "text-xs font-semibold text-black/60" }, "Categories"),
            React.createElement("div", { className: "mt-2 flex flex-wrap gap-2" }, CATEGORIES.map((c) => (React.createElement(PillButton, { key: c, active: activeCat === c, onClick: () => setActiveCat(c) }, c))))),
        React.createElement("div", { className: "mt-4" },
            React.createElement("div", { className: "text-xs font-semibold text-black/60" }, "Price Range"),
            React.createElement("div", { className: "mt-2 grid grid-cols-2 gap-2" },
                React.createElement("input", { value: minPrice, onChange: (e) => setMinPrice(e.target.value), inputMode: "numeric", placeholder: "Min \u20B1", className: "w-full rounded-2xl border border-black/10 px-3 py-2 text-sm" }),
                React.createElement("input", { value: maxPrice, onChange: (e) => setMaxPrice(e.target.value), inputMode: "numeric", placeholder: "Max \u20B1", className: "w-full rounded-2xl border border-black/10 px-3 py-2 text-sm" })),
            React.createElement("div", { className: "mt-1 text-[11px] text-black/45" }, "Tip: services with \u201CFor quotation\u201D are excluded from price filtering.")),
        React.createElement("div", { className: "mt-4" },
            React.createElement("div", { className: "text-xs font-semibold text-black/60" }, "Sort"),
            React.createElement("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm" },
                React.createElement("option", { value: "featured" }, "Featured"),
                React.createElement("option", { value: "price_asc" }, "Price: Low to High"),
                React.createElement("option", { value: "price_desc" }, "Price: High to Low"))),
        React.createElement("button", { onClick: () => {
                setQuery("");
                setActiveCat("All");
                setMinPrice("");
                setMaxPrice("");
                setSort("featured");
            }, className: "mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5", type: "button" }, "Reset Filters")));
}
