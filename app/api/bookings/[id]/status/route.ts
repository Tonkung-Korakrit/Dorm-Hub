import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid Booking ID' }, { status: 400 });
    }

    // 1. ดึงข้อมูลยืนยันตัวตน (Identity Retrieval)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const session = await getServerSession(authOptions);

    // ถ้าไม่มีหลักฐานการ Login เลย ให้ปฏิเสธการเข้าถึง
    if (!session && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 🔑 Decode JWT (ถ้ามี)
    let userId: string | undefined;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.username as string; // username = studenId 
      } catch (e) {
        console.error("JWT Verify Error in API:", e);
      }
    }

    // 3. 🔍 Query พร้อมเช็คสิทธิ์ความเป็นเจ้าของ (Ownership Check)
    // เราจะไม่ดึง Log มาตรงๆ แต่เราจะดึงผ่าน Booking ที่เช็คสิทธิ์แล้ว
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [
          { cus_users: { studentId: userId || "none" } },
          { cus_users: { email: session?.user?.email || "none" } }
        ]
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
      bookingStatus: latestLog?.status || 'PENDING',
      updatedAt: latestLog?.createdAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}