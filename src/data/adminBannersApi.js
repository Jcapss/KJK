// src/data/adminBannersApi.ts
import { supabase } from "../lib/supabase";
export async function adminListBanners() {
    const { data, error } = await supabase
        .from("hero_banners")
        .select(`
      id,title,subtitle,note_text,
      cta_text,cta_href,
      image_url,sort_order,is_active,created_at,
      overlay_strength,align,show_fb_buttons,
      title_color,subtitle_color,note_color
    `)
        .order("sort_order", { ascending: true });
    if (error)
        throw error;
    return (data ?? []);
}
export async function adminCreateBanner(payload) {
    const { data, error } = await supabase
        .from("hero_banners")
        .insert([
        {
            ...payload,
        },
    ])
        .select(`
      id,title,subtitle,note_text,
      cta_text,cta_href,
      image_url,sort_order,is_active,created_at,
      overlay_strength,align,show_fb_buttons,
      title_color,subtitle_color,note_color
    `)
        .single();
    if (error)
        throw error;
    return data;
}
export async function adminUpdateBanner(id, patch) {
    const { error } = await supabase.from("hero_banners").update(patch).eq("id", id);
    if (error)
        throw error;
}
export async function adminDeleteBanner(id) {
    const { error } = await supabase.from("hero_banners").delete().eq("id", id);
    if (error)
        throw error;
}
