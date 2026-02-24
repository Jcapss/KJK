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

export async function fetchProducts(args?: {
  category?: string;
  q?: string;
  brands?: string[]; // chip/general brand checkbox list
  partnerBrand?: string; // ✅ NEW dropdown for GPU/Mobo
}): Promise<ProductRow[]> {
  let query = supabase
    .from("products")
    .select(
      "id,name,description,category_slug,brand,partner_brand,price,stock,badge,icon,image_url,images,is_active,created_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const cat = args?.category?.trim();
  if (cat) query = query.eq("category_slug", cat);

  const q = args?.q?.trim();
  if (q) query = query.ilike("name", `%${q}%`);

  // ✅ Case-insensitive brand filter
  const brands = (args?.brands ?? [])
    .map((b) => String(b ?? "").trim())
    .filter(Boolean);

  if (brands.length > 0) {
    // OR together: brand ILIKE 'AMD' OR brand ILIKE 'Intel'
    const orStr = brands
      .map((b) => `brand.ilike.${escOrValue(b)}`)
      .join(",");
    query = query.or(orStr);
  }

  // ✅ Partner brand filter (GPU/Mobo dropdown)
  const pb = args?.partnerBrand?.trim();
  if (pb) {
    // exact match ignoring case (ILIKE without %)
    query = query.ilike("partner_brand", pb);
  }

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
export async function fetchBrands(args?: { category?: string }): Promise<string[]> {
  let q = supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  const cat = args?.category?.trim();
  if (cat) q = q.eq("category_slug", cat);

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
 * ✅ NEW: Get distinct partner brands for dropdown (GPU/Mobo)
 */
export async function fetchPartnerBrands(args?: { category?: string }): Promise<string[]> {
  let q = supabase
    .from("products")
    .select("partner_brand")
    .eq("is_active", true)
    .not("partner_brand", "is", null);

  const cat = args?.category?.trim();
  if (cat) q = q.eq("category_slug", cat);

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
