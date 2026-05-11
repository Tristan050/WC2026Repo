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
    { url: `${siteUrl}/`,              changeFrequency: "hourly",  priority: 1.0 },
    { url: `${siteUrl}/leaderboard`,   changeFrequency: "hourly",  priority: 0.8 },
  ];

  try {
    const [matches, groupCodes, teamSlots] = await Promise.all([
      // All match pages
      prisma.match.findMany({
        select: {
          updatedAt: true,
          status: true,
          kickoffUtc: true,
          homeSlot: { select: { label: true } },
          awaySlot: { select: { label: true } },
        },
        orderBy: { kickoffUtc: "asc" },
      }),
      // Distinct group codes
      prisma.teamSlot.findMany({
        where: { kind: "TEAM", groupCode: { not: null } },
        select: { groupCode: true, updatedAt: true },
        distinct: ["groupCode"],
      }),
      // All team slugs
      prisma.teamSlot.findMany({
        where: { kind: "TEAM" },
        select: { label: true, updatedAt: true },
      }),
    ]);

    const matchPages: MetadataRoute.Sitemap = matches
      .filter(m => m.homeSlot?.label && m.awaySlot?.label)
      .map(m => ({
        url: `${siteUrl}/match/${matchSlug(m.homeSlot!.label, m.awaySlot!.label)}`,
        lastModified: m.updatedAt,
        changeFrequency: m.status === "FINISHED" ? "monthly" : "hourly",
        priority: m.status === "FINISHED" ? 0.5 : 0.8,
      }));

    const groupPages: MetadataRoute.Sitemap = groupCodes
      .filter(g => g.groupCode)
      .map(g => ({
        url: `${siteUrl}/group/${g.groupCode!.toLowerCase()}`,
        lastModified: g.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.75,
      }));

    const teamPages: MetadataRoute.Sitemap = teamSlots.map(t => ({
      url: `${siteUrl}/team/${toSlug(t.label)}`,
      lastModified: t.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...matchPages, ...groupPages, ...teamPages];
  } catch {
    return staticPages;
  }
}
