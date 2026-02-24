// src/pages/AdminProductsPage.tsx
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
  icon: string | null; // (legacy, safe to keep)
  category_slug: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

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

  const filteredProducts = useMemo(() => {
    let list = products;

    if (activeOnly) list = list.filter((p) => p.is_active);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.description} ${p.category_slug}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [products, search, activeOnly]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-black">Products</div>
          <div className="text-sm text-black/60">Add, edit, and delete products.</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
            type="button"
          >
            Refresh
          </button>

          <button
            onClick={() => navigate("/admin/products/new")}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            type="button"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / category / description..."
          className="w-full sm:w-[360px] rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />

        <label className="inline-flex items-center gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>

        <div className="text-sm text-black/50">
          {loading ? "Loading..." : `Showing ${filteredProducts.length} item(s)`}
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white">
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
                filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-black/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* ✅ Image replaces emoji icon */}
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
                          <div className="truncate text-xs text-black/60 max-w-[340px]">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-black/70">{p.category_slug}</td>

                    <td className="px-4 py-3 font-semibold">
                      ₱{Number(p.price).toLocaleString()}
                    </td>

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

      <div className="mt-4 text-xs text-black/50">
        Tip: If you see empty products here but you have data, check RLS policies for{" "}
        <b>SELECT</b> on <b>products</b>.
      </div>
    </AdminLayout>
  );
}
