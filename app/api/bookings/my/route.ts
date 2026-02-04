// /app/api/bookings/my/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    let email = null;
    let studentId = null;

    // 1. ลองเช็คจาก NextAuth (สำหรับ Google Login)
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      email = session.user.email;
    } 
    // 2. ถ้าไม่มี Session ให้ลองเช็คจาก Cookie "token" (สำหรับ TU Login)
    else {
      const cookieStore = await cookies();
      const token = cookieStore.get("token")?.value;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
          // ในโค้ด Login คุณเก็บ username (รหัสนักศึกษา) ไว้ใน payload
          studentId = decoded.username; 
        } catch (err) {
          console.error("JWT Verify Error:", err);
        }
      }
    }

    // ❌ ถ้าหาตัวตนไม่ได้เลยทั้งสองทาง
    if (!email && !studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. ดึงข้อมูลการจอง (ค้นหาด้วย email หรือ studentId)
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { user: { email: email || undefined } },
          { user: { studentId: studentId || undefined } }
        ]
      },
      include: {
        room: {
          include: {
            zone: { include: { dorm: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!booking) return NextResponse.json({ booking: null });

    // 4. Flatten ข้อมูลเพื่อป้องกัน Object Error ใน React
    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      type: booking.type,
      room: {
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        zone: booking.room.zone.name,
        campus: booking.room.zone.dorm.name,
        lifestyleConfig: booking.room.lifestyleConfig || []
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}