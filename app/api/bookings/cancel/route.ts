import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RoomStatus, BookingType, BookingStatus } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, isExpired } = await request.json();

    // ตรวจสอบตัวตน (Security) เพื่อให้มั่นใจว่าเป็นเจ้าของรายการจอง
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const studentId = decoded.username;

    const result = await prisma.$transaction(async (tx) => {
      // Select เฉพาะฟิลด์ที่จำเป็น (Optimization)
      const currentBooking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        select: {
          id: true,
          status: true,
          type: true,
          user: { select: { studentId: true } },
          room: { select: { id: true, status: true, currentOccupancy: true, capacity: true, } }
        }
      });

      // ตรวจสอบสิทธิ์และสถานะ
      if (!currentBooking || currentBooking.user.studentId !== studentId) {
        throw new Error("คุณไม่มีสิทธิ์ยกเลิกรายการนี้");
      }

      if (currentBooking.status !== BookingStatus.PENDING) {
        throw new Error("รายการจองนี้ไม่สามารถยกเลิกได้ (อาจได้รับการยืนยันหรือหมดอายุไปแล้ว)");
      }

      // คำนวณการคืนสิทธิ์ให้ห้องพัก
      const { type, room } = currentBooking;
      let newOcc = room.currentOccupancy;
      let newStatus = room.status;

      if (type === BookingType.CHARTER) {
        newOcc = 0;
        newStatus = RoomStatus.AVAILABLE;
      } else {
        newOcc = Math.max(0, room.currentOccupancy - 1);
        // ถ้าไม่เหลือคนแล้ว หรือเป็นแบบแยกคนจองแล้วมีที่ว่าง ให้กลับมา AVAILABLE
        if (newOcc === 0 || (type === BookingType.NOT_CHARTER && newOcc < room.capacity)) {
          newStatus = RoomStatus.AVAILABLE;
        } else if (type === BookingType.CO_RESIDENT) {
          newStatus = RoomStatus.FULL; // ตามเงื่อนไขห้องพักร่วมของคุณ
        }
      }

      // อัปเดตสถานะ booking
      const finalStatus = isExpired ? BookingStatus.EXPIRED : BookingStatus.CANCELLED;
      await tx.booking.update({
        where: { id: currentBooking.id },
        data: { status: finalStatus }
      });

      // อัปเดตสถานะจำนวนผู้อาศัยปัจจุบันใน room
      await tx.room.update({
        where: { id: room.id },
        data: { currentOccupancy: newOcc, status: newStatus }
      });

      return { success: true };
    }, { timeout: 10000 });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cancel Booking Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}