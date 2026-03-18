import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setErr("No user returned.");
      setLoading(false);
      return;
    }

    // check role and approval
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) {
      setErr(profileErr.message);
      setLoading(false);
      return;
    }

    if (!profile) {
      setErr("Profile not found.");
      setLoading(false);
      return;
    }

    // admin redirect
    if (profile.role === "admin") {
      setLoading(false);
      nav("/admin-dashboard");
      return;
    }

    // pending users
    if (profile.approval_status === "pending") {
      await supabase.auth.signOut();
      setErr("Your account is still pending admin approval.");
      setLoading(false);
      return;
    }

    // rejected users
    if (profile.approval_status === "rejected") {
      await supabase.auth.signOut();
      setErr("Your account was not approved. Please contact admin.");
      setLoading(false);
      return;
    }

    // approved users
    setLoading(false);
    nav("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4">

      {/* Back Button */}
      <div className="max-w-md mx-auto pt-10">
        <button
          onClick={() => nav("/")}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Login Form */}
      <div className="grid place-items-center pt-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow"
        >
          <h1 className="text-2xl font-black">Login</h1>

          <label className="mt-5 block text-sm font-semibold">Email</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />

          <label className="mt-4 block text-sm font-semibold">Password</label>
          <input
            className="mt-2 w-full rounded-xl border px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />

          {err ? (
            <div className="mt-3 text-sm text-red-600">{err}</div>
          ) : null}

          <button
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="mt-4 text-center text-sm text-black/60">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-black hover:underline"
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}