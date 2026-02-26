import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { supabase } from "../lib/supabase";
const BUCKET = "product-images";
function safeExt(fileName) {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "png";
}
function looksLikeMissingColumn(err, column) {
    const msg = String(err?.message ?? err ?? "").toLowerCase();
    return msg.includes(column.toLowerCase()) && msg.includes("does not exist");
}
/** ✅ minimal brand normalize */
function normalizeBrand(input) {
    const cleaned = (input ?? "").trim().replace(/\s+/g, " ");
    if (!cleaned)
        return "";
    const key = cleaned.toLowerCase();
    const CANON = {
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
    };
    return CANON[key] ?? cleaned;
}
function normalizePartnerBrand(input) {
    return normalizeBrand(input);
}
export default function AdminProductEditPage() {
    const nav = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    // categories from DB
    const [categories, setCategories] = useState([]);
    const [catsLoading, setCatsLoading] = useState(true);
    // partner brand options
    const [partnerBrandOptions, setPartnerBrandOptions] = useState([]);
    const [partnerBrandsLoading, setPartnerBrandsLoading] = useState(false);
    // inline add partner brand
    const [newPartnerBrand, setNewPartnerBrand] = useState("");
    const [addingPartnerBrand, setAddingPartnerBrand] = useState(false);
    // form states
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [partnerBrand, setPartnerBrand] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("0");
    const [badge, setBadge] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [isActive, setIsActive] = useState(true);
    // image
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const isGpuOrMobo = useMemo(() => {
        const s = categorySlug.trim().toLowerCase();
        return s === "gpu" || s === "motherboard";
    }, [categorySlug]);
    // ✅ reset partner brand + UI bits when switching away from GPU/MOBO
    useEffect(() => {
        if (!isGpuOrMobo) {
            setPartnerBrand("");
            setNewPartnerBrand("");
            setPartnerBrandOptions([]);
        }
    }, [isGpuOrMobo]);
    // preview for newly selected file
    useEffect(() => {
        if (!imageFile) {
            setImagePreview("");
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);
    // ✅ load categories
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setCatsLoading(true);
                const { data, error } = await supabase
                    .from("product_categories")
                    .select("id, slug, label, is_active")
                    .order("label", { ascending: true });
                if (!alive)
                    return;
                if (error)
                    throw error;
                setCategories((data ?? []) || []);
            }
            catch (e) {
                if (!alive)
                    return;
                setErr(e?.message ?? "Failed to load categories.");
                setCategories([]);
            }
            finally {
                if (!alive)
                    return;
                setCatsLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);
    // ✅ load product
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
            if (!alive)
                return;
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
    // ✅ load partner brands when GPU/MOBO
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!isGpuOrMobo)
                return;
            try {
                setPartnerBrandsLoading(true);
                const cat = categorySlug.trim().toLowerCase();
                const { data, error } = await supabase
                    .from("product_brands")
                    .select("id, name, category_slug, is_active")
                    .eq("is_active", true)
                    .in("category_slug", [cat, "all"])
                    .order("name", { ascending: true });
                if (!alive)
                    return;
                if (error)
                    throw error;
                setPartnerBrandOptions((data ?? []));
            }
            catch {
                if (!alive)
                    return;
                setPartnerBrandOptions([]);
            }
            finally {
                if (!alive)
                    return;
                setPartnerBrandsLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [isGpuOrMobo, categorySlug]);
    async function uploadProductImage(file) {
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
        if (uploadErr)
            throw new Error(uploadErr.message);
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        const publicUrl = data.publicUrl;
        if (!publicUrl)
            throw new Error("Failed to get image URL.");
        return `${publicUrl}?v=${Date.now()}`;
    }
    async function reloadPartnerBrands() {
        if (!isGpuOrMobo)
            return;
        const cat = categorySlug.trim().toLowerCase();
        const { data, error } = await supabase
            .from("product_brands")
            .select("id, name, category_slug, is_active")
            .eq("is_active", true)
            .in("category_slug", [cat, "all"])
            .order("name", { ascending: true });
        if (error)
            throw error;
        setPartnerBrandOptions((data ?? []));
    }
    async function handleAddPartnerBrand() {
        if (!isGpuOrMobo)
            return;
        const cat = categorySlug.trim().toLowerCase();
        const clean = normalizePartnerBrand(newPartnerBrand);
        if (!clean)
            return;
        // ✅ prevent duplicates locally (case-insensitive)
        const exists = partnerBrandOptions.some((b) => b.name.trim().toLowerCase() === clean.trim().toLowerCase());
        if (exists) {
            setPartnerBrand(clean); // just select it
            setNewPartnerBrand("");
            return;
        }
        setAddingPartnerBrand(true);
        try {
            const { error } = await supabase.from("product_brands").insert({
                name: clean,
                category_slug: cat, // gpu or motherboard
                is_active: true,
            });
            if (error)
                throw error;
            setNewPartnerBrand("");
            await reloadPartnerBrands();
            setPartnerBrand(clean); // auto-select
        }
        catch (e) {
            alert(e?.message ?? "Failed to add partner brand.");
        }
        finally {
            setAddingPartnerBrand(false);
        }
    }
    async function updateWithFallback(payload) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (!error)
            return;
        if (looksLikeMissingColumn(error, "brand")) {
            const { brand: _b, ...noBrand } = payload;
            const retry = await supabase.from("products").update(noBrand).eq("id", id);
            if (!retry.error)
                return;
            throw new Error(retry.error.message);
        }
        if (looksLikeMissingColumn(error, "partner_brand")) {
            const { partner_brand: _pb, ...noPB } = payload;
            const retry = await supabase.from("products").update(noPB).eq("id", id);
            if (!retry.error)
                return;
            throw new Error(retry.error.message);
        }
        throw new Error(error.message);
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setErr(null);
        if (!id)
            return setErr("Missing product ID.");
        const cleanName = name.trim();
        if (!cleanName)
            return setErr("Product name is required.");
        if (!categorySlug)
            return setErr("Please select a category.");
        const numPrice = Number(price);
        if (Number.isNaN(numPrice) || numPrice < 0)
            return setErr("Price must be 0 or more.");
        setSaving(true);
        try {
            let image_url = existingImageUrl;
            if (imageFile)
                image_url = await uploadProductImage(imageFile);
            const normalizedBrand = normalizeBrand(brand);
            const normalizedPartner = isGpuOrMobo ? normalizePartnerBrand(partnerBrand) : "";
            const payload = {
                name: cleanName,
                brand: normalizedBrand ? normalizedBrand : null,
                partner_brand: isGpuOrMobo && normalizedPartner ? normalizedPartner : null,
                description: description.trim(),
                price: numPrice,
                stock: 0, // ✅ keep DB happy
                badge: badge.trim() || null,
                category_slug: categorySlug,
                image_url,
                is_active: isActive,
            };
            await updateWithFallback(payload);
            nav("/admin/products");
        }
        catch (e) {
            setErr(e?.message ?? "Failed to update product.");
        }
        finally {
            setSaving(false);
        }
    }
    const dropdownOptions = useMemo(() => {
        const active = categories.filter((c) => c.is_active);
        const inactive = categories.filter((c) => !c.is_active);
        const exists = categories.some((c) => c.slug === categorySlug);
        const extra = !exists && categorySlug
            ? [{ id: "missing", slug: categorySlug, label: `${categorySlug} (Missing)`, is_active: false }]
            : [];
        return { active, inactive, extra };
    }, [categories, categorySlug]);
    return (React.createElement(AdminLayout, null,
        React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" },
            React.createElement("div", null,
                React.createElement("div", { className: "text-2xl font-black" }, "Edit Product"),
                React.createElement("div", { className: "text-sm text-black/60" }, "Update product details.")),
            React.createElement("button", { onClick: () => nav("/admin/products"), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5", type: "button" }, "\u2190 Back")),
        err ? (React.createElement("div", { className: "mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700" }, err)) : null,
        loading ? (React.createElement("div", { className: "mt-5 rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60" }, "Loading product...")) : (React.createElement("form", { onSubmit: handleSubmit, className: "mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white p-5" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-black/5" }, imagePreview || existingImageUrl ? (React.createElement("img", { src: imagePreview || existingImageUrl || "", alt: "Product thumbnail", className: "h-full w-full object-cover" })) : (React.createElement("div", { className: "grid h-full w-full place-items-center text-lg" }, "\uD83D\uDCE6"))),
                React.createElement("div", { className: "text-xs text-black/60" }, "Thumbnail preview")),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" }, "Product Name"),
                React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10", placeholder: "e.g., Ryzen 5 5600" })),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" },
                    "Brand ",
                    React.createElement("span", { className: "text-xs text-black/50" }, "(Chip/General)")),
                React.createElement("input", { value: brand, onChange: (e) => setBrand(e.target.value), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10", placeholder: "e.g., AMD, NVIDIA, Intel" })),
            isGpuOrMobo ? (React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" }, "Partner Brand"),
                React.createElement("select", { value: partnerBrand, onChange: (e) => setPartnerBrand(e.target.value), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10", disabled: partnerBrandsLoading },
                    React.createElement("option", { value: "" }, partnerBrandsLoading ? "Loading brands..." : "Select partner brand..."),
                    partnerBrandOptions.map((b) => (React.createElement("option", { key: b.id, value: b.name }, b.name)))),
                React.createElement("div", { className: "grid gap-2 sm:grid-cols-[1fr_auto]" },
                    React.createElement("input", { value: newPartnerBrand, onChange: (e) => setNewPartnerBrand(e.target.value), placeholder: "Add new brand (e.g., Palit, Sapphire)", className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" }),
                    React.createElement("button", { type: "button", onClick: handleAddPartnerBrand, disabled: addingPartnerBrand || !newPartnerBrand.trim(), className: "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" }, addingPartnerBrand ? "Adding..." : "Add")),
                React.createElement("div", { className: "text-[11px] text-black/50" },
                    "Only for ",
                    React.createElement("b", null, "GPU"),
                    " and ",
                    React.createElement("b", null, "Motherboard"),
                    ". Brands come from ",
                    React.createElement("b", null, "product_brands"),
                    " table."))) : null,
            React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" }, "Description"),
                React.createElement("textarea", { value: description, onChange: (e) => setDescription(e.target.value), className: "min-h-[90px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10", placeholder: "Short details about the product..." })),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" }, "Product Image"),
                React.createElement("input", { type: "file", accept: "image/*", onChange: (e) => setImageFile(e.target.files?.[0] ?? null), className: "block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm" }),
                imagePreview || existingImageUrl ? (React.createElement("div", { className: "mt-2 overflow-hidden rounded-2xl border border-black/10 bg-black/5" },
                    React.createElement("div", { className: "aspect-[4/3]" },
                        React.createElement("img", { src: imagePreview || existingImageUrl || "", alt: "Preview", className: "h-full w-full object-cover" })))) : (React.createElement("div", { className: "text-xs text-black/50" }, "No image."))),
            React.createElement("div", { className: "grid gap-4 sm:grid-cols-2" },
                React.createElement("div", { className: "grid gap-2" },
                    React.createElement("label", { className: "text-sm font-semibold" }, "Category"),
                    React.createElement("select", { value: categorySlug, onChange: (e) => setCategorySlug(e.target.value), disabled: catsLoading || categories.length === 0, className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60" }, catsLoading ? (React.createElement("option", { value: "" }, "Loading categories...")) : (React.createElement(React.Fragment, null,
                        dropdownOptions.extra.map((c) => (React.createElement("option", { key: c.id, value: c.slug }, c.label))),
                        dropdownOptions.active.map((c) => (React.createElement("option", { key: c.id, value: c.slug }, c.label))),
                        dropdownOptions.inactive.length > 0 ? (React.createElement("optgroup", { label: "Inactive" }, dropdownOptions.inactive.map((c) => (React.createElement("option", { key: c.id, value: c.slug },
                            c.label,
                            " (Inactive)"))))) : null))),
                    React.createElement("div", { className: "text-[11px] text-black/50" }, "Categories come from Admin \u2192 Categories.")),
                React.createElement("div", { className: "grid gap-2" },
                    React.createElement("label", { className: "text-sm font-semibold" }, "Price (\u20B1)"),
                    React.createElement("input", { value: price, onChange: (e) => setPrice(e.target.value), type: "number", min: "0", step: "1", className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" }))),
            React.createElement("div", { className: "grid gap-2" },
                React.createElement("label", { className: "text-sm font-semibold" }, "Badge (optional)"),
                React.createElement("input", { value: badge, onChange: (e) => setBadge(e.target.value), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10", placeholder: 'e.g., "Hot", "New", "Sale"' })),
            React.createElement("label", { className: "inline-flex items-center gap-2 text-sm text-black/70" },
                React.createElement("input", { type: "checkbox", checked: isActive, onChange: (e) => setIsActive(e.target.checked) }),
                "Active"),
            React.createElement("div", { className: "flex flex-wrap gap-2 pt-2" },
                React.createElement("button", { disabled: saving, className: "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60", type: "submit" }, saving ? "Saving..." : "Save Changes"),
                React.createElement("button", { onClick: () => nav("/admin/products"), className: "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5", type: "button" }, "Cancel"))))));
}
