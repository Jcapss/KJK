import { supabase } from "../lib/supabase"; // change if needed
import type { BannerRow } from "./bannersApi";

export type BannerInsert = {
  title: string;
  subtitle?: string | null;
  cta_text?: string | null;
  cta_href?: string | null;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function adminListBanners(): Promise<BannerRow[]> {
  const { data, error } = await supabase
    .from("hero_banners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBanner(payload: BannerInsert) {
  const { data, error } = await supabase
    .from("hero_banners")
    .insert({
      title: payload.title,
      subtitle: payload.subtitle ?? null,
      cta_text: payload.cta_text ?? null,
      cta_href: payload.cta_href ?? null,
      image_url: payload.image_url,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateBanner(id: string, patch: Partial<BannerInsert>) {
  const { data, error } = await supabase
    .from("hero_banners")
    .update({
      ...patch,
      subtitle: patch.subtitle ?? undefined,
      cta_text: patch.cta_text ?? undefined,
      cta_href: patch.cta_href ?? undefined,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function adminDeleteBanner(id: string) {
  const { error } = await supabase.from("hero_banners").delete().eq("id", id);
  if (error) throw error;
}