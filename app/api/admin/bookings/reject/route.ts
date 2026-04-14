// api/admin/bookings/reject/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";
import { BookingStatus, BookingType, RoomStatus } from "@/utils/types";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
  // 1. ดึง Token จาก Cookie (ไม่ต้องรอให้ Frontend ส่ง ID มา)
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // 2. แกะ Token ที่ Backend
    const secret_admin = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secret_admin);
    const adminId = Number(payload.id); // นี่คือ ID ที่ปลอดภัยที่สุด
    const coResidentNote = "";

    const { bookingId, remark } = await request.json();
    const bId = Number(bookingId);

    if (isNaN(bId)) return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });

    // ขั้นตอนที่ 1: Transaction (อัปเดตสถานะ + บันทึกประวัติ Admin)
    const updated = await prisma.$transaction(async (tx) => {
      // 1. ดึงข้อมูลการจองปัจจุบันมาเช็ค และเอาข้อมูลห้องมาด้วย
      const current = await tx.booking.findUnique({
        where: { id: bId },
        include: { room: true, cus_users: true }
      });

      if (!current) throw new Error("ไม่พบข้อมูลการจอง");
      if (current.status !== BookingStatus.VERIFYING) {
        throw new Error("รายการนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ");
      }

      await tx.booking_log.create({
        data: {
          bookingId: bId,
          status: BookingStatus.REJECTED,
          verifiedBy: adminId
        }
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bId, },
        data: {
          status: BookingStatus.REJECTED,
        }
      })

      // 1.2 บันทึกประวัติการทำงานของ Staff (Audit Trail)
      await tx.staff_action_log.create({
        data: {
          // staff: {
          //   connect: { id: adminId }
          // },
          verifiedBy: adminId,

          // เชื่อมกับ Log การจองที่เราเพิ่งสร้าง (ถ้าใน Schema นายทำ Relation ไว้)
          remark: remark || "การจองห้องพักถูกปฏิเสธ เนื่องจากข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
          createdAt: new Date()
        }
      });

      // 5. สำคัญมาก: "คืนห้อง" (Release Room)
      // เมื่อปฏิเสธ ต้องลดจำนวนคนจองปัจจุบันลง 1 และเปิดสถานะเป็น AVAILABLE
      const newOcc = current.type === BookingType.CHARTER ? 0 : Math.max(0, current.room.currentOccupancy - 1);

      let roomUpdate: any = {
        currentOccupancy: newOcc,
        status: RoomStatus.AVAILABLE,
      }

      if (newOcc === 0) {
        roomUpdate.lifestyleConfig = null;
        roomUpdate.lifestyleNote = null;
        roomUpdate.facultyConfig = []
      } else {
        const userFaculty = current.cus_users?.faculty_department;
        const currentFaculties = Array.isArray(current.room.facultyConfig)
          ? (current.room.facultyConfig as string[])
          : []

        if (userFaculty) {
          const facultyIndex = currentFaculties.indexOf(userFaculty);
          if (facultyIndex > -1) {
            currentFaculties.splice(facultyIndex, 1)
          }
          roomUpdate.facultyConfig = currentFaculties
        }
      }

      // Update สถานะห้องพัก
      await tx.room.update({
        where: { id: current.room.id },
        data: roomUpdate
      });

      if (current.room.parentId) {
        await tx.room.update({
          where: { id: current.room.parentId },
          data: { status: RoomStatus.AVAILABLE }
        });
      }

      // return { id: Number(bookingId) };
      return updatedBooking;
    });

    // ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        cus_users: true,
        room: { include: { dorm: { include: { campus: true } } } }
      }
    });

    // ขั้นตอนที่ 3: ส่งอีเมลแบบ Non-blocking
    if (bookingData?.cus_users?.email) {
      sendStatusEmail(bookingData as any, BookingStatus.REJECTED, remark, coResidentNote)
        .catch(err => console.error("❌ Email Sending Failed:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Confirm API Error:", error);
    return NextResponse.json({ message: "ไม่สามารถอนุมัติรายการได้" }, { status: 500 });
  }
}