import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString || connectionString.trim().length === 0) {
  throw new Error("DATABASE_URL is not set");
}
if (/\[[^\]]+\]/.test(connectionString)) {
  throw new Error(
    "DATABASE_URL contains placeholder tokens like [PROJECT-REF]. Replace it with a real Postgres connection string in .env."
  );
}
const isPostgres =
  connectionString.startsWith("postgresql://") ||
  connectionString.startsWith("postgres://");

if (!isPostgres) {
  throw new Error(
    "DATABASE_URL must start with postgresql:// (or postgres://)."
  );
}

const adapter = new PrismaPg({ connectionString });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
