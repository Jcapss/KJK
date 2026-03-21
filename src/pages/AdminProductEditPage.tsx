import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { supabase } from "../lib/supabase";

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  is_active: boolean;
};

type BrandRow = {
  id: string;
  name: string;
  category_slug: string; // 'gpu' | 'motherboard' | 'laptop' | 'accessories' | 'all'
  is_active: boolean;
};

const BUCKET = "product-images";

function safeExt(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

function looksLikeMissingColumn(err: any, column: string) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return msg.includes(column.toLowerCase()) && msg.includes("does not exist");
}

/** minimal brand normalize */
function normalizeBrand(input: string) {
  const cleaned = (input ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const key = cleaned.toLowerCase();
  const CANON: Record<string, string> = {
    amd: "AMD",
    nvidia: "NVIDIA",
    intel: "Intel",
    msi: "MSI",
    gigabyte: "Gigabyte",
    asus: "ASUS",
    asrock: "ASRock",
    zotac: "ZOTAC",
    colorful: "Colorful",
    sapphire: "Sapphire",
    palit: "Palit",
    galax: "GALAX",
    pny: "PNY",
    acer: "Acer",
    lenovo: "Lenovo",
    dell: "Dell",
    hp: "HP",
    apple: "Apple",
    samsung: "Samsung",
    huawei: "Huawei",
    microsoft: "Microsoft",
    razer: "Razer",
    thinkpad: "ThinkPad",
    logitech: "Logitech",
    redragon: "Redragon",
    hyperx: "HyperX",
    steelseries: "SteelSeries",
    corsair: "Corsair",
  };

  return CANON[key] ?? cleaned;
}

function normalizePartnerBrand(input: string) {
  return normalizeBrand(input);
}

function normalizePeripheralType(input: string) {
  const cleaned = (input ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const key = cleaned.toLowerCase();
  const CANON: Record<string, string> = {
    keyboard: "Keyboard",
    mouse: "Mouse",
    headset: "Headset",
    speaker: "Speaker",
    webcam: "Webcam",
    microphone: "Microphone",
    mousepad: "Mousepad",
  };

  return CANON[key] ?? cleaned;
}

export default function AdminProductEditPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  const [partnerBrandOptions, setPartnerBrandOptions] = useState<BrandRow[]>([]);
  const [partnerBrandsLoading, setPartnerBrandsLoading] = useState(false);

  const [newPartnerBrand, setNewPartnerBrand] = useState("");
  const [addingPartnerBrand, setAddingPartnerBrand] = useState(false);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [partnerBrand, setPartnerBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [badge, setBadge] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const supportsPartnerBrand = useMemo(() => {
    const s = categorySlug.trim().toLowerCase();
    return s === "gpu" || s === "motherboard" || s === "laptop" || s === "accessories";
  }, [categorySlug]);

  const isAccessories = useMemo(
    () => categorySlug.trim().toLowerCase() === "accessories",
    [categorySlug]
  );

  useEffect(() => {
    if (!supportsPartnerBrand) {
      setPartnerBrand("");
      setNewPartnerBrand("");
      setPartnerBrandOptions([]);
    }
  }, [supportsPartnerBrand]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCatsLoading(true);
        const { data, error } = await supabase
          .from("product_categories")
          .select("id, slug, label, is_active")
          .order("label", { ascending: true });

        if (!alive) return;
        if (error) throw error;

        setCategories(((data ?? []) as CategoryRow[]) || []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load categories.");
        setCategories([]);
      } finally {
        if (!alive) return;
        setCatsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) {
        setErr("Missing product ID.");
        setLoading(false);
        return;
      }

      setErr(null);
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setErr("Product not found.");
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setBrand(data.brand ?? "");
      setPartnerBrand(data.partner_brand ?? "");
      setDescription(data.description ?? "");
      setPrice(String(data.price ?? 0));
      setBadge(data.badge ?? "");
      setCategorySlug(String(data.category_slug ?? ""));
      setIsActive(Boolean(data.is_active));
      setExistingImageUrl(data.image_url ?? null);

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!supportsPartnerBrand) return;

      try {
        setPartnerBrandsLoading(true);

        const cat = categorySlug.trim().toLowerCase();

        const { data, error } = await supabase
          .from("product_brands")
          .select("id, name, category_slug, is_active")
          .eq("is_active", true)
          .in("category_slug", [cat, "all"])
          .order("name", { ascending: true });

        if (!alive) return;
        if (error) throw error;

        setPartnerBrandOptions((data ?? []) as BrandRow[]);
      } catch {
        if (!alive) return;
        setPartnerBrandOptions([]);
      } finally {
        if (!alive) return;
        setPartnerBrandsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [supportsPartnerBrand, categorySlug]);

  async function uploadProductImage(file: File) {
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Image is too large. Max ${maxMB}MB.`);
    }

    const ext = safeExt(file.name);
    const filePath = `products/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/*",
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    if (!publicUrl) throw new Error("Failed to get image URL.");
    return `${publicUrl}?v=${Date.now()}`;
  }

  async function reloadPartnerBrands() {
    if (!supportsPartnerBrand) return;

    const cat = categorySlug.trim().toLowerCase();
    const { data, error } = await supabase
      .from("product_brands")
      .select("id, name, category_slug, is_active")
      .eq("is_active", true)
      .in("category_slug", [cat, "all"])
      .order("name", { ascending: true });

    if (error) throw error;
    setPartnerBrandOptions((data ?? []) as BrandRow[]);
  }

  async function handleAddPartnerBrand() {
    if (!supportsPartnerBrand) return;

    const cat = categorySlug.trim().toLowerCase();
    const clean = normalizePartnerBrand(newPartnerBrand);
    if (!clean) return;

    const exists = partnerBrandOptions.some(
      (b) => b.name.trim().toLowerCase() === clean.trim().toLowerCase()
    );
    if (exists) {
      setPartnerBrand(clean);
      setNewPartnerBrand("");
      return;
    }

    setAddingPartnerBrand(true);
    try {
      const { error } = await supabase.from("product_brands").insert({
        name: clean,
        category_slug: cat,
        is_active: true,
      });

      if (error) throw error;

      setNewPartnerBrand("");
      await reloadPartnerBrands();
      setPartnerBrand(clean);
    } catch (e: any) {
      alert(e?.message ?? "Failed to add partner brand.");
    } finally {
      setAddingPartnerBrand(false);
    }
  }

  async function updateWithFallback(payload: any) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (!error) return;

    if (looksLikeMissingColumn(error, "brand")) {
      const { brand: _b, ...noBrand } = payload;
      const retry = await supabase.from("products").update(noBrand).eq("id", id);
      if (!retry.error) return;
      throw new Error(retry.error.message);
    }

    if (looksLikeMissingColumn(error, "partner_brand")) {
      const { partner_brand: _pb, ...noPB } = payload;
      const retry = await supabase.from("products").update(noPB).eq("id", id);
      if (!retry.error) return;
      throw new Error(retry.error.message);
    }

    throw new Error(error.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!id) return setErr("Missing product ID.");

    const cleanName = name.trim();
    if (!cleanName) return setErr("Product name is required.");
    if (!categorySlug) return setErr("Please select a category.");

    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) return setErr("Price must be 0 or more.");

    setSaving(true);

    try {
      let image_url: string | null = existingImageUrl;
      if (imageFile) image_url = await uploadProductImage(imageFile);

      const normalizedBrand = isAccessories
        ? normalizePeripheralType(brand)
        : normalizeBrand(brand);

      const normalizedPartner = supportsPartnerBrand
        ? normalizePartnerBrand(partnerBrand)
        : "";

      const payload = {
        name: cleanName,
        brand: normalizedBrand ? normalizedBrand : null,
        partner_brand:
          supportsPartnerBrand && normalizedPartner ? normalizedPartner : null,
        description: description.trim(),
        price: numPrice,
        stock: 0,
        badge: badge.trim() || null,
        category_slug: categorySlug,
        image_url,
        is_active: isActive,
      };

      await updateWithFallback(payload);
      nav("/admin/products");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update product.");
    } finally {
      setSaving(false);
    }
  }

  const dropdownOptions = useMemo(() => {
    const active = categories.filter((c) => c.is_active);
    const inactive = categories.filter((c) => !c.is_active);

    const exists = categories.some((c) => c.slug === categorySlug);
    const extra =
      !exists && categorySlug
        ? [{ id: "missing", slug: categorySlug, label: `${categorySlug} (Missing)`, is_active: false }]
        : [];

    return { active, inactive, extra };
  }, [categories, categorySlug]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Edit Product</div>
          <div className="text-sm text-black/60">Update product details.</div>
        </div>

        <button
          onClick={() => nav("/admin/products")}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
          type="button"
        >
          ← Back
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">
          Loading product...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-black/5">
              {imagePreview || existingImageUrl ? (
                <img
                  src={imagePreview || existingImageUrl || ""}
                  alt="Product thumbnail"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-lg">📦</div>
              )}
            </div>
            <div className="text-xs text-black/60">Thumbnail preview</div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Product Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="e.g., Ryzen 5 5600"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">
              {isAccessories ? "Peripheral Type" : "Brand"}{" "}
              <span className="text-xs text-black/50">
                {isAccessories ? "(e.g., Keyboard, Mouse, Headset)" : "(Chip/General)"}
              </span>
            </label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder={
                isAccessories
                  ? "e.g., Keyboard, Mouse, Headset"
                  : "e.g., AMD, NVIDIA, Intel, ASUS, Acer"
              }
            />
            <div className="text-[11px] text-black/50">
              {isAccessories
                ? "For Accessories, use the peripheral type here. Example: Keyboard, Mouse, Headset."
                : "For GPU/Motherboard, this is usually the chip brand. For laptops, this can be the general or main brand if needed."}
            </div>
          </div>

          {supportsPartnerBrand ? (
            <div className="grid gap-2">
              <label className="text-sm font-semibold">
                {isAccessories ? "Partner Brand" : "Partner Brand"}
              </label>

              <select
                value={partnerBrand}
                onChange={(e) => setPartnerBrand(e.target.value)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                disabled={partnerBrandsLoading}
              >
                <option value="">
                  {partnerBrandsLoading ? "Loading brands..." : "Select partner brand..."}
                </option>
                {partnerBrandOptions.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={newPartnerBrand}
                  onChange={(e) => setNewPartnerBrand(e.target.value)}
                  placeholder={
                    isAccessories
                      ? "Add new brand (e.g., Logitech, Razer, Redragon)"
                      : "Add new brand (e.g., ThinkPad, ASUS, Acer)"
                  }
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="button"
                  onClick={handleAddPartnerBrand}
                  disabled={addingPartnerBrand || !newPartnerBrand.trim()}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {addingPartnerBrand ? "Adding..." : "Add"}
                </button>
              </div>

              <div className="text-[11px] text-black/50">
                {isAccessories ? (
                  <>
                    For <b>Accessories</b>, use <b>brand</b> as the peripheral type and{" "}
                    <b>partner_brand</b> as the manufacturer/brand.
                  </>
                ) : (
                  <>
                    Only for <b>GPU</b>, <b>Motherboard</b>, <b>Laptop</b>, and{" "}
                    <b>Accessories</b>. Brands come from <b>product_brands</b> table.
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[90px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Short details about the product..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
            />

            {imagePreview || existingImageUrl ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                <div className="aspect-[4/3]">
                  <img
                    src={imagePreview || existingImageUrl || ""}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-black/50">No image.</div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Category</label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                disabled={catsLoading || categories.length === 0}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60"
              >
                {catsLoading ? (
                  <option value="">Loading categories...</option>
                ) : (
                  <>
                    {dropdownOptions.extra.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.label}
                      </option>
                    ))}

                    {dropdownOptions.active.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.label}
                      </option>
                    ))}

                    {dropdownOptions.inactive.length > 0 ? (
                      <optgroup label="Inactive">
                        {dropdownOptions.inactive.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.label} (Inactive)
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </>
                )}
              </select>

              <div className="text-[11px] text-black/50">Categories come from Admin → Categories.</div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Price (₱)</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                step="1"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Badge (optional)</label>
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder='e.g., "Hot", "New", "Sale"'
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-black/70">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              disabled={saving}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              type="submit"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={() => nav("/admin/products")}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}