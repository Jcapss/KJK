// src/components/HeaderBar.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCategories, type CategoryDbRow } from "../data/categoriesApi";
import { supabase } from "../lib/supabase";
import kjkLogo from "../assets/kjk-logo.jpg";

type CategoryOption = {
  value: string;
  label: string;
};

type ProfileInfo = {
  full_name: string | null;
  role: string;
  approval_status: string;
};

export default function HeaderBar({
  activeCategory = "all",
  cartCount = 0,
  onOpenCart,
}: {
  activeCategory?: string;
  cartCount?: number;
  onOpenCart?: () => void;
}) {
  const nav = useNavigate();
  const location = useLocation();

  const [cats, setCats] = useState<CategoryDbRow[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function loadCategories() {
    setCatsLoading(true);
    try {
      const data = await fetchCategories();
      setCats(data);
    } catch {
      setCats([]);
    } finally {
      setCatsLoading(false);
    }
  }

  async function loadAuthState() {
    try {
      setAuthLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);

      if (!user) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, approval_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      setProfile(data);
      setAuthLoading(false);
    } catch {
      setUser(null);
      setProfile(null);
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAuthState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const options = useMemo<CategoryOption[]>(() => {
    const base: CategoryOption[] = [{ value: "all", label: "All" }];
    const fromDb = cats.map((c) => ({
      value: c.slug,
      label: c.label,
    }));
    return base.concat(fromDb);
  }, [cats]);

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  const isAdmin = profile?.role === "admin";

  function goToCategory(value: string) {
    if (value === "all") nav("/");
    else nav(`/category/${encodeURIComponent(value)}`);
  }

  function scrollToFooter() {
    if (location.pathname !== "/") {
      nav("/");
      setTimeout(() => {
        document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return;
    }
    document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    nav("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">

        {/* DESKTOP */}
        <div className="hidden lg:flex items-center gap-3">

          {/* Brand */}
          <button
            type="button"
            onClick={() => nav("/")}
            className="flex items-center gap-3 text-left shrink-0"
          >
            <img
              src={kjkLogo}
              alt="KJK TechShop"
              className="h-11 w-11 rounded-2xl object-cover"
            />

            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">
                KJK TechShop Computer Store
              </div>
              <div className="text-xs text-black/60">
                Parts • Laptops • CCTV • Services
              </div>
            </div>
          </button>

          <div className="flex-1" />

          {/* Category */}
          <select
            value={activeCategory}
            onChange={(e) => goToCategory(e.target.value)}
            className="w-[240px] rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-medium outline-none hover:bg-black/5"
          >
            {catsLoading ? <option value="all">Loading…</option> : null}

            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Cart */}
          <button
            onClick={() => onOpenCart?.()}
            className="relative rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5"
          >
            Cart

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[11px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {/* Contact */}
          <button
            onClick={scrollToFooter}
            className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Contact
          </button>

          {/* AUTH */}
          {authLoading ? (
            <div className="text-sm text-black/50">Checking...</div>
          ) : !user ? (
            <>
              <button
                onClick={() => nav("/login")}
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-black/5"
              >
                Login
              </button>

              <button
                onClick={() => nav("/register")}
                className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold">
                Hello, {displayName}
              </div>

              {profile?.approval_status === "pending" && (
                <div className="text-yellow-600 text-sm font-semibold">
                  Pending Approval
                </div>
              )}

              {profile?.approval_status === "rejected" && (
                <div className="text-red-600 text-sm font-semibold">
                  Not Approved
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => nav("/admin-dashboard")}
                  className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                >
                  Admin Panel
                </button>
              )}

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2"
          >
            <img
              src={kjkLogo}
              alt="KJK TechShop"
              className="h-9 w-9 rounded-2xl object-cover"
            />

            <div className="text-[13px] font-extrabold">
              KJK TechShop
            </div>
          </button>

          <button
            onClick={() => onOpenCart?.()}
            className="relative rounded-2xl border border-black/10 bg-white px-3 py-2"
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-black px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}