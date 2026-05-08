import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // Expose user id + app fields to the session
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as { username?: string }).username ?? null;
        session.user.points = (user as { points?: number }).points ?? 0;
        session.user.xp = (user as { xp?: number }).xp ?? 0;
        session.user.streakCurrent = (user as { streakCurrent?: number }).streakCurrent ?? 0;
        session.user.streakBest = (user as { streakBest?: number }).streakBest ?? 0;
        session.user.role = (user as { role?: string }).role ?? "USER";
      }
      return session;
    },

    // Auto-generate a username from the Google display name on first sign-in
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });

        if (!existing?.username) {
          const base = (user.name ?? "fan")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 16);

          for (let attempt = 0; attempt < 5; attempt += 1) {
            const suffix = Math.floor(Math.random() * 9000) + 1000;
            const username = `${base}${suffix}`;
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { username },
              });
              break;
            } catch (err) {
              const isUnique = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
              if (!isUnique) {
                console.error("[auth] username assign failed", err);
                break;
              }
            }
          }
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/",   // stay on homepage, use modal
    error: "/",
  },

  trustHost: true,
});