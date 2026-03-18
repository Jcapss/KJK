// src/pages/AdminUsersPage.tsx
import React, { useEffect, useState } from "react";
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-black/60">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-black/60">No registered users found.</div>
        ) : (
          <>
            {/* Desktop table */}
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
                  {users.map((user) => {
                    const isBusy = savingId === user.id;

                    return (
                      <tr key={user.id} className="border-b border-black/10 last:border-b-0">
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

                        <td className="px-4 py-4">{statusBadge(user.approval_status)}</td>

                        <td className="px-4 py-4 text-black/60">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleString()
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isBusy || user.approval_status === "approved"}
                              onClick={() => updateStatus(user.id, "approved")}
                              className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Saving..." : "Approve"}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy || user.approval_status === "rejected"}
                              onClick={() => updateStatus(user.id, "rejected")}
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Saving..." : "Reject"}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy || user.approval_status === "pending"}
                              onClick={() => updateStatus(user.id, "pending")}
                              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? "Saving..." : "Set Pending"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {users.map((user) => {
                const isBusy = savingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{user.full_name || "No name"}</div>
                        <div className="text-sm text-black/60">
                          {user.email || "No email"}
                        </div>
                      </div>
                      {statusBadge(user.approval_status)}
                    </div>

                    <div className="mt-3 text-xs text-black/60">
                      <div>Role: {user.role}</div>
                      <div className="mt-1">
                        Created:{" "}
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy || user.approval_status === "approved"}
                        onClick={() => updateStatus(user.id, "approved")}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Saving..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy || user.approval_status === "rejected"}
                        onClick={() => updateStatus(user.id, "rejected")}
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Saving..." : "Reject"}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy || user.approval_status === "pending"}
                        onClick={() => updateStatus(user.id, "pending")}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? "Saving..." : "Set Pending"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}