import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  approval_status: string;
  created_at?: string;
};

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  async function loadUsers() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, approval_status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }

  async function updateStatus(
    userId: string,
    nextStatus: "pending" | "approved" | "rejected"
  ) {
    setSavingId(userId);
    setErr(null);

    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: nextStatus })
      .eq("id", userId);

    if (error) {
      setErr(error.message);
      setSavingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, approval_status: nextStatus } : user
      )
    );

    setSavingId(null);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(start, start + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function statusBadge(status: string) {
    if (status === "approved") {
      return (
        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Approved
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        Pending
      </span>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-black/60">
            Approve or reject customer accounts before they can view prices and purchase.
          </p>
        </div>

        <button
          onClick={loadUsers}
          type="button"
          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* INFO */}
      <div className="mt-4 text-sm text-black/60">
        Showing {paginatedUsers.length} of {users.length} users • Page {currentPage} of {totalPages}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-black/60">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-black/60">No registered users found.</div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/[0.03]">
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left font-bold">Full Name</th>
                    <th className="px-4 py-3 text-left font-bold">Email</th>
                    <th className="px-4 py-3 text-left font-bold">Role</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-left font-bold">Created</th>
                    <th className="px-4 py-3 text-left font-bold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => {
                    const isBusy = savingId === user.id;

                    return (
                      <tr key={user.id} className="border-b border-black/10">
                        <td className="px-4 py-4 font-medium">
                          {user.full_name || "No name"}
                        </td>

                        <td className="px-4 py-4 text-black/70">
                          {user.email || "No email"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {statusBadge(user.approval_status)}
                        </td>

                        <td className="px-4 py-4 text-black/60">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              disabled={isBusy || user.approval_status === "approved"}
                              onClick={() => updateStatus(user.id, "approved")}
                              className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              {isBusy ? "Saving..." : "Approve"}
                            </button>

                            <button
                              disabled={isBusy || user.approval_status === "rejected"}
                              onClick={() => updateStatus(user.id, "rejected")}
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              {isBusy ? "Saving..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="space-y-3 p-4 md:hidden">
              {paginatedUsers.map((user) => {
                const isBusy = savingId === user.id;

                return (
                  <div key={user.id} className="rounded-2xl border p-4">
                    <div className="font-semibold">{user.full_name}</div>
                    <div className="text-sm text-black/60">{user.email}</div>
                    <div className="mt-2">{statusBadge(user.approval_status)}</div>

                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={isBusy}
                        onClick={() => updateStatus(user.id, "approved")}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs text-white"
                      >
                        Approve
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => updateStatus(user.id, "rejected")}
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg border px-3 py-1 text-sm"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-black text-white" : "border"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}