// src/data/adminBannersApi.ts
import { supabase } from "../lib/supabase";
import type { BannerRow, BannerAlign } from "./bannersApi";

export async function adminListBanners(): Promise<BannerRow[]> {
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
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BannerRow[];
}

export async function adminCreateBanner(payload: {
  title: string;
  subtitle?: string | null;
  note_text?: string | null;

  cta_text?: string | null;
  cta_href?: string | null;

  image_url: string;
  sort_order: number;
  is_active: boolean;

  overlay_strength?: number;
  align?: BannerAlign;
  show_fb_buttons?: boolean;

  title_color?: string;
  subtitle_color?: string;
  note_color?: string;
}): Promise<BannerRow> {
  const { data, error } = await supabase
    .from("hero_banners")
    .insert([
      {
        ...payload,
      },
    ])
    .select(
      `
      id,title,subtitle,note_text,
      cta_text,cta_href,
      image_url,sort_order,is_active,created_at,
      overlay_strength,align,show_fb_buttons,
      title_color,subtitle_color,note_color
    `
    )
    .single();

  if (error) throw error;
  return data as BannerRow;
}

export async function adminUpdateBanner(
  id: string,
  patch: Partial<{
    title: string;
    subtitle: string | null;
    note_text: string | null;

    cta_text: string | null;
    cta_href: string | null;

    image_url: string;
    sort_order: number;
    is_active: boolean;

    overlay_strength: number;
    align: BannerAlign;
    show_fb_buttons: boolean;

    title_color: string;
    subtitle_color: string;
    note_color: string;
  }>
): Promise<void> {
  const { error } = await supabase.from("hero_banners").update(patch).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from("hero_banners").delete().eq("id", id);
  if (error) throw error;
}