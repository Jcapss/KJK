import { supabase } from "../lib/supabase"; // ✅ change if your supabase client path is different

export async function uploadBannerImage(file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `hero/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("banners").upload(path, file, {
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}