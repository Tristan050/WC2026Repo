import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "hourly", priority: 1 }
  ];

  const matches = await prisma.match.findMany({
    select: { updatedAt: true, matchNumber: true }
  });

  const matchPages: MetadataRoute.Sitemap = matches.map((m) => ({
    url: `${siteUrl}/?match=${m.matchNumber}`,
    lastModified: m.updatedAt,
    changeFrequency: "hourly",
    priority: 0.7
  }));

  return [...staticPages, ...matchPages];
}
