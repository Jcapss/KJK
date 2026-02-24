import React from "react";

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-black/70">
      {children}
    </span>
  );
}

export function PillButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-black text-white"
          : "bg-white text-black/80 border border-black/10 hover:bg-black/5",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}
