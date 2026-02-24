// lib/prisma.ts
// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     // ⚡ ปิด log ในสถานะปกติ หรือใช้ env switch
//     log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [], 
//   });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://dummy:dummy@localhost:3306/dummy"
    }
  }
})
export { prisma }

// // lib/prisma.ts
// import { PrismaClient } from '@prisma/client'

// const prismaClientSingleton = () => {
//   return new PrismaClient()
// }

// declare global {
//   var prisma: undefined | ReturnType<typeof prismaClientSingleton>
// }

// // เปลี่ยนตรงนี้เป็น export const prisma
// export const prisma = globalThis.prisma ?? prismaClientSingleton()

// if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma