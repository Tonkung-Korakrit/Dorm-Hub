import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ใช้ Promise.all ยิงพร้อมกัน 3 Query
    const [totalRooms, occupied, pending] = await Promise.all([
      prisma.room.count(),
      // นับจากสถานะล่าสุดของ Booking (ถ้า Schema มีสถานะที่ตัว Booking เลยจะเร็วขึ้นมาก)
      prisma.booking.count({ 
        where: { 
          booking_logs: { 
            some: { status: BookingStatus.COMPLETED } 
          } 
        } 
      }),
      prisma.booking.count({ 
        where: { 
          booking_logs: { 
            some: { status: BookingStatus.VERIFYING } 
          } 
        } 
      })
    ]);

    // ป้องกันกรณีคำนวณแล้วได้ NaN หรือ null
    return NextResponse.json({ 
      totalRooms: totalRooms || 0, 
      occupied: occupied || 0, 
      pending: pending || 0, 
      totalRevenue: (occupied || 0) * 1200,
      available: Math.max(0, (totalRooms || 0) - (occupied || 0)) // แถมข้อมูลห้องว่างให้ Admin
    });

  } catch (error: any) {
    console.error("Admin Stats Error:", error.message);
    
    // ส่ง JSON Error กลับไปแทนที่จะปล่อยให้เป็นหน้าขาว/ค่าว่าง
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message }, 
      { status: 500 }
    );
  }
}