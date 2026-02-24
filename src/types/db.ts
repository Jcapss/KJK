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

  // ✅ NEW: Partner brand (MSI/Gigabyte/ASUS...) for GPU/Motherboard
  partner_brand?: string | null;

  badge?: string | null;
  icon?: string | null;

  // main thumbnail
  image_url?: string | null;

  // ✅ NEW: gallery images
  images?: string[] | null;

  is_active?: boolean;
  created_at?: string;
};
