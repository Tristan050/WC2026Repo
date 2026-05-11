import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/* ── Resend welcome email via plain HTTP (no SDK required) ── */
async function sendWelcomeEmail(to: string, matches: { home: string; away: string; kickoff: Date }[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // gracefully skip if no key configured

  const matchRows = matches
    .slice(0, 5)
    .map(m => {
      const dt = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
      }).format(m.kickoff);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2e4a;font-size:14px;color:#c8d8e8">${m.home} <span style="color:#4a6a8a">vs</span> ${m.away}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2e4a;font-size:13px;color:#6a8aaa;white-space:nowrap">${dt} UTC</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#03080f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.02em">
        WORLD<span style="color:#4d94ff">CUP</span>CLUTCH
      </span>
    </div>
    <div style="background:#0a1a2e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px">
      <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px">⚽ You're in!</h1>
      <p style="color:#8aaac8;font-size:15px;margin:0 0 24px;line-height:1.6">
        We'll remind you before every World Cup 2026 match so you never miss a pick window.
        Correct picks earn <strong style="color:#4d94ff">+3 points</strong> + streak bonuses.
      </p>
      ${matchRows ? `
      <p style="color:#6a8aaa;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px">
        🎯 First matches to predict
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${matchRows}
      </table>` : ""}
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com"}"
         style="display:block;text-align:center;background:linear-gradient(135deg,#0052cc,#4d94ff);color:#fff;font-weight:700;font-size:15px;padding:14px;border-radius:10px;text-decoration:none">
        Make your picks →
      </a>
    </div>
    <p style="color:#2a4a6a;font-size:11px;text-align:center;margin-top:20px">
      You subscribed at worldcupclutch.com ·
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com"}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#2a4a6a">unsubscribe</a>
    </p>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "WorldCupClutch <picks@worldcupclutch.com>",
      to: [to],
      subject: "⚽ You're in — World Cup 2026 picks open now",
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Upsert subscriber — idempotent so double-submits are safe
    let isNew = false;
    try {
      await prisma.$executeRaw`
        INSERT INTO "EmailSubscriber" (id, email, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${email}, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `;
      // If we inserted 0 rows it was a conflict → not a new subscriber
      const row = await prisma.$queryRaw<{ email: string }[]>`
        SELECT email FROM "EmailSubscriber" WHERE email = ${email} AND "createdAt" > NOW() - INTERVAL '5 seconds'
      `;
      isNew = row.length > 0;
    } catch {
      // Table may not exist on old deployments — treat as new anyway
      isNew = true;
    }

    // Send welcome email only on first subscription (not on re-submits)
    if (isNew) {
      try {
        // Fetch the next 5 upcoming matches from DB for the email
        const upcomingMatches = await prisma.match.findMany({
          where: { kickoffUtc: { gt: new Date() }, status: "SCHEDULED" },
          orderBy: { kickoffUtc: "asc" },
          take: 5,
          include: { homeSlot: true, awaySlot: true },
        });
        const matchesForEmail = upcomingMatches.map(m => ({
          home: m.homeSlot?.label ?? "Home",
          away: m.awaySlot?.label ?? "Away",
          kickoff: m.kickoffUtc,
        }));
        await sendWelcomeEmail(email, matchesForEmail);
      } catch (emailErr) {
        // Don't fail the request if email sending fails
        console.error("[email/subscribe] welcome email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/subscribe]", err);
    // Graceful degradation
    return NextResponse.json({ ok: true });
  }
}
