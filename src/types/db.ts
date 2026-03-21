// src/types/db.ts

export type CategorySlug = string;

export type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type ProductRow = {
  id: string;
  name: string;
  description: string;

  category_slug: CategorySlug;

  price: number;
  stock: number;

  // chip brand (AMD/NVIDIA/Intel) OR general brand (for simple categories)
  brand?: string | null;

  // partner brand / manufacturer
  partner_brand?: string | null;

  badge?: string | null;
  icon?: string | null;

  // main thumbnail
  image_url?: string | null;

  // gallery images
  images?: string[] | null;

  // ✅ SOLAR FIELDS
  kw_size?: number | null;          // 3, 5, 8, 10, etc.
  system_type?: string | null;      // On-Grid / Hybrid / Off-Grid
  includes?: string | null;         // package inclusions summary
  quotation_pdf?: string | null;    // uploaded quotation PDF URL

  is_active?: boolean;
  created_at?: string;
};