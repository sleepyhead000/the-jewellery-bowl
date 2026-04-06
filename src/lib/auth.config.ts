import type { NextAuthConfig } from "next-auth";

type Role = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN";

/**
 * Edge-compatible auth configuration.
 * Used by middleware (Edge Runtime) — must NOT import Prisma or Node.js modules.
 * The full auth config in auth.ts extends this with the Prisma adapter and providers.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // Populated in auth.ts — empty here to keep edge-compatible
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.phone = (user as unknown as Record<string, unknown>).phone as string | null;
        token.role = (user as unknown as Record<string, unknown>).role as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.phone = token.phone as string | null;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
