import React, { useEffect, useMemo, useState } from "react";
// CHANGE to your real page
const FB_PAGE_URL = "https://www.facebook.com/kjktechshop";
const FB_MESSAGE_URL = "https://www.facebook.com/kjktechshop";
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
export default function HeroSlider({ slides, autoPlay = true, intervalMs = 5000, }) {
    const [index, setIndex] = useState(0);
    const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
    const active = safeSlides[index];
    function prev() {
        setIndex((i) => (i - 1 + safeSlides.length) % safeSlides.length);
    }
    function next() {
        setIndex((i) => (i + 1) % safeSlides.length);
    }
    useEffect(() => {
        if (!autoPlay || safeSlides.length <= 1)
            return;
        const t = setInterval(() => next(), intervalMs);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, intervalMs, safeSlides.length]);
    // ✅ keep index valid when slides change (important after admin edits)
    useEffect(() => {
        if (!safeSlides.length)
            return;
        setIndex((i) => clamp(i, 0, safeSlides.length - 1));
    }, [safeSlides.length]);
    if (!safeSlides.length)
        return null;
    const overlayPct = clamp(Number(active.overlay_strength ?? 35), 0, 80); // 0-80
    const overlayAlpha = overlayPct / 100;
    const align = active.align ?? "left";
    const alignClass = align === "center"
        ? "items-center justify-center text-center"
        : align === "right"
            ? "items-center justify-end text-right"
            : "items-center justify-start text-left";
    const titleColor = active.title_color && active.title_color.trim() ? active.title_color : "#FFFFFF";
    const subtitleColor = active.subtitle_color && active.subtitle_color.trim()
        ? active.subtitle_color
        : "rgba(229,231,235,0.95)";
    const noteColor = active.note_color && active.note_color.trim()
        ? active.note_color
        : "rgba(209,213,219,0.9)";
    const noteText = (active.note_text ?? "").trim() ||
        "Follow us on Facebook for promos & new arrivals.";
    const showFb = active.show_fb_buttons ?? true;
    return (React.createElement("div", { className: "relative w-full overflow-hidden bg-black" },
        React.createElement("div", { className: "relative h-[280px] sm:h-[420px] md:h-[520px]" },
            React.createElement("img", { src: active.image, alt: "", "aria-hidden": "true", className: "absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-80", loading: "lazy" }),
            React.createElement("div", { className: "absolute inset-0", style: { background: `rgba(0,0,0,${overlayAlpha})` } }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" }),
            React.createElement("img", { src: active.image, alt: active.title, className: "absolute inset-0 h-full w-full object-contain", loading: "lazy" }),
            React.createElement("div", { className: `absolute inset-0 flex ${alignClass}` },
                React.createElement("div", { className: "mx-auto w-full max-w-7xl px-4 sm:px-8" },
                    React.createElement("div", { className: "max-w-3xl" },
                        React.createElement("div", { className: "text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95] drop-shadow", style: { color: titleColor } }, active.title),
                        active.subtitle ? (React.createElement("div", { className: "mt-3 text-sm sm:text-base drop-shadow", style: { color: subtitleColor } }, active.subtitle)) : null,
                        noteText ? (React.createElement("div", { className: "mt-2 text-xs sm:text-sm drop-shadow", style: { color: noteColor } }, noteText)) : null,
                        React.createElement("div", { className: "mt-5 flex flex-wrap items-center gap-3" },
                            active.ctaText && active.ctaHref ? (React.createElement("a", { href: active.ctaHref, className: "rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700" }, active.ctaText)) : null,
                            showFb ? (React.createElement(React.Fragment, null,
                                React.createElement("a", { href: FB_MESSAGE_URL, target: "_blank", rel: "noreferrer", className: "rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15" }, "Message on Facebook"),
                                React.createElement("a", { href: FB_PAGE_URL, target: "_blank", rel: "noreferrer", className: "rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15" }, "Like our Page"))) : null)))),
            React.createElement("button", { onClick: prev, type: "button", "aria-label": "Previous slide", className: "absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25" }, "\u2039"),
            React.createElement("button", { onClick: next, type: "button", "aria-label": "Next slide", className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25" }, "\u203A"),
            React.createElement("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" }, safeSlides.map((s, i) => (React.createElement("button", { key: s.id, onClick: () => setIndex(i), type: "button", "aria-label": `Go to slide ${i + 1}`, className: [
                    "h-2.5 w-2.5 rounded-full transition",
                    i === index ? "bg-white" : "bg-white/45 hover:bg-white/70",
                ].join(" ") })))))));
}
