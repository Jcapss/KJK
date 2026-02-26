// src/data/bannersApi.ts
import { supabase } from "../lib/supabase";
export async function fetchActiveBanners() {
    const { data, error } = await supabase
        .from("hero_banners")
        .select(`
      id,title,subtitle,note_text,
      cta_text,cta_href,
      image_url,sort_order,is_active,created_at,
      overlay_strength,align,show_fb_buttons,
      title_color,subtitle_color,note_color
    `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
    if (error)
        throw error;
    return (data ?? []);
}
