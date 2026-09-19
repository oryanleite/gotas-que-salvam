import type { MetadataRoute } from "next";

// Defina NEXT_PUBLIC_SITE_URL nas variáveis de ambiente do Vercel (ou de
// qualquer outra hospedagem) assim que souber o domínio final do site.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gotas-que-salvam.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date("2026-09-01"), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacidade`, lastModified: new Date("2026-09-01"), changeFrequency: "monthly", priority: 0.5 },
  ];
}
