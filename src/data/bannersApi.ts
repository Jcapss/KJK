// src/data/bannersApi.ts
import { supabase } from "../lib/supabase";

export type BannerAlign = "left" | "center" | "right";

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  note_text: string | null;

  cta_text: string | null;
  cta_href: string | null;

  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;

  // ✅ customization
  overlay_strength: number; // 0-80
  align: BannerAlign;
  show_fb_buttons: boolean;

  // ✅ per-text colors
  title_color: string;
  subtitle_color: string;
  note_color: string;
};

export async function fetchActiveBanners(): Promise<BannerRow[]> {
  const { data, error } = await supabase
    .from("hero_banners")
    .select(
      `
      id,title,subtitle,note_text,
      cta_text,cta_href,
      image_url,sort_order,is_active,created_at,
      overlay_strength,align,show_fb_buttons,
      title_color,subtitle_color,note_color
    `
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BannerRow[];
}