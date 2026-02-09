import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, RoomStatus, BookingType } from "@prisma/client";

// ดึงรายการที่รอการตรวจสอบทั้งหมด
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: BookingStatus.VERIFYING },
      include: {
        user: true,
        room: { include: { zone: { include: { dorm: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}