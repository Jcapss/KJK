export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  image: string; // path from /public (e.g. "/banners/banner1.jpg")
  ctaText?: string;
  ctaHref?: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    title: "TECH ALL YOU CAN",
    subtitle: "Your Choice, We Build — Parts • Laptops • CCTV • Services",
    image: "/banners/banner1.jpg",
    ctaText: "Shop Now",
    ctaHref: "#products",
  },
  {
    id: "slide-2",
    title: "NEW ARRIVALS",
    subtitle: "Latest GPUs, SSDs, and Gaming Laptops in stock",
    image: "/banners/banner3.jpg",
    ctaText: "Browse Products",
    ctaHref: "#products",
  },
  {
      id: "slide-3",
      title: "CCTV PACKAGES",
      subtitle: "Site visit • Installation • Mobile viewing setup",
      image: "/banners/hik.jpg",
      ctaText: "Request Quote",
      ctaHref: "#contact",
    },
];
