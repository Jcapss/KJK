import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock: number | null;
  badge: string | null;
  icon: string | null;
  category_slug: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  kw_size?: number | null;
  system_type?: string | null;
  quotation_pdf?: string | null;
  includes?: string | null;
  service_type?: string | null;
};

const ITEMS_PER_PAGE = 20;

function normalizeServiceType(value?: string | null) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "solar") return "solar";
  if (v === "cctv") return "cctv";
  return "other";
}

function formatCategoryLabel(slug?: string | null) {
  const value = String(slug ?? "").trim();
  if (!value) return "Uncategorized";

  return value
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "cpu" || lower === "gpu" || lower === "ssd" || lower === "hdd" || lower === "nvme") {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  async function fetchProducts() {
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setProducts([]);
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleEditProduct(productId: string) {
    navigate(`/admin/products/${productId}`);
  }

  async function handleDeleteProduct(productId: string) {
    const ok = confirm("Delete this product?");
    if (!ok) return;

    setDeletingId(productId);

    const { error } = await supabase.from("products").delete().eq("id", productId);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    fetchProducts();
  }

  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((p) => String(p.category_slug ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return unique;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeOnly) {
      list = list.filter((p) => p.is_active);
    }

    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category_slug === categoryFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay =
          `${p.name} ${p.description} ${p.category_slug} ${p.system_type ?? ""} ${p.kw_size ?? ""} ${p.service_type ?? ""} ${p.includes ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [products, search, activeOnly, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeOnly, categoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function priceLabel(v: number | string) {
    const n = Number(v ?? 0);
    return `₱${Number.isFinite(n) ? n.toLocaleString() : "0"}`;
  }

  function getProductMeta(p: Product) {
    if (p.category_slug !== "services") return null;

    const serviceType = normalizeServiceType(p.service_type);

    if (serviceType === "solar") {
      const parts: string[] = [];
      if (typeof p.kw_size === "number") parts.push(`${p.kw_size}KW`);
      if (p.system_type) parts.push(p.system_type);
      return parts.length ? parts.join(" • ") : "Solar Service";
    }

    if (serviceType === "cctv") {
      return "CCTV Service";
    }

    return "Service";
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Products</div>
          <div className="text-sm text-black/60">
            Add, edit, and delete products.
          </div>
        </div>

        <button
          onClick={() => navigate("/admin/products/new")}
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          type="button"
        >
          + Add Product
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 lg:grid-cols-[1fr_220px_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, description, category, service type..."
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        >
          <option value="all">All Categories</option>
          {categoryOptions.map((slug) => (
            <option key={slug} value={slug}>
              {formatCategoryLabel(slug)}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-black/60">
        <div>
          Showing {paginatedProducts.length} of {filteredProducts.length} product(s)
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/60">
            No products found.
          </div>
        ) : (
          paginatedProducts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-black/5">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.name}</div>
                      {getProductMeta(p) ? (
                        <div className="text-xs font-semibold text-green-700">
                          {getProductMeta(p)}
                        </div>
                      ) : null}
                    </div>

                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        p.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600",
                      ].join(" ")}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm text-black/60">
                    {p.description}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-xl bg-black/5 px-3 py-1 text-xs font-semibold text-black/70">
                      {formatCategoryLabel(p.category_slug)}
                    </span>
                    <span className="font-semibold">{priceLabel(p.price)}</span>
                    <span className="text-black/60">Stock: {p.stock ?? 0}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditProduct(p.id)}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5"
                      type="button"
                    >
                      Edit
                    </button>

                    <button
                      disabled={deletingId === p.id}
                      onClick={() => handleDeleteProduct(p.id)}
                      className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      type="button"
                    >
                      {deletingId === p.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-black/10 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 text-xs uppercase text-black/60">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-black/60" colSpan={6}>
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-black/60" colSpan={6}>
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="border-t border-black/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-black/5">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold">{p.name}</div>
                          {getProductMeta(p) ? (
                            <div className="text-xs font-semibold text-green-700">
                              {getProductMeta(p)}
                            </div>
                          ) : null}
                          <div className="max-w-[340px] truncate text-xs text-black/60">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-black/70">
                      {formatCategoryLabel(p.category_slug)}
                    </td>

                    <td className="px-4 py-3 font-semibold">{priceLabel(p.price)}</td>

                    <td className="px-4 py-3">{p.stock ?? 0}</td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          p.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditProduct(p.id)}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5"
                          type="button"
                        >
                          Edit
                        </button>

                        <button
                          disabled={deletingId === p.id}
                          onClick={() => handleDeleteProduct(p.id)}
                          className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          type="button"
                        >
                          {deletingId === p.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalPages > 1 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                currentPage === page
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black hover:bg-black/5"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-black/50">
        Tip: If you see empty products here but you have data, check RLS policies for{" "}
        <b>SELECT</b> on <b>products</b>.
      </div>
    </AdminLayout>
  );
}