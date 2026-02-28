import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";
import { BookingStatus } from "@/types/booking";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
  // 1. ดึง Token จาก Cookie (ไม่ต้องรอให้ Frontend ส่ง ID มา)
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // 2. แกะ Token ที่ Backend
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secret);
    const adminId = Number(payload.id); // นี่คือ ID ที่ปลอดภัยที่สุด

    const { bookingId, remark } = await request.json(); // รับ remark เพิ่ม

    // ขั้นตอนที่ 1: Lean Transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1.1 อัปเดตการจองโดยสร้าง log ใหม่
      await tx.booking_log.create({
        data: {
          bookingId: Number(bookingId),
          status: BookingStatus.COMPLETED,
          verifiedBy: adminId,
        }
      });

      // 1.2 บันทึกประวัติการทำงานของแอดมินลงใน Staff_action_log
      await tx.staff_action_log.create({
        data: {
          verifiedBy: Number(adminId),
          // remark: remark || "การจองถูกอนุมัติเรียบร้อย",
          createdAt: new Date()
        }
      });

      return { id: Number(bookingId) };
    });

    // ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล (ดีอยู่แล้วครับ)
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        cus_users: true,
        room: {
          include: {
            dorm: { include: { campus: true } }
          }
        }
      }
    });

    // ขั้นตอนที่ 3: ส่งอีเมลแบบ Async (Non-blocking)
    if (bookingData?.cus_users?.email) {
      sendStatusEmail(bookingData as any, BookingStatus.COMPLETED)
        .catch(err => console.error("❌ Email Error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Confirm API Error:", error);
    return NextResponse.json({ message: "ไม่สามารถอนุมัติรายการได้" }, { status: 500 });
  }
}