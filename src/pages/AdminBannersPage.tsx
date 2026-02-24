import React, { useEffect, useMemo, useState } from "react";
import {
  adminCreateBanner,
  adminDeleteBanner,
  adminListBanners,
  adminUpdateBanner,
} from "../data/adminBannersApi";
import type { BannerRow } from "../data/bannersApi";
import { uploadBannerImage } from "../data/bannerStorage";
import AdminLayout from "../components/AdminLayout";

type FormState = {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_href: string;
  sort_order: number;
  is_active: boolean;
  image_url: string;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  cta_text: "",
  cta_href: "",
  sort_order: 0,
  is_active: true,
  image_url: "",
};

export default function AdminBannersPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [imgUploading, setImgUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminListBanners();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => a.sort_order - b.sort_order);
  }, [rows]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setImgPreview("");
    setOpen(true);
  }

  function openEdit(r: BannerRow) {
    setEditing(r);
    setForm({
      title: r.title,
      subtitle: r.subtitle ?? "",
      cta_text: r.cta_text ?? "",
      cta_href: r.cta_href ?? "",
      sort_order: r.sort_order,
      is_active: r.is_active,
      image_url: r.image_url,
    });
    setImgPreview(r.image_url);
    setOpen(true);
  }

  async function onPickImage(file?: File | null) {
    if (!file) return;
    setImgUploading(true);
    try {
      const publicUrl = await uploadBannerImage(file);
      setForm((p) => ({ ...p, image_url: publicUrl }));
      setImgPreview(publicUrl);
    } catch (e: any) {
      alert(e?.message ?? "Upload failed");
    } finally {
      setImgUploading(false);
    }
  }

  async function onSave() {
    if (!form.title.trim()) return alert("Title is required.");
    if (!form.image_url.trim()) return alert("Image is required.");

    setSaving(true);
    try {
      if (editing) {
        await adminUpdateBanner(editing.id, {
          title: form.title,
          subtitle: form.subtitle || null,
          cta_text: form.cta_text || null,
          cta_href: form.cta_href || null,
          image_url: form.image_url,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
      } else {
        await adminCreateBanner({
          title: form.title,
          subtitle: form.subtitle || null,
          cta_text: form.cta_text || null,
          cta_href: form.cta_href || null,
          image_url: form.image_url,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
      }

      setOpen(false);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(r: BannerRow) {
    const ok = confirm(`Delete banner: "${r.title}"?`);
    if (!ok) return;

    try {
      await adminDeleteBanner(r.id);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Delete failed");
    }
  }

  async function toggleActive(r: BannerRow) {
    try {
      await adminUpdateBanner(r.id, { is_active: !r.is_active });
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Update failed");
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hero Banners</h1>
            <p className="text-sm text-gray-500">
              Manage homepage slider images and text.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            + Add Banner
          </button>
        </div>

        <div className="mt-6 rounded-xl border bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No banners yet.</div>
          ) : (
            <div className="divide-y">
              {sorted.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={r.image_url}
                      alt={r.title}
                      className="h-16 w-28 rounded-md object-cover border"
                    />
                    <div>
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-xs text-gray-500">
                        Order: {r.sort_order} •{" "}
                        {r.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(r)}
                      className="rounded-md border px-3 py-2 text-xs font-semibold"
                    >
                      {r.is_active ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => openEdit(r)}
                      className="rounded-md border px-3 py-2 text-xs font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(r)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold mb-4">
                {editing ? "Edit Banner" : "Add Banner"}
              </h2>

              <div className="grid gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />

                {imgPreview && (
                  <img
                    src={imgPreview}
                    className="h-32 w-full object-cover rounded"
                  />
                )}

                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="border rounded px-3 py-2"
                />

                <input
                  placeholder="Subtitle"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtitle: e.target.value }))
                  }
                  className="border rounded px-3 py-2"
                />

                <input
                  placeholder="CTA Text"
                  value={form.cta_text}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cta_text: e.target.value }))
                  }
                  className="border rounded px-3 py-2"
                />

                <input
                  placeholder="CTA Link"
                  value={form.cta_href}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cta_href: e.target.value }))
                  }
                  className="border rounded px-3 py-2"
                />

                <input
                  type="number"
                  placeholder="Sort Order"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sort_order: Number(e.target.value),
                    }))
                  }
                  className="border rounded px-3 py-2"
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                  Active
                </label>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="border rounded px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving || imgUploading}
                    className="bg-black text-white rounded px-4 py-2 text-sm"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}