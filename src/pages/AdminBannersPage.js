import React, { useEffect, useMemo, useState } from "react";
import { adminCreateBanner, adminDeleteBanner, adminListBanners, adminUpdateBanner, } from "../data/adminBannersApi";
import { uploadBannerImage } from "../data/bannerStorage";
import AdminLayout from "../components/AdminLayout";
const emptyForm = {
    title: "",
    subtitle: "",
    note_text: "Follow us on Facebook for promos & new arrivals.",
    cta_text: "",
    cta_href: "",
    sort_order: 0,
    is_active: true,
    image_url: "",
    overlay_strength: 35,
    align: "left",
    show_fb_buttons: true,
    title_color: "#FFFFFF",
    subtitle_color: "#E5E7EB",
    note_color: "#D1D5DB",
};
export default function AdminBannersPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [imgUploading, setImgUploading] = useState(false);
    const [imgPreview, setImgPreview] = useState("");
    async function refresh() {
        setLoading(true);
        try {
            const data = await adminListBanners();
            setRows(data);
        }
        finally {
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
    function openEdit(r) {
        setEditing(r);
        setForm({
            title: r.title,
            subtitle: r.subtitle ?? "",
            note_text: r.note_text ?? "Follow us on Facebook for promos & new arrivals.",
            cta_text: r.cta_text ?? "",
            cta_href: r.cta_href ?? "",
            sort_order: r.sort_order,
            is_active: r.is_active,
            image_url: r.image_url,
            overlay_strength: Number.isFinite(r.overlay_strength)
                ? Number(r.overlay_strength)
                : 35,
            align: (r.align ?? "left"),
            show_fb_buttons: r.show_fb_buttons ?? true,
            title_color: r.title_color ?? "#FFFFFF",
            subtitle_color: r.subtitle_color ?? "#E5E7EB",
            note_color: r.note_color ?? "#D1D5DB",
        });
        setImgPreview(r.image_url);
        setOpen(true);
    }
    async function onPickImage(file) {
        if (!file)
            return;
        setImgUploading(true);
        try {
            const publicUrl = await uploadBannerImage(file);
            setForm((p) => ({ ...p, image_url: publicUrl }));
            setImgPreview(publicUrl);
        }
        catch (e) {
            alert(e?.message ?? "Upload failed");
        }
        finally {
            setImgUploading(false);
        }
    }
    async function onSave() {
        if (!form.title.trim())
            return alert("Title is required.");
        if (!form.image_url.trim())
            return alert("Image is required.");
        const overlay = Math.max(0, Math.min(80, Number(form.overlay_strength || 0)));
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                subtitle: form.subtitle || null,
                note_text: form.note_text || null,
                cta_text: form.cta_text || null,
                cta_href: form.cta_href || null,
                image_url: form.image_url,
                sort_order: form.sort_order,
                is_active: form.is_active,
                overlay_strength: overlay,
                align: form.align,
                show_fb_buttons: form.show_fb_buttons,
                title_color: form.title_color,
                subtitle_color: form.subtitle_color,
                note_color: form.note_color,
            };
            if (editing) {
                await adminUpdateBanner(editing.id, payload);
            }
            else {
                await adminCreateBanner(payload);
            }
            // ✅ notify homepage to re-fetch (same tab + other tabs)
            localStorage.setItem("kjk_banners_refresh_v1", String(Date.now()));
            window.dispatchEvent(new Event("kjk:banners-updated"));
            try {
                const bc = new BroadcastChannel("kjk_banners_channel_v1");
                bc.postMessage({ type: "BANNERS_UPDATED" });
                bc.close();
            }
            catch { }
            setOpen(false);
            await refresh();
        }
        catch (e) {
            alert(e?.message ?? "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    async function onDelete(r) {
        const ok = confirm(`Delete banner: "${r.title}"?`);
        if (!ok)
            return;
        try {
            await adminDeleteBanner(r.id);
            await refresh();
        }
        catch (e) {
            alert(e?.message ?? "Delete failed");
        }
    }
    async function toggleActive(r) {
        try {
            await adminUpdateBanner(r.id, { is_active: !r.is_active });
            await refresh();
        }
        catch (e) {
            alert(e?.message ?? "Update failed");
        }
    }
    return (React.createElement(AdminLayout, null,
        React.createElement("div", { className: "mx-auto w-full max-w-6xl p-4 sm:p-6" },
            React.createElement("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-2xl font-bold" }, "Hero Banners"),
                    React.createElement("p", { className: "text-sm text-gray-500" }, "Manage homepage slider images and text.")),
                React.createElement("button", { onClick: openCreate, className: "w-full sm:w-auto rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80" }, "+ Add Banner")),
            React.createElement("div", { className: "mt-6 rounded-xl border bg-white" }, loading ? (React.createElement("div", { className: "p-6 text-sm text-gray-500" }, "Loading\u2026")) : sorted.length === 0 ? (React.createElement("div", { className: "p-6 text-sm text-gray-500" }, "No banners yet.")) : (React.createElement("div", { className: "divide-y" }, sorted.map((r) => (React.createElement("div", { key: r.id, className: "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" },
                React.createElement("div", { className: "flex items-center gap-4" },
                    React.createElement("img", { src: r.image_url, alt: r.title, className: "h-16 w-28 rounded-md object-cover border" }),
                    React.createElement("div", null,
                        React.createElement("div", { className: "font-semibold" }, r.title),
                        React.createElement("div", { className: "text-xs text-gray-500" },
                            "Order: ",
                            r.sort_order,
                            " \u2022 ",
                            r.is_active ? "Active" : "Inactive"))),
                React.createElement("div", { className: "flex flex-wrap gap-2" },
                    React.createElement("button", { onClick: () => toggleActive(r), className: "rounded-md border px-3 py-2 text-xs font-semibold" }, r.is_active ? "Disable" : "Enable"),
                    React.createElement("button", { onClick: () => openEdit(r), className: "rounded-md border px-3 py-2 text-xs font-semibold" }, "Edit"),
                    React.createElement("button", { onClick: () => onDelete(r), className: "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" }, "Delete")))))))),
            open && (React.createElement("div", { className: "fixed inset-0 z-50 bg-black/50" },
                React.createElement("div", { className: "flex min-h-full items-start justify-center p-3 sm:p-6 overflow-y-auto" },
                    React.createElement("div", { className: "w-full max-w-4xl rounded-2xl bg-white shadow-xl max-h-[92vh] flex flex-col overflow-hidden" },
                        React.createElement("div", { className: "flex items-start justify-between gap-3 border-b p-4 sm:p-5" },
                            React.createElement("div", null,
                                React.createElement("h2", { className: "text-lg font-bold" }, editing ? "Edit Banner" : "Add Banner"),
                                React.createElement("p", { className: "mt-1 text-xs text-gray-500" }, "Tip: on mobile, scroll down for the preview and buttons.")),
                            React.createElement("button", { onClick: () => setOpen(false), className: "rounded-md border px-3 py-2 text-xs font-semibold hover:bg-gray-50" }, "\u2715")),
                        React.createElement("div", { className: "flex-1 overflow-y-auto p-4 sm:p-5" },
                            React.createElement("div", { className: "grid gap-5 md:grid-cols-[1fr_1fr]" },
                                React.createElement("div", { className: "grid gap-3" },
                                    React.createElement("label", { className: "text-xs font-semibold text-gray-600" },
                                        "Banner Image",
                                        React.createElement("input", { type: "file", accept: "image/*", onChange: (e) => onPickImage(e.target.files?.[0]), className: "mt-1 block w-full rounded-md border px-3 py-2 text-sm" })),
                                    imgPreview && (React.createElement("div", { className: "overflow-hidden rounded-xl border" },
                                        React.createElement("div", { className: "aspect-video w-full bg-black" },
                                            React.createElement("img", { src: imgPreview, alt: "", className: "h-full w-full object-cover" })))),
                                    React.createElement("div", { className: "grid gap-3 sm:grid-cols-2" },
                                        React.createElement("input", { placeholder: "Title", value: form.title, onChange: (e) => setForm((p) => ({ ...p, title: e.target.value })), className: "border rounded px-3 py-2" }),
                                        React.createElement("input", { placeholder: "Subtitle", value: form.subtitle, onChange: (e) => setForm((p) => ({ ...p, subtitle: e.target.value })), className: "border rounded px-3 py-2" })),
                                    React.createElement("input", { placeholder: 'Note text (ex: "Follow us on Facebook...")', value: form.note_text, onChange: (e) => setForm((p) => ({ ...p, note_text: e.target.value })), className: "border rounded px-3 py-2" }),
                                    React.createElement("div", { className: "grid gap-3 sm:grid-cols-2" },
                                        React.createElement("input", { placeholder: "CTA Text", value: form.cta_text, onChange: (e) => setForm((p) => ({ ...p, cta_text: e.target.value })), className: "border rounded px-3 py-2" }),
                                        React.createElement("input", { placeholder: "CTA Link", value: form.cta_href, onChange: (e) => setForm((p) => ({ ...p, cta_href: e.target.value })), className: "border rounded px-3 py-2" })),
                                    React.createElement("div", { className: "grid gap-3 sm:grid-cols-2" },
                                        React.createElement("input", { type: "number", placeholder: "Sort Order", value: form.sort_order, onChange: (e) => setForm((p) => ({
                                                ...p,
                                                sort_order: Number(e.target.value),
                                            })), className: "border rounded px-3 py-2" }),
                                        React.createElement("select", { value: form.align, onChange: (e) => setForm((p) => ({
                                                ...p,
                                                align: e.target.value,
                                            })), className: "border rounded px-3 py-2" },
                                            React.createElement("option", { value: "left" }, "Align: Left"),
                                            React.createElement("option", { value: "center" }, "Align: Center"),
                                            React.createElement("option", { value: "right" }, "Align: Right"))),
                                    React.createElement("div", { className: "grid gap-3 sm:grid-cols-3" },
                                        React.createElement("label", { className: "text-sm" },
                                            React.createElement("div", { className: "mb-1 text-xs text-gray-500" }, "Title Color"),
                                            React.createElement("input", { type: "color", value: form.title_color, onChange: (e) => setForm((p) => ({
                                                    ...p,
                                                    title_color: e.target.value,
                                                })), className: "h-10 w-full rounded border" })),
                                        React.createElement("label", { className: "text-sm" },
                                            React.createElement("div", { className: "mb-1 text-xs text-gray-500" }, "Subtitle Color"),
                                            React.createElement("input", { type: "color", value: form.subtitle_color, onChange: (e) => setForm((p) => ({
                                                    ...p,
                                                    subtitle_color: e.target.value,
                                                })), className: "h-10 w-full rounded border" })),
                                        React.createElement("label", { className: "text-sm" },
                                            React.createElement("div", { className: "mb-1 text-xs text-gray-500" }, "Note Color"),
                                            React.createElement("input", { type: "color", value: form.note_color, onChange: (e) => setForm((p) => ({ ...p, note_color: e.target.value })), className: "h-10 w-full rounded border" }))),
                                    React.createElement("label", { className: "text-sm" },
                                        React.createElement("div", { className: "mb-1 text-xs text-gray-500" },
                                            "Overlay Strength (",
                                            form.overlay_strength,
                                            ")"),
                                        React.createElement("input", { type: "range", min: 0, max: 80, value: form.overlay_strength, onChange: (e) => setForm((p) => ({
                                                ...p,
                                                overlay_strength: Number(e.target.value),
                                            })), className: "w-full" })),
                                    React.createElement("div", { className: "grid gap-2 sm:grid-cols-2" },
                                        React.createElement("label", { className: "flex items-center gap-2 text-sm" },
                                            React.createElement("input", { type: "checkbox", checked: form.show_fb_buttons, onChange: (e) => setForm((p) => ({
                                                    ...p,
                                                    show_fb_buttons: e.target.checked,
                                                })) }),
                                            "Show Facebook buttons"),
                                        React.createElement("label", { className: "flex items-center gap-2 text-sm" },
                                            React.createElement("input", { type: "checkbox", checked: form.is_active, onChange: (e) => setForm((p) => ({ ...p, is_active: e.target.checked })) }),
                                            "Active"))),
                                React.createElement("div", { className: "rounded-xl border overflow-hidden" },
                                    React.createElement("div", { className: "relative aspect-video bg-black" },
                                        imgPreview ? (React.createElement(React.Fragment, null,
                                            React.createElement("img", { src: imgPreview, alt: "", className: "absolute inset-0 h-full w-full object-cover opacity-90" }),
                                            React.createElement("div", { className: "absolute inset-0", style: {
                                                    background: `rgba(0,0,0,${Math.min(80, Math.max(0, form.overlay_strength)) /
                                                        100})`,
                                                } }))) : (React.createElement("div", { className: "absolute inset-0 grid place-items-center text-white/70 text-sm" }, "Upload an image to preview")),
                                        React.createElement("div", { className: [
                                                "absolute inset-0 flex p-4",
                                                form.align === "center"
                                                    ? "items-center justify-center text-center"
                                                    : form.align === "right"
                                                        ? "items-center justify-end text-right"
                                                        : "items-center justify-start text-left",
                                            ].join(" ") },
                                            React.createElement("div", { className: "max-w-[92%]" },
                                                React.createElement("div", { className: "text-xl sm:text-2xl font-black leading-tight", style: { color: form.title_color } }, form.title || "Banner Title"),
                                                form.subtitle ? (React.createElement("div", { className: "mt-1 text-xs sm:text-sm", style: { color: form.subtitle_color } }, form.subtitle)) : null,
                                                form.note_text ? (React.createElement("div", { className: "mt-2 text-[11px] sm:text-xs", style: { color: form.note_color } }, form.note_text)) : null,
                                                React.createElement("div", { className: "mt-3 flex flex-wrap gap-2" },
                                                    form.cta_text && form.cta_href ? (React.createElement("div", { className: "rounded-md bg-red-600 px-3 py-2 text-[11px] sm:text-xs font-semibold text-white" }, form.cta_text)) : null,
                                                    form.show_fb_buttons ? (React.createElement(React.Fragment, null,
                                                        React.createElement("div", { className: "rounded-md border border-white/40 bg-white/10 px-3 py-2 text-[11px] sm:text-xs font-semibold text-white" }, "Message on Facebook"),
                                                        React.createElement("div", { className: "rounded-md border border-white/40 bg-white/10 px-3 py-2 text-[11px] sm:text-xs font-semibold text-white" }, "Like our Page"))) : null)))),
                                    React.createElement("div", { className: "p-3 text-xs text-gray-500" }, "Live preview")))),
                        React.createElement("div", { className: "shrink-0 sticky bottom-0 z-10 bg-white flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end sm:p-5" },
                            React.createElement("button", { onClick: () => setOpen(false), className: "w-full sm:w-auto border rounded px-4 py-2 text-sm" }, "Cancel"),
                            React.createElement("button", { onClick: onSave, disabled: saving || imgUploading, className: "w-full sm:w-auto bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-60" }, saving ? "Saving…" : "Save")))))))));
}
