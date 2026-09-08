import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function createClient() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const schema = process.env.DATABASE_SCHEMA || "public";
  if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error("Invalid DATABASE_SCHEMA");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  return new PrismaClient({
    adapter: new PrismaPg(pool, {
      schema: schema === "public" ? undefined : schema,
      disposeExternalPool: true,
    }),
  });
}
export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
