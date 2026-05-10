import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";

function toSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function matchSlug(home: string, away: string): string {
  return `${toSlug(home)}-vs-${toSlug(away)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "hourly", priority: 1.0 },
  ];

  try {
    const matches = await prisma.match.findMany({
      select: {
        updatedAt: true,
        status: true,
        kickoffUtc: true,
        homeSlot: { select: { label: true } },
        awaySlot: { select: { label: true } },
      },
      orderBy: { kickoffUtc: "asc" },
    });

    const matchPages: MetadataRoute.Sitemap = matches
      .filter((m) => m.homeSlot?.label && m.awaySlot?.label)
      .map((m) => ({
        url: `${siteUrl}/match/${matchSlug(m.homeSlot!.label, m.awaySlot!.label)}`,
        lastModified: m.updatedAt,
        // Upcoming matches change more often (odds, window status)
        changeFrequency: m.status === "FINISHED" ? "monthly" : "hourly",
        priority: m.status === "FINISHED" ? 0.5 : 0.8,
      }));

    return [...staticPages, ...matchPages];
  } catch {
    return staticPages;
  }
}
