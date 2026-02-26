import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories } from "../data/categoriesApi";
// optional: fallback banners for old categories without DB images
const IMAGE_BY_SLUG = {
    laptops: "/banners/laptop.jpg",
    storage: "/banners/ssd.jpg",
    monitor: "/banners/monitor.jpg",
    gpu: "/banners/gpu.jpg",
    motherboard: "/banners/motherboard.jpg",
    services: "/banners/cctv.jpg",
    cpu: "/banners/cpu.jpg",
};
const FALLBACK_IMAGE = "/banners/banner1.jpg";
export default function BrowseCategories() {
    const nav = useNavigate();
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchCategories();
                if (!alive)
                    return;
                setCats(data);
            }
            catch {
                if (!alive)
                    return;
                setCats([]);
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
    }, []);
    return (React.createElement("section", { className: "mx-auto max-w-7xl px-4 py-10" },
        React.createElement("div", { className: "mb-6" },
            React.createElement("div", { className: "text-2xl font-extrabold tracking-wide text-red-600" }, "BROWSE CATEGORIES"),
            React.createElement("div", { className: "mt-2 h-[2px] w-full bg-black/10" }),
            React.createElement("div", { className: "mt-1 h-[3px] w-[220px] bg-red-600" })),
        loading ? (React.createElement("div", { className: "text-sm text-black/60" }, "Loading categories...")) : cats.length === 0 ? (React.createElement("div", { className: "text-sm text-black/60" }, "No categories found.")) : (React.createElement("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" }, cats.map((c) => {
            const slug = c.slug;
            // ✅ priority:
            // 1) image_url from DB
            // 2) legacy slug banner mapping
            // 3) fallback image
            const img = c.image_url || IMAGE_BY_SLUG[slug] || FALLBACK_IMAGE;
            return (React.createElement("button", { key: c.id, type: "button", onClick: () => nav(`/category/${encodeURIComponent(slug)}`), className: "group relative overflow-hidden rounded-none border border-black/10 bg-black shadow-sm text-left", style: { aspectRatio: "16 / 10" } },
                React.createElement("img", { src: img, alt: c.label, className: "absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" }),
                React.createElement("div", { className: "absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" }),
                React.createElement("div", { className: "absolute bottom-4 left-4" },
                    React.createElement("span", { className: "inline-block bg-red-600 px-4 py-2 text-xs font-extrabold tracking-wide text-white" }, c.label.toUpperCase()))));
        })))));
}
