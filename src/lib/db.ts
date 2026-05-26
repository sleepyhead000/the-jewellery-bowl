import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const resolveConnectionString = (): string => {
  const configured = process.env.DATABASE_URL;
  if (configured && configured.trim().length > 0) {
    return configured;
  }

  // Allow Vercel build-time type/page-data collection to complete even when
  // runtime secrets are not injected in the build environment.
  if (process.env.VERCEL === "1") {
    return "file:./.vercel-build-fallback.db";
  }

  throw new Error("DATABASE_URL is not set");
};

const connectionString = resolveConnectionString();
if (/\[[^\]]+\]/.test(connectionString)) {
  throw new Error(
    "DATABASE_URL contains placeholder tokens like [PROJECT-REF]. Replace it with a real Postgres connection string in .env."
  );
}
const isSqlite = connectionString.startsWith("file:");
const isPostgres =
  connectionString.startsWith("postgresql://") ||
  connectionString.startsWith("postgres://");

if (!isSqlite && !isPostgres) {
  throw new Error(
    "DATABASE_URL must start with file: (SQLite) or postgresql:// (Postgres)."
  );
}

const adapter = isSqlite
  ? new PrismaBetterSqlite3({ url: connectionString })
  : new PrismaPg({ connectionString });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
