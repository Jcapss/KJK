// src/data/productsApi.ts
import { supabase } from "../lib/supabase";
import type { ProductRow } from "../types/db";

/** escape commas for .or() filters */
function escOrValue(v: string) {
  // supabase .or() uses commas to separate conditions
  return v.replaceAll(",", "\\,");
}

/** Normalize label for UI (keeps brands consistent) */
function normalizeBrandLabel(raw: string) {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return "";

  const key = s.toLowerCase();

  // common all-caps brands
  const upper = new Set([
    "amd",
    "intel",
    "nvidia",
    "msi",
    "asus",
    "acer",
    "hp",
    "dell",
    "lenovo",
    "gigabyte",
    "asrock",
    "zotac",
    "colorful",
  ]);

  if (upper.has(key)) return key.toUpperCase();

  // title case fallback
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** ✅ helper: apply category filter that supports string OR string[] */
function applyCategoryFilter<T extends ReturnType<typeof supabase.from>>(
  query: any,
  category?: string | string[]
) {
  const catArg = category;

  if (Array.isArray(catArg)) {
    const cats = catArg
      .map((c) => String(c ?? "").trim().toLowerCase())
      .filter(Boolean);
    if (cats.length) return query.in("category_slug", cats);
    return query;
  }

  const cat = String(catArg ?? "").trim().toLowerCase();
  if (cat) return query.eq("category_slug", cat);
  return query;
}

export async function fetchProducts(args?: {
  category?: string | string[]; // ✅ allow array (laptop/laptops)
  q?: string;
  brands?: string[]; // chip/general brand checkbox list
  partnerBrand?: string; // dropdown for GPU/Mobo
}): Promise<ProductRow[]> {
  let query = supabase
    .from("products")
    .select(
      "id,name,description,category_slug,brand,partner_brand,price,stock,badge,icon,image_url,images,is_active,created_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // ✅ category filter (supports array)
  query = applyCategoryFilter(query, args?.category);

  // ✅ search (keep your original behavior: name only)
  const q = args?.q?.trim();
  if (q) query = query.ilike("name", `%${q}%`);

  // ✅ Case-insensitive brand filter (your original logic)
  const brands = (args?.brands ?? [])
    .map((b) => String(b ?? "").trim())
    .filter(Boolean);

  if (brands.length > 0) {
    const orStr = brands.map((b) => `brand.ilike.${escOrValue(b)}`).join(",");
    query = query.or(orStr);
  }

  // ✅ Partner brand filter (ILIKE without % = exact match ignoring case)
  const pb = args?.partnerBrand?.trim();
  if (pb) query = query.ilike("partner_brand", pb);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as ProductRow[];
}

export async function fetchProductById(id: string): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,description,category_slug,brand,partner_brand,price,stock,badge,icon,image_url,images,is_active,created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as ProductRow | null;
}

/**
 * ✅ Get distinct chip/general brands for checkbox list (dedup case-insensitive)
 */
export async function fetchBrands(args?: {
  category?: string | string[];
}): Promise<string[]> {
  let q = supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  // ✅ category filter (supports array)
  q = applyCategoryFilter(q, args?.category);

  const { data, error } = await q;
  if (error) throw error;

  const raw = (data ?? [])
    .map((r: any) => String(r.brand ?? "").trim())
    .filter(Boolean);

  // dedupe case-insensitive; keep a nice label
  const map = new Map<string, string>();
  for (const b of raw) {
    const key = b.toLowerCase();
    if (!map.has(key)) map.set(key, normalizeBrandLabel(b));
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}

/**
 * ✅ Get distinct partner brands for dropdown (GPU/Mobo)
 */
export async function fetchPartnerBrands(args?: {
  category?: string | string[];
}): Promise<string[]> {
  let q = supabase
    .from("products")
    .select("partner_brand")
    .eq("is_active", true)
    .not("partner_brand", "is", null);

  // ✅ category filter (supports array)
  q = applyCategoryFilter(q, args?.category);

  const { data, error } = await q;
  if (error) throw error;

  const raw = (data ?? [])
    .map((r: any) => String(r.partner_brand ?? "").trim())
    .filter(Boolean);

  const map = new Map<string, string>();
  for (const b of raw) {
    const key = b.toLowerCase();
    if (!map.has(key)) map.set(key, normalizeBrandLabel(b));
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
}