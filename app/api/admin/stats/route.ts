import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const [totalRooms, occupied, pending] = await Promise.all([
    prisma.room.count(),
    prisma.booking.count({ where: { booking_logs: { some: { status: BookingStatus.COMPLETED } } } }),
    prisma.booking.count({ where: { booking_logs: { some: { status: BookingStatus.VERIFYING } } } })
  ]);
  
  return NextResponse.json({ 
    totalRooms, 
    occupied, 
    pending, 
    totalRevenue: occupied * 1200 // สมมติราคา
  });
}