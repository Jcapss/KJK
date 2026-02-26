import React from "react";
export function Badge({ children }) {
    return (React.createElement("span", { className: "inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-black/70" }, children));
}
export function PillButton({ active, children, onClick, }) {
    return (React.createElement("button", { onClick: onClick, className: [
            "rounded-full px-4 py-2 text-sm font-medium transition",
            active
                ? "bg-black text-white"
                : "bg-white text-black/80 border border-black/10 hover:bg-black/5",
        ].join(" "), type: "button" }, children));
}
