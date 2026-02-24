import { supabase } from "../lib/supabase"; // change if your file path differs

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_href: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

export async function fetchActiveBanners(): Promise<BannerRow[]> {
  const { data, error } = await supabase
    .from("hero_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}