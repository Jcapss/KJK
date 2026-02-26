// src/components/CartDrawer.tsx
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
function moneyPHP(n) {
    const num = Number(n || 0);
    return `PHP ${num.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
export default function CartDrawer({ open, onClose, itemsById, cart, setQty, removeLine, clearCart, }) {
    // keep items nullable to avoid crashes
    const lines = cart.map((l) => ({ ...l, item: itemsById[l.id] }));
    const quoteCount = lines.filter((l) => {
        const item = l.item;
        const category = String(item?.category ?? "");
        const priceNum = Number(item?.price ?? 0);
        return category === "Services" && priceNum === 0;
    }).length;
    const subtotal = lines.reduce((sum, l) => {
        const item = l.item;
        const category = String(item?.category ?? "");
        const priceNum = Number(item?.price ?? 0);
        const isQuote = category === "Services" && priceNum === 0;
        const price = isQuote ? 0 : priceNum;
        return sum + price * (l.qty || 1);
    }, 0);
    function handleExportPdf() {
        if (lines.length === 0)
            return;
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const now = new Date();
        const dateStr = now.toLocaleString("en-PH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("KJK TechShop", 40, 52);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Quotation / Product List", 40, 72);
        doc.setFontSize(10);
        doc.text(`Generated: ${dateStr}`, 40, 92);
        doc.setFont("helvetica", "bold");
        doc.text(`Items: ${lines.length}`, 410, 92);
        doc.text(`Quote requests: ${quoteCount}`, 410, 108);
        // Table rows
        const body = lines.map((l) => {
            const item = l.item;
            const name = item?.name ?? `Item (${l.id})`;
            const category = String(item?.category ?? "Unknown");
            const priceNum = Number(item?.price ?? 0);
            const qty = Number(l.qty || 1);
            const isQuote = category === "Services" && priceNum === 0;
            const priceText = isQuote ? "For quotation" : moneyPHP(priceNum);
            const totalText = isQuote || !item ? "—" : moneyPHP(priceNum * qty);
            return [name, category.toUpperCase(), String(qty), priceText, totalText];
        });
        autoTable(doc, {
            startY: 130,
            head: [["Item", "Category", "Qty", "Price", "Total"]],
            body,
            styles: {
                font: "helvetica",
                fontSize: 10,
                cellPadding: 7,
                lineColor: [230, 230, 230],
                lineWidth: 0.5,
            },
            headStyles: {
                fillColor: [0, 0, 0],
                textColor: 255,
                fontStyle: "bold",
            },
            columnStyles: {
                2: { halign: "center", cellWidth: 55 },
                3: { halign: "right", cellWidth: 120 },
                4: { halign: "right", cellWidth: 120 },
            },
            alternateRowStyles: { fillColor: [247, 247, 247] },
            margin: { left: 40, right: 40 },
        });
        const finalY = doc.lastAutoTable?.finalY ?? 130;
        // Subtotal
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Subtotal:", 40, finalY + 28);
        doc.text(moneyPHP(subtotal), 520, finalY + 28, { align: "right" });
        // Note
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Note: Items marked “For quotation” require confirmation. Prices may change depending on availability.", 40, finalY + 48, { maxWidth: 515 });
        // Download
        const fileName = `KJK_Quotation_${now.toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
    }
    return (React.createElement("div", { className: open ? "fixed inset-0 z-50" : "hidden" },
        React.createElement("div", { className: "absolute inset-0 bg-black/40", onClick: onClose }),
        React.createElement("div", { className: "absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" },
            React.createElement("div", { className: "flex items-center justify-between border-b border-black/10 p-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-lg font-bold" }, "Quotation Cart"),
                    React.createElement("div", { className: "text-xs text-black/60" },
                        lines.length,
                        " item(s)",
                        quoteCount ? ` • ${quoteCount} quote request(s)` : "")),
                React.createElement("button", { className: "rounded-lg border border-black/10 px-3 py-1 text-sm hover:bg-black/5", onClick: onClose, type: "button" }, "Close")),
            React.createElement("div", { className: "h-[calc(100%-220px)] overflow-auto p-4" }, lines.length === 0 ? (React.createElement("div", { className: "rounded-xl border border-black/10 bg-black/5 p-4 text-sm text-black/60" }, "Your cart is empty. Add items to begin.")) : (React.createElement("div", { className: "space-y-3" }, lines.map((l) => {
                const item = l.item;
                const name = item?.name ?? `Item (${l.id})`;
                const category = String(item?.category ?? "Loading...");
                const priceNum = Number(item?.price ?? 0);
                const isQuote = category === "Services" && priceNum === 0;
                return (React.createElement("div", { key: l.id, className: "rounded-xl border border-black/10 p-3" },
                    React.createElement("div", { className: "flex items-start justify-between gap-3" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "font-semibold" }, name),
                            React.createElement("div", { className: "text-xs text-black/60" },
                                category,
                                " \u2022 ",
                                isQuote ? "For quotation" : moneyPHP(priceNum))),
                        React.createElement("button", { className: "text-xs text-black/60 hover:text-black", onClick: () => removeLine(l.id), type: "button" }, "Remove")),
                    React.createElement("div", { className: "mt-3 flex items-center justify-between" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("button", { className: "h-8 w-8 rounded-lg border border-black/10 hover:bg-black/5", onClick: () => setQty(l.id, Math.max(1, l.qty - 1)), type: "button" }, "\u2212"),
                            React.createElement("div", { className: "min-w-8 text-center text-sm font-semibold" }, l.qty),
                            React.createElement("button", { className: "h-8 w-8 rounded-lg border border-black/10 hover:bg-black/5", onClick: () => setQty(l.id, l.qty + 1), type: "button" }, "+")),
                        React.createElement("div", { className: "text-sm font-bold" }, isQuote || !item ? "—" : moneyPHP(priceNum * l.qty)))));
            })))),
            React.createElement("div", { className: "border-t border-black/10 p-4" },
                React.createElement("div", { className: "flex items-center justify-between text-sm" },
                    React.createElement("span", { className: "text-black/70" }, "Subtotal"),
                    React.createElement("span", { className: "font-bold" }, moneyPHP(subtotal))),
                React.createElement("div", { className: "mt-3 grid gap-2" },
                    React.createElement("button", { type: "button", onClick: handleExportPdf, disabled: lines.length === 0, className: "rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" }, "Export to PDF (Download)"),
                    React.createElement("button", { type: "button", onClick: () => {
                            if (lines.length === 0)
                                return;
                            const ok = confirm("Clear all items in the cart?");
                            if (!ok)
                                return;
                            clearCart();
                        }, disabled: lines.length === 0, className: "rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50" }, "Clear Cart"),
                    React.createElement("div", { className: "text-xs text-black/50" }, "Tip: This downloads a PDF file directly (no printing)."))))));
}
