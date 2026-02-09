import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // ⚡ 1. เพิ่มระบบ Pagination เพื่อป้องกันการดึงข้อมูลมหาศาลในครั้งเดียว
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // ดึงทีละ 50 รายการ
    const skip = (page - 1) * limit;

    // ⚡ 2. ใช้ Select แทน Include เพื่อดึงเฉพาะฟิลด์ที่ต้องใช้ใน Dashboard จริงๆ
    // วิธีนี้ช่วยลดขนาด JSON Payload และลดภาระของ Database
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: "VERIFYING", 
      },
      select: {
        id: true,
        type: true,
        paymentProof: true,
        createdAt: true,
        user: {
          select: {
            name_th: true,
            studentId: true,
          },
        },
        room: {
          select: {
            roomId: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", 
      },
      take: limit, // ดึงตามจำนวนที่กำหนด
      skip: skip,  // ข้ามตามหน้า
    });

    return NextResponse.json(pendingBookings);
  } catch (error) {
    console.error("Fetch Verify Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}