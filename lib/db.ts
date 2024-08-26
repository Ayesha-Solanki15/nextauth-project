import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();
// we need all of this in development mode because Next.js causes hot reload and every time the server is reloaded, the globalThis.prisma is reset to undefined. So, we need to create a new PrismaClient instance every time the server is reloaded.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
