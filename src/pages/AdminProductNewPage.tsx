import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  category_slug: string;
  is_active: boolean;
};

const IMAGE_BUCKET = "product-images";
const PDF_BUCKET = "product-quotations";

function safeExt(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

function looksLikeMissingColumn(err: any, column: string) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return msg.includes(column.toLowerCase()) && msg.includes("does not exist");
}

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

export default function AdminProductNewPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [partnerBrand, setPartnerBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [badge, setBadge] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // ✅ solar fields
  const [kwSize, setKwSize] = useState<string>("");
  const [systemType, setSystemType] = useState("");
  const [includesText, setIncludesText] = useState("");
  const [quotationFile, setQuotationFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  const [partnerBrandOptions, setPartnerBrandOptions] = useState<BrandRow[]>([]);
  const [partnerBrandsLoading, setPartnerBrandsLoading] = useState(false);

  const [newPartnerBrand, setNewPartnerBrand] = useState("");
  const [addingPartnerBrand, setAddingPartnerBrand] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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

  const isSolar = useMemo(
    () => categorySlug.trim().toLowerCase() === "services",
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
          .eq("is_active", true)
          .order("label", { ascending: true });

        if (!alive) return;
        if (error) throw error;

        const rows = (data ?? []) as CategoryRow[];
        setCategories(rows);

        setCategorySlug((prev) => {
          if (prev) return prev;
          const preferred =
            rows.find((r) => r.slug === "cpu") ||
            rows.find((r) => r.slug === "gpu") ||
            rows[0];
          return preferred?.slug ?? "";
        });
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
    const ext = safeExt(file.name);
    const filePath = `products/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/*",
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function uploadQuotationPdf(file: File) {
    const ext = safeExt(file.name);
    const filePath = `quotations/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/pdf",
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
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

  async function insertWithFallback(payload: any) {
    const { error } = await supabase.from("products").insert(payload);
    if (!error) return;

    const columnsToTry = ["brand", "partner_brand", "kw_size", "system_type", "includes", "quotation_pdf"];

    let currentPayload = { ...payload };
    for (const col of columnsToTry) {
      if (looksLikeMissingColumn(error, col)) {
        const { [col]: _removed, ...rest } = currentPayload;
        currentPayload = rest;
      }
    }

    const retry = await supabase.from("products").insert(currentPayload);
    if (!retry.error) return;

    throw new Error(retry.error.message || error.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const cleanName = name.trim();
    if (!cleanName) return setErr("Product name is required.");
    if (!categorySlug) return setErr("Please select a category.");

    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return setErr("Price must be 0 or more.");
    }

    setSaving(true);

    try {
      let image_url: string | null = null;
      let quotation_pdf: string | null = null;

      if (imageFile) image_url = await uploadProductImage(imageFile);
      if (quotationFile) quotation_pdf = await uploadQuotationPdf(quotationFile);

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

        // ✅ solar fields
        kw_size: isSolar && kwSize ? Number(kwSize) : null,
        system_type: isSolar ? systemType.trim() || null : null,
        includes: isSolar ? includesText.trim() || null : null,
        quotation_pdf: isSolar ? quotation_pdf : null,
      };

      await insertWithFallback(payload);
      nav("/admin/products");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Add Product</div>
          <div className="text-sm text-black/60">Create a new product item.</div>
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

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-5"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-black/5">
            {imagePreview ? (
              <img
                src={imagePreview}
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
            placeholder={isSolar ? "e.g., 8KW Hybrid Solar Installation" : "e.g., Ryzen 5 5600"}
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
                : isSolar
                ? "e.g., Solar Package"
                : "e.g., AMD, NVIDIA, Intel, ASUS, Acer"
            }
          />
          <div className="text-[11px] text-black/50">
            {isAccessories
              ? "For Accessories, use the peripheral type here."
              : isSolar
              ? "For solar services, this can be a general label like Solar Package."
              : "For GPU/Motherboard, this is usually the chip brand. For laptops, this can be the general or main brand if needed."}
          </div>
        </div>

        {supportsPartnerBrand ? (
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Partner Brand</label>

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
                    : "Add new brand (e.g., ASUS, Acer, MSI)"
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
          </div>
        ) : null}

        {/* ✅ solar section */}
        {isSolar ? (
          <div className="grid gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
            <div className="text-sm font-bold">Solar Package Details</div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">System Size (KW)</label>
                <input
                  value={kwSize}
                  onChange={(e) => setKwSize(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="e.g., 8"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">System Type</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">Select system type...</option>
                  <option value="On-Grid">On-Grid</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Off-Grid">Off-Grid</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Package Inclusions</label>
              <textarea
                value={includesText}
                onChange={(e) => setIncludesText(e.target.value)}
                className="min-h-[100px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g., 620W solar panels, hybrid inverter, battery, installation materials, labor..."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Quotation PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setQuotationFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
              />
              <div className="text-xs text-black/50">
                Upload the official quotation file for this solar package.
              </div>
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

          {imagePreview ? (
            <div className="mt-2 overflow-hidden rounded-2xl border border-black/10 bg-black/5">
              <div className="aspect-[4/3]">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-black/50">
              Optional. Choose an image file to upload.
            </div>
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
              ) : categories.length === 0 ? (
                <option value="">No categories yet</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))
              )}
            </select>
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
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            type="submit"
          >
            {saving ? "Saving..." : "Create Product"}
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
    </AdminLayout>
  );
}