import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";
import { BookingStatus } from "@/types/booking";

export async function POST(request: Request) {
  try {
    const { bookingId, adminId, remark } = await request.json(); // รับ remark เพิ่ม

    // ขั้นตอนที่ 1: Lean Transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1.1 อัปเดตการจองโดยสร้าง log ใหม่
      const updateResult = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          booking_logs: {
            create: {
              status: BookingStatus.COMPLETED,
              verifiedBy: Number(adminId), // แปลงเป็น Number เพื่อความปลอดภัย
              createdAt: new Date(),
            }
          }
        },
        select: { id: true }
      });

      // 1.2 บันทึกประวัติการทำงานของแอดมินลงใน Staff_action_log
      await tx.staff_action_log.create({
        data: {
          verifiedBy: Number(adminId),
          remark: remark || "อนุมัติการจอง", // ใส่หมายเหตุประกอบ
          createdAt: new Date()
        }
      });

      return updateResult;
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