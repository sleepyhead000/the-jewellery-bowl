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

  // Allow build-time type/page-data collection to complete when secrets are not
  // injected at build-time. Do not use this fallback at runtime.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.VERCEL === "1" && isBuildPhase) {
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
