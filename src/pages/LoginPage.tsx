// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

    // check role in public.users
    const { data: profile, error: roleErr } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    setLoading(false);

    if (roleErr) {
      setErr(roleErr.message);
      return;
    }

    if (profile?.role === "admin") nav("/admin-dashboard");
    else nav("/"); // normal users go home
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
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

        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
