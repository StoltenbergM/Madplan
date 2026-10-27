import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Madplan – uden fruktaner",
    short_name: "Madplan",
    description: "Ugeplan og indkøbsliste med retter uden fruktaner",
    lang: "da",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#2f6b4f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
