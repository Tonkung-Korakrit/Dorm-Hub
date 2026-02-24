// /app/api/bookings/my-booking/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { BookingStatus, BookingType } from "@/types/booking";

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
      return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    // 2. ใช้ select แทน include เพื่อดึงเฉพาะฟิลด์ที่ต้องการ
    // ช่วยลดจำนวนการ JOIN ตารางและขนาดของข้อมูลที่วิ่งใน Network
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(email ? [{ cus_users: { email } }] : []),
          ...(studentId ? [{ cus_users: { studentId: studentId } }] : [])
        ]
      },
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        // status: true,
        type: true,
        // createdAt: true,
        // expiresAt: true,
        // userId: true,
        // roomId: true,
        booking_logs: {
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc" // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
          },
          take: 1
        },
        room: {
          select: {
            roomId: true,
            floor: true,
            lifestyleConfig: true,
            roomType: true,
            dorm: {
              select: {
                name: true,
                campus: { select: { name: true } }
              }
            }
          }
        },
        cus_users: {
          select: {
            id: true,
            studentId: true,
            name_th: true,
            name_en: true,
            email: true,
            mobilePhone: true,
            gender: true,
            isScholarshipStudent: true,
            isDisabled: true,
            faculty_department: true,
          }
        },
      },
      // orderBy: {
      //   booking_logs: {
      //     createdAt: "desc"
      //   }
      // }
    });

    if (!booking) return NextResponse.json({ booking: null });

    // 3. Flatten ข้อมูล (เหมือนเดิมแต่โครงสร้างสะอาดขึ้น)
    return NextResponse.json({
      id: booking.id,
      status: booking.booking_logs[0]?.status || BookingStatus.PENDING,
      type: booking.type,
      createdAt: booking.booking_logs[0]?.createdAt,
      // expiresAt: booking.expiresAt,
      // userId: booking.userId,
      room: {
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        dorm: booking.room.dorm.name,
        campus: booking.room.dorm.campus.name,
        roomType: booking.room.roomType,
        lifestyleConfig: booking.room.lifestyleConfig || []
      },
      // studentId: booking.user.studentId,
      // name_th: booking.user.name_th,
      // name_en: booking.user.name_en,
      cus_users: {
        userId: booking.cus_users.id,
        studentId: booking.cus_users.studentId,
        name_th: booking.cus_users.name_th,
        name_en: booking.cus_users.name_en,
        email: booking.cus_users.email,
        mobilePhone: booking.cus_users.mobilePhone,
        gender: booking.cus_users.gender,
        isScholarshipStudent: booking.cus_users.isScholarshipStudent,
        isDisabled: booking.cus_users.isDisabled,
        faculty_department: booking.cus_users.faculty_department,
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}