// app/api/admin/history/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/services/auth";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const secret_admin = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secret_admin);
    const adminId = Number(payload.id); // นี่คือ ID ที่ปลอดภัยที่สุด

    // ดึงประวัติ 20 รายการล่าสุด
    const history = await prisma.booking_log.findMany({
      where: {
        // กรองเอาเฉพาะสถานะที่เป็นการตัดสินใจไปแล้ว (ไม่ใช่ VERIFYING)
        status: { in: ['COMPLETED', 'REJECTED', 'PENDING_CORRECTION'] }
      },
      include: {
        booking: {
          include: {
            cus_users: { select: { name_th: true } },
            room: { select: { roomId: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}