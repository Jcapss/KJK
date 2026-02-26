import React from "react";
import { Badge } from "./ui";
export default function ProductCard({ item, onView, }) {
    const isServiceQuote = item.category_slug === "services" && Number(item.price) === 0;
    const categoryName = item.category_slug === "cpu"
        ? "CPU"
        : item.category_slug === "gpu"
            ? "GPU"
            : item.category_slug.charAt(0).toUpperCase() + item.category_slug.slice(1);
    return (React.createElement("button", { type: "button", onClick: () => onView(item.id), className: "block w-full h-full text-left" },
        React.createElement("div", { className: "h-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md flex flex-col" },
            React.createElement("div", { className: "relative border-b border-black/10 bg-white h-56" },
                item.image_url ? (React.createElement("img", { src: item.image_url, alt: item.name, className: "absolute inset-0 h-full w-full object-contain p-3 bg-white", loading: "lazy" })) : (React.createElement("div", { className: "h-full w-full grid place-items-center bg-gradient-to-br from-black/5 to-black/10 text-6xl" }, item.icon ?? "📦")),
                item.badge ? (React.createElement("div", { className: "absolute top-3 right-3" },
                    React.createElement(Badge, null, item.badge))) : null),
            React.createElement("div", { className: "p-4 flex flex-col flex-1" },
                React.createElement("div", { className: "min-h-[56px]" },
                    React.createElement("div", { className: "text-base font-semibold text-black line-clamp-2" }, item.name),
                    React.createElement("div", { className: "mt-1 text-sm text-black/60 line-clamp-2" }, item.description)),
                React.createElement("div", { className: "mt-auto pt-4 flex items-end justify-between gap-3" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "text-sm text-black/60" }, categoryName),
                        React.createElement("div", { className: "text-lg font-bold" }, isServiceQuote
                            ? "For quotation"
                            : `₱${Number(item.price).toLocaleString()}`),
                        item.category_slug === "services" ? (React.createElement("div", { className: "text-xs text-black/50" }, "Service")) : null),
                    React.createElement("span", { className: "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white whitespace-nowrap" }, "View Details"))))));
}
