import "dotenv/config";
import { PrismaClient } from "@prisma/client";
if (
  process.env.ANUMITRA_TEST_TARGET &&
  (!process.env.DATABASE_URL ||
    !/^anumitra_test_[a-z0-9_]+$/.test(
      new URL(process.env.DATABASE_URL).pathname.slice(1),
    ))
)
  throw new Error("Tests require an explicitly marked disposable database");
export const db = new PrismaClient();
export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
