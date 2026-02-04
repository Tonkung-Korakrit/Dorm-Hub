import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ดึงทุก booking
    const bookings = await prisma.booking.findMany({
      include: {
        user: true, // เอาข้อมูล user ที่จอง
        room: {
          include: {
            dorm: true, // เอาข้อมูล dorm ของห้อง
          },
        },
      },
      orderBy: { createdAt: "desc" }, // เรียงจากล่าสุดไปเก่าสุด
    });

    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการจอง" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
