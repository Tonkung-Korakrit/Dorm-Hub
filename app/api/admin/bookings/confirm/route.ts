// api/admin/bookings/confirm/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";
import { BookingStatus } from "@/utils/types";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sendBookingStatusFlex } from "@/lib/line";

export async function POST(request: Request) {
  // 1. ดึง Token จาก Cookie (ไม่ต้องรอให้ Frontend ส่ง ID มา)
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // 2. แกะ Token ที่ Backend
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secret);
    const adminId = Number(payload.id); // นี่คือ ID ที่ปลอดภัยที่สุด

    if (!Number.isInteger(adminId) || payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, remark } = await request.json(); // รับ remark เพิ่ม
    const bId = Number(bookingId);

    if (isNaN(bId)) {
      return NextResponse.json(
        { message: "ID การจองไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // ขั้นตอนที่ 1: Lean Transaction
    const updated = await prisma.$transaction(async (tx) => {
      // เช็คก่อนว่าสถานะปัจจุบันคือ VERIFYING จริงหรือไม่
      const current = await tx.booking.findUnique({
        where: { id: bId },
        select: { status: true },
      });

      if (!current) throw new Error("ไม่พบข้อมูลการจอง");
      if (current.status !== BookingStatus.VERIFYING) {
        throw new Error(
          "รายการนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ (อาจถูกดำเนินการไปแล้ว)",
        );
      }

      // 1.1 อัปเดตการจองโดยสร้าง log ใหม่
      const result = await tx.booking_log.create({
        data: {
          bookingId: bId,
          status: BookingStatus.COMPLETED,
          verifiedBy: adminId,
        },
        include: {
          booking: {
            include: {
              cus_users: {
                select: {
                  id: true,
                },
              },
              room: {
                include: {
                  dorm: true,
                },
              },
            },
          },
        },
      });

      await tx.booking.update({
        where: { id: bId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });

      // 1.2 บันทึกประวัติการทำงานของแอดมินลงใน Staff_action_log
      await tx.staff_action_log.create({
        data: {
          verifiedBy: adminId,
          // remark: remark || "การจองถูกอนุมัติเรียบร้อย",
          createdAt: new Date(),
        },
      });

      return { id: bId, result };
    });

    try {
      await sendBookingStatusFlex({
        userId: updated.result.booking.cus_users.id,
        bookingId: updated.result.bookingId,
        status: updated.result.status,
        dormName: updated.result.booking.room.dorm.name,
        roomCode: updated.result.booking.room.roomId,
      });
    } catch (err) {
      console.error("Line notification error:" + err);
    }

    // ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล (ดีอยู่แล้วครับ)
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        cus_users: true,
        room: {
          include: {
            dorm: { include: { campus: true } },
          },
        },
      },
    });

    // ขั้นตอนที่ 3: ส่งอีเมลแบบ Async (Non-blocking)
    // if (bookingData?.cus_users?.email) {
    //   sendStatusEmail(bookingData as any, BookingStatus.COMPLETED)
    //     .catch(err => console.error("❌ Email Sending Failed:", err));
    // }
    if (bookingData.cus_users?.email) {
      try {
        await sendStatusEmail(bookingData as any, BookingStatus.COMPLETED);
        console.log("✅ Email sent successfully to:", bookingData.cus_users.email,
        );
      } catch (err) {
        console.error("❌ Email Sending Failed:", err);
        // ไม่ต้อง throw error เพราะ DB อัปเดตไปแล้ว ไม่อยากให้ User เห็นหน้า Error 500
      }
    }

    return NextResponse.json({
      success: true,
      message: "อนุมัติรายการเรียบร้อย",
    });
  } catch (error) {
    console.error("❌ Confirm API Error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถอนุมัติรายการได้" },
      { status: 500 },
    );
  }
}
