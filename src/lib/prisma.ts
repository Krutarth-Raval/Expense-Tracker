import { PrismaClient } from "@prisma/client";

const PRISMA_VERSION_TAG = "v2_with_salary_fields";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersionTag: string | undefined;
};

// Force recreation if client was initialized before schema push
if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaVersionTag !== PRISMA_VERSION_TAG
) {
  globalForPrisma.prisma.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaVersionTag = PRISMA_VERSION_TAG;
}
