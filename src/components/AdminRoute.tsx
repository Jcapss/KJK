// src/components/AdminRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "admin" | "no-access">(
    "loading"
  );
  const location = useLocation();

  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) get current auth user
      const { data: userRes, error: userErr } = await supabase.auth.getUser();

      if (!alive) return;

      const user = userRes?.user;
      if (userErr || !user) {
        setStatus("no-access");
        return;
      }

      // 2) check role in public.users
      const { data: profile, error: roleErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(); // ✅ does NOT error if row missing

      if (!alive) return;

      if (roleErr) {
        console.error("Role check error:", roleErr.message);
        setStatus("no-access");
        return;
      }

      if (profile?.role === "admin") setStatus("admin");
      else setStatus("no-access");
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ nice loading UI (no “Access Denied” flash)
  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 text-black">
        <div className="rounded-2xl bg-white px-6 py-4 shadow">
          <div className="text-sm font-semibold">Checking admin access…</div>
        </div>
      </div>
    );
  }

  // ✅ if not admin, go login, remember where they tried to go
  if (status !== "admin") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
