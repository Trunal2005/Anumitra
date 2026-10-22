import "dotenv/config";
import { PrismaClient } from "@prisma/client";
export const db = new PrismaClient();
export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
