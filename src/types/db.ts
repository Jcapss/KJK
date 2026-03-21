// src/types/db.ts

export type CategorySlug = string;
export type ServiceType = "solar" | "cctv" | "other" | string;

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

  brand?: string | null;
  partner_brand?: string | null;

  badge?: string | null;
  icon?: string | null;

  image_url?: string | null;
  images?: string[] | null;

  kw_size?: number | null;
  system_type?: string | null;
  includes?: string | null;
  quotation_pdf?: string | null;

  // ✅ NEW
  service_type?: ServiceType | null;

  is_active?: boolean;
  created_at?: string;
};