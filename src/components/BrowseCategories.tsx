import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories, type CategoryDbRow } from "../data/categoriesApi";

// optional: fallback banners for old categories without DB images
const IMAGE_BY_SLUG: Record<string, string> = {
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

  const [cats, setCats] = useState<CategoryDbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        if (!alive) return;
        setCats(data);
      } catch {
        if (!alive) return;
        setCats([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <div className="text-2xl font-extrabold tracking-wide text-red-600">
          BROWSE CATEGORIES
        </div>
        <div className="mt-2 h-[2px] w-full bg-black/10" />
        <div className="mt-1 h-[3px] w-[220px] bg-red-600" />
      </div>

      {loading ? (
        <div className="text-sm text-black/60">Loading categories...</div>
      ) : cats.length === 0 ? (
        <div className="text-sm text-black/60">No categories found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const slug = c.slug;

            // ✅ priority:
            // 1) image_url from DB
            // 2) legacy slug banner mapping
            // 3) fallback image
            const img = c.image_url || IMAGE_BY_SLUG[slug] || FALLBACK_IMAGE;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => nav(`/category/${encodeURIComponent(slug)}`)}
                className="group relative overflow-hidden rounded-none border border-black/10 bg-black shadow-sm text-left"
                style={{ aspectRatio: "16 / 10" }}
              >
                <img
                  src={img}
                  alt={c.label}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                <div className="absolute bottom-4 left-4">
                  <span className="inline-block bg-red-600 px-4 py-2 text-xs font-extrabold tracking-wide text-white">
                    {c.label.toUpperCase()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
