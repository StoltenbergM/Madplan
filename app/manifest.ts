import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Madplan – lav-FODMAP",
    short_name: "Madplan",
    description: "Ugeplan og indkøbsliste med lav-FODMAP retter",
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
