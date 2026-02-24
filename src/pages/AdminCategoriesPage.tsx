// src/pages/AdminCategoriesPage.tsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { supabase } from "../lib/supabase";

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
};

const BUCKET = "category-images";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function safeExt(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // add form
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  // image for add form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editExistingImageUrl, setEditExistingImageUrl] = useState<string | null>(null);

  useEffect(() => setSlug(slugify(label)), [label]);

  // ✅ AUTH CHECK (very important for Storage uploads)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      console.log("AUTH USER:", data?.user?.id);
      if (error) console.log("AUTH ERROR:", error.message);
    })();
  }, []);

  // previews
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!editImageFile) return;
    const url = URL.createObjectURL(editImageFile);
    setEditImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editImageFile]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, slug, label, image_url, is_active, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRows((data as CategoryRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function assertAuthed() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user?.id) {
      throw new Error(
        "You are not logged in with Supabase Auth. Uploads/edits will fail. Please login properly (Supabase Auth session required)."
      );
    }
    return session.user.id;
  }

  async function uploadCategoryImage(file: File) {
    await assertAuthed(); // ✅ if not authed, fail early

    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Image is too large. Max ${maxMB}MB.`);
    }

    const ext = safeExt(file.name);
    const filePath = `categories/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "0", // ✅ avoid cached previews
        upsert: false,
        contentType: file.type || "image/*",
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    if (!publicUrl) throw new Error("Failed to get image URL.");

    // ✅ cache-bust so browser won't show old image
    return `${publicUrl}?v=${Date.now()}`;
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const cleanLabel = label.trim();
    const cleanSlug = (slug || "").trim();

    if (!cleanLabel) return setErr("Category label is required.");
    if (!cleanSlug) return setErr("Category slug is required.");

    setSaving(true);
    try {
      await assertAuthed();

      let image_url: string | null = null;
      if (imageFile) image_url = await uploadCategoryImage(imageFile);

      const { error } = await supabase.from("product_categories").insert({
        label: cleanLabel,
        slug: cleanSlug,
        image_url,
        is_active: true,
      });

      if (error) throw error;

      setLabel("");
      setSlug("");
      setImageFile(null);
      setImagePreview("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, next: boolean) {
    setErr(null);
    try {
      await assertAuthed();

      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: next })
        .eq("id", id);

      if (error) throw error;

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: next } : r)));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update category.");
    }
  }

  function openEdit(r: CategoryRow) {
    setEditId(r.id);
    setEditLabel(r.label);
    setEditSlug(r.slug);
    setEditActive(r.is_active);
    setEditExistingImageUrl(r.image_url ?? null);
    setEditImageFile(null);
    setEditImagePreview("");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditId(null);
    setEditLabel("");
    setEditSlug("");
    setEditActive(true);
    setEditImageFile(null);
    setEditImagePreview("");
    setEditExistingImageUrl(null);
  }

  async function saveEdit() {
    if (!editId) return;

    setErr(null);
    const cleanLabel = editLabel.trim();
    const cleanSlug = editSlug.trim();

    if (!cleanLabel) return setErr("Category label is required.");
    if (!cleanSlug) return setErr("Category slug is required.");

    setEditSaving(true);
    try {
      await assertAuthed();

      let image_url: string | null = editExistingImageUrl;
      if (editImageFile) image_url = await uploadCategoryImage(editImageFile);

      const { error } = await supabase
        .from("product_categories")
        .update({
          label: cleanLabel,
          slug: cleanSlug,
          is_active: editActive,
          image_url,
        })
        .eq("id", editId);

      if (error) throw error;

      await load();
      closeEdit();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteCategory(r: CategoryRow) {
    const ok = window.confirm(
      `Delete category "${r.label}"?\n\nThis may affect products assigned to "${r.slug}".`
    );
    if (!ok) return;

    setErr(null);
    try {
      await assertAuthed();

      const { error } = await supabase.from("product_categories").delete().eq("id", r.id);
      if (error) throw error;

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete category.");
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Categories</div>
          <div className="text-sm text-black/60">Add and manage product categories</div>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* ADD FORM */}
      <form
        onSubmit={addCategory}
        className="mt-5 grid gap-3 rounded-2xl border border-black/10 bg-white p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Printers"
              className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
            <div className="h-[14px]" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., printers"
              className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
            <div className="text-[11px] text-black/50 leading-[14px]">
              Used in URLs and database (lowercase, no spaces).
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold">Category Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
          />

          {imagePreview ? (
            <div className="mt-2 overflow-hidden rounded-2xl border border-black/10 bg-black/5">
              <div className="aspect-[16/9]">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-black/50">Optional. Upload an image for this category.</div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            type="submit"
          >
            {saving ? "Saving..." : "+ Add Category"}
          </button>

          <button
            onClick={load}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
            type="button"
          >
            Refresh
          </button>
        </div>
      </form>

      {/* LIST */}
      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
        <div className="text-sm font-extrabold">Existing Categories</div>

        {loading ? (
          <div className="mt-3 text-sm text-black/60">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="mt-3 text-sm text-black/60">No categories yet.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.label} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div>
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-xs text-black/60">{r.slug}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleActive(r.id, !r.is_active)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm font-semibold border",
                      r.is_active
                        ? "border-green-500/30 bg-green-50 text-green-700"
                        : "border-gray-500/20 bg-gray-50 text-gray-700",
                    ].join(" ")}
                    type="button"
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </button>

                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
                    type="button"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => deleteCategory(r)}
                    className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    type="button"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          onMouseDown={closeEdit}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">Edit Category</div>
                <div className="text-xs text-black/60">Update label/slug and image.</div>
              </div>

              <button
                onClick={closeEdit}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Label</label>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Slug</label>
                <input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
                />

                {editImagePreview || editExistingImageUrl ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                    <div className="aspect-[16/9]">
                      <img
                        src={editImagePreview || editExistingImageUrl || ""}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-black/50">No image yet.</div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Active
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  type="button"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={closeEdit}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
