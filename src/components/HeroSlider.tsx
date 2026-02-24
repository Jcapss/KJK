import React, { useEffect, useMemo, useState } from "react";

// ✅ Export this so HomePage can import it
export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  ctaText?: string | null;
  ctaHref?: string | null;
};

// ✅ CHANGE THESE to your real FB page
const FB_PAGE_URL = "https://www.facebook.com/kjktechshop";
const FB_MESSAGE_URL = "https://www.facebook.com/kjktechshop";

export default function HeroSlider({
  slides,
  autoPlay = true,
  intervalMs = 5000,
}: {
  slides: HeroSlide[];
  autoPlay?: boolean;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const active = safeSlides[index];

  function prev() {
    setIndex((i) => (i - 1 + safeSlides.length) % safeSlides.length);
  }

  function next() {
    setIndex((i) => (i + 1) % safeSlides.length);
  }

  useEffect(() => {
    if (!autoPlay || safeSlides.length <= 1) return;
    const t = setInterval(() => next(), intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, intervalMs, safeSlides.length]);

  if (!safeSlides.length) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div className="relative h-[360px] sm:h-[520px] md:h-[640px]">
        {/* ✅ Layer 1: Blurred full-bleed background (fills, no black bars) */}
        <img
          src={active.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-80"
          loading="lazy"
        />

        {/* ✅ Soft dark wash to keep text readable */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        {/* ✅ Layer 2: Sharp banner (NOT CUT) */}
        <img
          src={active.image}
          alt={active.title}
          className="absolute inset-0 h-full w-full object-contain"
          loading="lazy"
        />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
            <div className="max-w-3xl text-white">
              <div className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] drop-shadow">
                {active.title}
              </div>

              {active.subtitle ? (
                <div className="mt-3 text-sm sm:text-base text-white/90 drop-shadow">
                  {active.subtitle}
                </div>
              ) : null}

              <div className="mt-2 text-xs text-white/80">
                Follow us on Facebook for promos & new arrivals.
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {active.ctaText && active.ctaHref ? (
                  <a
                    href={active.ctaHref}
                    className="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    {active.ctaText}
                  </a>
                ) : null}

                <a
                  href={FB_MESSAGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Message on Facebook
                </a>

                <a
                  href={FB_PAGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Like our Page
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Prev/Next arrows */}
        <button
          onClick={prev}
          type="button"
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
        >
          ‹
        </button>
        <button
          onClick={next}
          type="button"
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {safeSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={[
                "h-2.5 w-2.5 rounded-full transition",
                i === index ? "bg-white" : "bg-white/45 hover:bg-white/70",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}