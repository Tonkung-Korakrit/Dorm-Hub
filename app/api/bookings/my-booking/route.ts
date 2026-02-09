// /app/api/bookings/my-booking/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let studentId = null;
    let email = null;

    // 1. ลำดับความสำคัญใหม่: เช็ค JWT ก่อน (ถ้าใช้ TU Login เป็นหลัก) 
    // เพราะเร็วกว่าการรอ getServerSession มาก
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        studentId = decoded.username;
      } catch (err) { /* token invalid */ }
    }

    // ถ้าไม่มี token ค่อยไปเช็ค getServerSession
    if (!studentId) {
      const session = await getServerSession(authOptions);
      email = session?.user?.email;
    }

    if (!email && !studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ใช้ select แทน include เพื่อดึงเฉพาะฟิลด์ที่ต้องการ
    // ช่วยลดจำนวนการ JOIN ตารางและขนาดของข้อมูลที่วิ่งใน Network
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(email ? [{ user: { email } }] : []),
          ...(studentId ? [{ user: { studentId } }] : [])
        ]
      },
      select: {
        id: true,
        status: true,
        type: true,
        room: {
          select: {
            roomId: true,
            floor: true,
            lifestyleConfig: true,
            roomType: true,
            zone: {
              select: {
                name: true,
                dorm: { select: { name: true } }
              }
            }
          }
        },
        user: {
          select: {
            studentId: true,
            name_th: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!booking) return NextResponse.json({ booking: null });

    // 3. Flatten ข้อมูล (เหมือนเดิมแต่โครงสร้างสะอาดขึ้น)
    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      type: booking.type,
      room: {
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        zone: booking.room.zone.name,
        campus: booking.room.zone.dorm.name,
        type: booking.room.roomType,
        lifestyleConfig: booking.room.lifestyleConfig || []
      },
      studentId: booking.user.studentId,
      name: booking.user.name_th,
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}