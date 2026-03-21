import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui";
import type { ProductRow } from "../types/db";
import { supabase } from "../lib/supabase";

type ProfileInfo = {
  role: string;
  approval_status: string;
};

function normalizeServiceType(value?: string | null) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "solar") return "solar";
  if (v === "cctv") return "cctv";
  return "other";
}

export default function ProductCard({
  item,
  onView,
}: {
  item: ProductRow;
  onView: (id: string) => void;
}) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!alive) return;

        if (!user) {
          setProfile(null);
          setCheckingAccess(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role, approval_status")
          .eq("id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (error || !data) {
          setProfile(null);
          setCheckingAccess(false);
          return;
        }

        setProfile(data);
        setCheckingAccess(false);
      } catch {
        if (!alive) return;
        setProfile(null);
        setCheckingAccess(false);
      }
    }

    loadAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAccess();
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const isService = item.category_slug === "services";
  const serviceType = isService ? normalizeServiceType(item.service_type) : "other";
  const isSolarService = isService && serviceType === "solar";
  const isCctvService = isService && serviceType === "cctv";

  const isServiceQuote = isService && Number(item.price) === 0;

  const categoryName =
    item.category_slug === "cpu"
      ? "CPU"
      : item.category_slug === "gpu"
      ? "GPU"
      : item.category_slug.charAt(0).toUpperCase() + item.category_slug.slice(1);

  const canViewPrice =
    !!profile &&
    (profile.role === "admin" || profile.approval_status === "approved");

  const showPendingMessage =
    !!profile &&
    profile.role !== "admin" &&
    (profile.approval_status === "pending" ||
      profile.approval_status === "rejected");

  const solarMeta = useMemo(() => {
    if (!isSolarService) return "";
    const parts: string[] = [];
    if (typeof item.kw_size === "number") parts.push(`${item.kw_size}KW`);
    if (item.system_type) parts.push(item.system_type);
    return parts.join(" • ");
  }, [isSolarService, item.kw_size, item.system_type]);

  const categorySlug = String(item.category_slug ?? "").toLowerCase();
  const isRam = categorySlug === "ram";
  const isMonitor = categorySlug === "monitor";

  const primaryMetaLabel = isRam ? "Generation" : "Product Brand";
  const primaryMetaValue = item.brand?.trim() || "";
  const partneredBrandValue = isRam ? item.partner_brand?.trim() || "" : "";

  const shouldShowMeta =
    (isRam || isMonitor) && (primaryMetaValue || partneredBrandValue);

  const serviceLabel = isSolarService
    ? "Solar Service"
    : isCctvService
    ? "CCTV Service"
    : isService
    ? "Service"
    : "";

  return (
    <button
      type="button"
      onClick={() => onView(item.id)}
      className="block h-full w-full text-left"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-56 border-b border-black/10 bg-white">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="absolute inset-0 h-full w-full bg-white object-contain p-3"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-black/5 to-black/10 text-6xl">
              {item.icon ?? "📦"}
            </div>
          )}

          {item.badge ? (
            <div className="absolute right-3 top-3">
              <Badge>{item.badge}</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="min-h-[120px]">
            <div className="line-clamp-2 text-base font-semibold text-black">
              {item.name}
            </div>

            {isSolarService && solarMeta ? (
              <div className="mt-1 text-xs font-semibold text-green-700">
                {solarMeta}
              </div>
            ) : null}

            <div className="mt-1 line-clamp-2 text-sm text-black/60">
              {item.description}
            </div>

            {shouldShowMeta ? (
              <div className="mt-3 space-y-1 text-xs">
                {primaryMetaValue ? (
                  <div className="text-black/70">
                    <span className="font-semibold text-black">
                      {primaryMetaLabel}:
                    </span>{" "}
                    {primaryMetaValue}
                  </div>
                ) : null}

                {isRam && partneredBrandValue ? (
                  <div className="text-black/70">
                    <span className="font-semibold text-black">
                      Partnered Brand:
                    </span>{" "}
                    {partneredBrandValue}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <div className="text-sm text-black/60">{categoryName}</div>

              {checkingAccess ? (
                <div className="text-lg font-bold text-black/40">Checking...</div>
              ) : canViewPrice ? (
                <div className="text-lg font-bold">
                  {isServiceQuote
                    ? "For quotation"
                    : `₱${Number(item.price).toLocaleString()}`}
                </div>
              ) : (
                <div className="text-sm font-semibold text-blue-600">
                  {showPendingMessage ? "Awaiting approval" : "Login to view price"}
                </div>
              )}

              {isService ? (
                <div className="text-xs text-black/50">{serviceLabel}</div>
              ) : !canViewPrice && !checkingAccess ? (
                <div className="text-xs text-black/50">
                  Approved accounts only
                </div>
              ) : null}
            </div>

            <span className="whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
              View Details
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}