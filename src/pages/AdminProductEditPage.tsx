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

function normalizeRamGeneration(input: string) {
  const cleaned = (input ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  const upper = cleaned.toUpperCase().replace(/\s+/g, "");
  const CANON: Record<string, string> = {
    DDR3: "DDR3",
    DDR4: "DDR4",
    DDR5: "DDR5",
    LPDDR4: "LPDDR4",
    LPDDR5: "LPDDR5",
  };

  return CANON[upper] ?? cleaned.toUpperCase();
}

function normalizeServiceType(value?: string | null) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "solar") return "solar";
  if (v === "cctv") return "cctv";
  return "other";
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

  const [kwSize, setKwSize] = useState<string>("");
  const [systemType, setSystemType] = useState("");
  const [includesText, setIncludesText] = useState("");
  const [existingQuotationPdf, setExistingQuotationPdf] = useState<string | null>(null);
  const [quotationFile, setQuotationFile] = useState<File | null>(null);

  const [serviceType, setServiceType] = useState("other");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const normalizedCategory = useMemo(
    () => categorySlug.trim().toLowerCase(),
    [categorySlug]
  );

  const supportsPartnerBrand = useMemo(() => {
    const s = normalizedCategory;
    return (
      s === "gpu" ||
      s === "motherboard" ||
      s === "laptop" ||
      s === "accessories" ||
      s === "ram"
    );
  }, [normalizedCategory]);

  const isAccessories = useMemo(
    () => normalizedCategory === "accessories",
    [normalizedCategory]
  );

  const isServiceCategory = useMemo(
    () => normalizedCategory === "services",
    [normalizedCategory]
  );

  const isRam = useMemo(
    () => normalizedCategory === "ram",
    [normalizedCategory]
  );

  const isMonitor = useMemo(
    () => normalizedCategory === "monitor",
    [normalizedCategory]
  );

  const isSolarService = isServiceCategory && serviceType === "solar";

  const brandLabel = isAccessories
    ? "Peripheral Type"
    : isRam
    ? "Generation"
    : "Brand";

  const brandHint = isAccessories
    ? "(e.g., Keyboard, Mouse, Headset)"
    : isRam
    ? "(e.g., DDR3, DDR4, DDR5)"
    : "(Chip/General)";

  const brandPlaceholder = isAccessories
    ? "e.g., Keyboard, Mouse, Headset"
    : isRam
    ? "e.g., DDR4, DDR5"
    : isServiceCategory
    ? "e.g., Solar Package, CCTV Package, Installation Service"
    : isMonitor
    ? "e.g., Nvision, ASUS, Acer, MSI"
    : "e.g., AMD, NVIDIA, Intel, ASUS, Acer";

  useEffect(() => {
    if (!supportsPartnerBrand) {
      setPartnerBrand("");
      setNewPartnerBrand("");
      setPartnerBrandOptions([]);
    }
  }, [supportsPartnerBrand]);

  useEffect(() => {
    if (!isServiceCategory) {
      setServiceType("other");
      setKwSize("");
      setSystemType("");
      setIncludesText("");
    }
  }, [isServiceCategory]);

  useEffect(() => {
    if (!isSolarService) {
      setKwSize("");
      setSystemType("");
    }
  }, [isSolarService]);

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

      const loadedCategory = String(data.category_slug ?? "").toLowerCase();
      const loadedServiceType =
        loadedCategory === "services"
          ? normalizeServiceType(data.service_type)
          : "other";

      setName(data.name ?? "");
      setBrand(data.brand ?? "");
      setPartnerBrand(loadedCategory === "monitor" ? "" : data.partner_brand ?? "");
      setDescription(data.description ?? "");
      setPrice(String(data.price ?? 0));
      setBadge(data.badge ?? "");
      setCategorySlug(String(data.category_slug ?? ""));
      setIsActive(Boolean(data.is_active));
      setExistingImageUrl(data.image_url ?? null);

      setServiceType(loadedServiceType);
      setKwSize(
        loadedCategory === "services" && loadedServiceType === "solar" && data.kw_size != null
          ? String(data.kw_size)
          : ""
      );
      setSystemType(
        loadedCategory === "services" && loadedServiceType === "solar"
          ? data.system_type ?? ""
          : ""
      );
      setIncludesText(
        loadedCategory === "services"
          ? data.includes ?? ""
          : ""
      );
      setExistingQuotationPdf(
        loadedCategory === "services" ? data.quotation_pdf ?? null : null
      );

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

        const cat = normalizedCategory;

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
  }, [supportsPartnerBrand, normalizedCategory]);

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
    return `${data.publicUrl}?v=${Date.now()}`;
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
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function reloadPartnerBrands() {
    if (!supportsPartnerBrand) return;

    const cat = normalizedCategory;
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

    const cat = normalizedCategory;
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

    const columnsToTry = [
      "brand",
      "partner_brand",
      "kw_size",
      "system_type",
      "includes",
      "quotation_pdf",
      "service_type",
    ];

    let currentPayload = { ...payload };
    for (const col of columnsToTry) {
      if (looksLikeMissingColumn(error, col)) {
        const { [col]: _removed, ...rest } = currentPayload;
        currentPayload = rest;
      }
    }

    const retry = await supabase.from("products").update(currentPayload).eq("id", id);
    if (!retry.error) return;

    throw new Error(retry.error.message || error.message);
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
      let quotation_pdf: string | null = existingQuotationPdf;

      if (imageFile) image_url = await uploadProductImage(imageFile);
      if (quotationFile) quotation_pdf = await uploadQuotationPdf(quotationFile);

      const normalizedBrand = isAccessories
        ? normalizePeripheralType(brand)
        : isRam
        ? normalizeRamGeneration(brand)
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

        kw_size: isSolarService && kwSize ? Number(kwSize) : null,
        system_type: isSolarService ? systemType.trim() || null : null,
        includes: isServiceCategory ? includesText.trim() || null : null,
        quotation_pdf: isServiceCategory ? quotation_pdf : null,
        service_type: isServiceCategory ? serviceType : null,
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
        ? [
            {
              id: "missing",
              slug: categorySlug,
              label: `${categorySlug} (Missing)`,
              is_active: false,
            },
          ]
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
              placeholder={
                isServiceCategory
                  ? "e.g., CCTV Installation Package"
                  : "e.g., Ryzen 5 5600"
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">
              {brandLabel} <span className="text-xs text-black/50">{brandHint}</span>
            </label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder={brandPlaceholder}
            />
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
                      : isRam
                      ? "Add new partner brand (e.g., Kingston, TeamGroup, Corsair)"
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

          {isServiceCategory ? (
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="solar">Solar</option>
                <option value="cctv">CCTV</option>
                <option value="other">Other Service</option>
              </select>
            </div>
          ) : null}

          {isSolarService ? (
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
            </div>
          ) : null}

          {isServiceCategory ? (
            <div className="grid gap-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
              <div className="text-sm font-bold">
                {serviceType === "cctv"
                  ? "CCTV Service Details"
                  : serviceType === "solar"
                  ? "Additional Service Details"
                  : "Service Details"}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">
                  {serviceType === "cctv" ? "Included Items / Scope" : "Details / Inclusions"}
                </label>
                <textarea
                  value={includesText}
                  onChange={(e) => setIncludesText(e.target.value)}
                  className="min-h-[100px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder={
                    serviceType === "cctv"
                      ? "e.g., 4-channel DVR, 2 cameras, cabling, installation..."
                      : "Enter service details..."
                  }
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
                {existingQuotationPdf ? (
                  <a
                    href={existingQuotationPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View current quotation PDF
                  </a>
                ) : (
                  <div className="text-xs text-black/50">No quotation PDF uploaded yet.</div>
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

              <div className="text-[11px] text-black/50">
                Categories come from Admin → Categories.
              </div>
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