// /api/bookings/cancel/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RoomStatus, BookingType, BookingStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        include: { room: true }
      });

      // ตรวจสอบสถานะว่าต้องเป็น PENDING เท่านั้นถึงจะยกเลิกและคืนสิทธิ์ได้
      if (!booking || booking.status !== BookingStatus.PENDING) {
        throw new Error("รายการจองนี้ไม่สามารถยกเลิกได้ หรือถูกดำเนินการไปแล้ว");
      }

      // 1. อัปเดตสถานะการจอง (ใช้ CANCELLED สำหรับการกดเอง หรือ EXPIRED สำหรับเวลาหมด)
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED } 
      });

      // 2. คำนวณการคืนสิทธิ์
      const { type, room } = booking;
      const isCharter = type === BookingType.CHARTER;
      const isCoResident = type === BookingType.CO_RESIDENT;
      
      let newOcc = room.currentOccupancy;
      let newStatus = room.status;

      const maxCap = room.capacity;
      // const CO_RESIDENT_LIMIT = maxCap + 10; // พักร่วมได้ไม่เกิน 10 คน

      if (isCharter) {
        // ถ้าเจ้าของห้องเหมายกเลิก ห้องต้องว่าง 100%
        newOcc = 0;
        newStatus = RoomStatus.AVAILABLE;
      } else {
        // ถ้าจองแยกหรือพักร่วมยกเลิก ให้ลดจำนวนคนลง 1
        newOcc = Math.max(0, room.currentOccupancy - 1);
        
        // จัดการสถานะห้อง
        if (isCoResident) {
          // ถ้าผู้พักร่วมยกเลิก สถานะห้องควรยังเป็น FULL หรือ PENDING ตามเดิม (เพราะเจ้าของยังอยู่)
          // นอกจากว่าจะหลุดจาก Hard Limit 10 คน ให้เป็น PENDING
          // newStatus = newOcc < CO_RESIDENT_LIMIT ? RoomStatus.PENDING : RoomStatus.FULL;
          newStatus = RoomStatus.FULL;
        } else {
          // กรณี NOT_CHARTER (จองรายคน)
          // ถ้าจำนวนคนน้อยกว่าความจุเตียง ให้กลับมาเป็น AVAILABLE
          newStatus = newOcc < maxCap ? RoomStatus.AVAILABLE : RoomStatus.PENDING;
        }
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentOccupancy: newOcc,
          status: newStatus
        }
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cancel Booking Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}