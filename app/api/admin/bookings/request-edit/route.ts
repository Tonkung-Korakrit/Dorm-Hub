// api/admin/bookings/request-edit/route.ts

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
    const secret_admin = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secret_admin);
    const adminId = Number(payload.id); // นี่คือ ID ที่ปลอดภัยที่สุด

    if (!Number.isInteger(adminId) || payload.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const coResidentNote = "";

    const { bookingId, remark } = await request.json();
    const bId = Number(bookingId);

    if (isNaN(bId))
      return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });

    // ขั้นตอนที่ 1: Transaction (อัปเดตสถานะ + บันทึกประวัติ Admin)
    const updated = await prisma.$transaction(async (tx) => {
      await tx.booking_log.create({
        data: {
          bookingId: bId,
          status: BookingStatus.PENDING_CORRECTION,
          verifiedBy: adminId,
        }, // ปิด data
      });

      await tx.booking.update({
        where: { id: bId },
        data: {
          status: BookingStatus.PENDING_CORRECTION,
        },
      });

      // 1.2 บันทึกประวัติการทำงานของ Staff (Audit Trail)
      await tx.staff_action_log.create({
        data: {
          // staff: {
          //   connect: { id: adminId }
          // },
          verifiedBy: adminId,

          // เชื่อมกับ Log การจองที่เราเพิ่งสร้าง (ถ้าใน Schema นายทำ Relation ไว้)
          remark:
            remark ||
            "การจองห้องพักถูกปฏิเสธ เนื่องจากข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
          createdAt: new Date(),
        },
      });

      return { id: Number(bookingId) };
    });

    // ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        cus_users: true,
        room: {
          include: {
            dorm: {
              include: {
                campus: true,
              },
            },
          },
        },
      },
    });

    // ขั้นตอนที่ 3: ส่งอีเมลแบบ Non-blocking
    if (bookingData.cus_users?.email) {
      try {
        await sendStatusEmail(
          bookingData as any,
          BookingStatus.PENDING_CORRECTION,
          remark,
          coResidentNote,
        );
        console.log(
          "✅ Email sent successfully to:",
          bookingData.cus_users.email,
        );
      } catch (err) {
        console.error("❌ Email Sending Failed:", err);
        // ไม่ต้อง throw error เพราะ DB อัปเดตไปแล้ว ไม่อยากให้ User เห็นหน้า Error 500
      }
    }

    try {
      await sendBookingStatusFlex({
        userId: bookingData.cus_users.id,
        bookingId: bookingData.id,
        status: bookingData.status,
        dormName: bookingData.room.dorm.name,
        roomCode: bookingData.room.roomId,
        remark: remark,
      });
    } catch (err) {
      console.error("❌ Line Fetch Error Details:");
      // console.error("Line notification error:" + err);
      console.error("Message:", err.message);
      console.error("Cause:", err.cause);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Confirm API Error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถอนุมัติรายการได้" },
      { status: 500 },
    );
  }
}
