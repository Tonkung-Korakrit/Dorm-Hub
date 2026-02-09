import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [totalRooms, occupied, pending] = await Promise.all([
    prisma.room.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'VERIFYING' } })
  ]);
  
  return NextResponse.json({ 
    totalRooms, 
    occupied, 
    pending, 
    totalRevenue: occupied * 1200 // สมมติราคา
  });
}