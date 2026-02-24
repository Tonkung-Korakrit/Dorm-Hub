import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";
import { BookingStatus } from "@/types/booking";

export async function POST(request: Request) {
  try {
    const { bookingId, adminId, remark } = await request.json();

    // ขั้นตอนที่ 1: Transaction (อัปเดตสถานะ + บันทึกประวัติ Admin)
    const updated = await prisma.$transaction(async (tx) => {
      // 1.1 สร้าง Log การจองใหม่ (COMPLETED)
      const newLog = await tx.booking_log.create({
        data: {
          bookingId: Number(bookingId),
          status: BookingStatus.COMPLETED,
          verifiedBy: Number(adminId), // ป้องกัน Type Mismatch
        }
      });

      // 1.2 บันทึกประวัติการทำงานของ Staff (Audit Trail)
      await tx.staff_action_log.create({
        data: {
          verifiedBy: Number(adminId),
          // เชื่อมกับ Log การจองที่เราเพิ่งสร้าง (ถ้าใน Schema นายทำ Relation ไว้)
          remark: remark || "อนุมัติการจองเรียบร้อย",
          createdAt: new Date()
        }
      });

      return { id: Number(bookingId) };
    });

    // ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล (เหมือนเดิมของนาย - ดีอยู่แล้ว)
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        cus_users: true,
        room: { include: { dorm: { include: { campus: true } } } }
      }
    });

    // ขั้นตอนที่ 3: ส่งอีเมลแบบ Non-blocking
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