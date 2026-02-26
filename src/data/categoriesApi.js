// src/data/categoriesApi.ts
import { supabase } from "../lib/supabase";
export async function fetchCategories() {
    const { data, error } = await supabase
        .from("product_categories")
        .select("id, slug, label, image_url, is_active")
        .eq("is_active", true)
        .order("label", { ascending: true });
    if (error)
        throw new Error(error.message);
    return (data ?? []);
}
