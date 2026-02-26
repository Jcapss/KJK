// src/data/categoriesApi.ts
import { supabase } from "../lib/supabase";

export type CategoryDbRow = {
  id: string;
  slug: string;
  label: string;
  image_url: string | null;
  is_active: boolean;
};

export async function fetchCategories(): Promise<CategoryDbRow[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, slug, label, image_url, is_active")
    .eq("is_active", true)
    .order("label", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryDbRow[];
}