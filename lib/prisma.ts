// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// 1. สร้างฟังก์ชันสำหรับสร้าง Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    // ใส่ log เพื่อดู SQL ที่เกิดขึ้นจริง (ช่วยตอน Debug ได้มาก)
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// 2. ประกาศ Type ให้ global object รู้จัก prisma
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// 3. เลือกใช้ instance เดิมถ้ามีอยู่แล้ว หรือสร้างใหม่
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

// 4. ในช่วง Dev ให้เก็บ instance ไว้ใน global เพื่อไม่ให้สร้างใหม่ตอน Fast Refresh
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

/// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL || "mysql://dummy:dummy@localhost:3306/dummy"
//     }
//   }
// })
// export { prisma }