import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GIM Bazaar",
    short_name: "GIM Bazaar",
    description:
      "Campus marketplace for GIM students — buy, sell, and trade with fellow students.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf1f2",
    theme_color: "#7f2739",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
