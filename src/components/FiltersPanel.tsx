import { CATEGORIES } from "../data/catalog";
import { PillButton } from "./ui";
import React from 'react';

export default function FiltersPanel({
  activeCat,
  setActiveCat,
  query,
  setQuery,
  sort,
  setSort,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}: {
  activeCat: (typeof CATEGORIES)[number];
  setActiveCat: (c: (typeof CATEGORIES)[number]) => void;

  query: string;
  setQuery: (v: string) => void;

  sort: "featured" | "price_asc" | "price_desc";
  setSort: (v: "featured" | "price_asc" | "price_desc") => void;

  minPrice: string;
  setMinPrice: (v: string) => void;

  maxPrice: string;
  setMaxPrice: (v: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-sm font-extrabold">Filter Products</div>

      <div className="mt-3">
        <label className="text-xs font-semibold text-black/60">Search</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GPU, laptop, CCTV..."
          className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-black/60">Categories</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <PillButton key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>
              {c}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-black/60">Price Range</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            inputMode="numeric"
            placeholder="Min ₱"
            className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            inputMode="numeric"
            placeholder="Max ₱"
            className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-1 text-[11px] text-black/45">
          Tip: services with “For quotation” are excluded from price filtering.
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-black/60">Sort</div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
        >
          <option value="featured">Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <button
        onClick={() => {
          setQuery("");
          setActiveCat("All");
          setMinPrice("");
          setMaxPrice("");
          setSort("featured");
        }}
        className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5"
        type="button"
      >
        Reset Filters
      </button>
    </div>
  );
}
