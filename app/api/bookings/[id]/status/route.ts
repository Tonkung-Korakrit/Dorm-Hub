// api/bookings/[id]/status/route.ts

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { BookingStatus } from '@/utils/types';
import { getAuthSession } from '@/services/identify';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. ดึงข้อมูลยืนยันตัวตน (Identity Retrieval)
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid Booking ID' }, { status: 400 });
    }

    // 3. Query พร้อมเช็คสิทธิ์ความเป็นเจ้าของ (Ownership Check)
    // เราจะไม่ดึง Log มาตรงๆ แต่เราจะดึงผ่าน Booking ที่เช็คสิทธิ์แล้ว
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        }
      },
      select: {
        booking_logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, createdAt: true }
        }
      }
    });

    // ถ้าไม่เจอ Booking (อาจจะ ID ผิด หรือไม่ใช่เจ้าของ)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or Access denied' }, { status: 404 });
    }

    const latestLog = booking.booking_logs[0];

    return NextResponse.json({
      bookingStatus: latestLog?.status || BookingStatus.PENDING,
      updatedAt: latestLog?.createdAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}