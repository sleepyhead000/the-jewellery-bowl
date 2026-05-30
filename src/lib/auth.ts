import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";
import { rateLimit } from "@/lib/rate-limit";

type Role = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN";

const GOOGLE_ADMIN_EMAIL = "khanchowdhuryn@gmail.com";

const getGoogleProviders = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return [];
  }

  return [
    Google({
      clientId,
      clientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ];
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      role: Role;
      image?: string | null;
    };
  }

  interface User {
    phone?: string | null;
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    phone?: string | null;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 30,
  },
  adapter: PrismaAdapter(db) as never,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (user.email?.toLowerCase() !== GOOGLE_ADMIN_EMAIL) {
        return true;
      }

      await db.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", emailVerified: new Date() },
      });
      (user as unknown as Record<string, unknown>).role = "ADMIN";
      return true;
    },
  },
  providers: [
    ...getGoogleProviders(),
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const login = (credentials.login as string).trim();
        const password = credentials.password as string;
        const keyLogin = login.toLowerCase();
        const lockKey = `auth:lock:${keyLogin}`;
        const isLocked = await db.setting.findUnique({ where: { key: lockKey } });
        if (isLocked && typeof isLocked.value === "object" && isLocked.value) {
          const until = Number((isLocked.value as Record<string, unknown>).until || 0);
          if (until > Date.now()) return null;
          await db.setting.delete({ where: { key: lockKey } }).catch(() => null);
        }

        const loginLimit = await rateLimit(`auth:login:${keyLogin}`, 8, 300);
        if (!loginLimit.allowed) return null;

        // Determine if login is email or phone
        const isEmail = login.includes("@");
        const user = await db.user.findUnique({
          where: isEmail ? { email: login } : { phone: login },
        });

        if (!user || !user.passwordHash) {
          await db.setting.upsert({
            where: { key: `auth:fail:${keyLogin}` },
            update: { value: { count: 1, at: Date.now() } },
            create: { key: `auth:fail:${keyLogin}`, value: { count: 1, at: Date.now() } },
          });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          const failKey = `auth:fail:${keyLogin}`;
          const existing = await db.setting.findUnique({ where: { key: failKey } });
          const prev = existing?.value as Record<string, unknown> | undefined;
          const count = Number(prev?.count || 0) + 1;
          await db.setting.upsert({
            where: { key: failKey },
            update: { value: { count, at: Date.now() } },
            create: { key: failKey, value: { count, at: Date.now() } },
          });
          if (count >= 5) {
            await db.setting.upsert({
              where: { key: lockKey },
              update: { value: { until: Date.now() + 15 * 60 * 1000 } },
              create: { key: lockKey, value: { until: Date.now() + 15 * 60 * 1000 } },
            });
          }
          return null;
        }

        await db.setting.deleteMany({
          where: { key: { in: [`auth:fail:${keyLogin}`, lockKey] } },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role as Role,
          image: user.avatar,
        };
      },
    }),
  ],
});
