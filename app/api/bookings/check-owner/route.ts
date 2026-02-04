import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ปรับ path ตามโปรเจกต์คุณ
import { BookingStatus, BookingType } from "@/types/booking";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) return NextResponse.json({ success: false, message: "Missing Student ID" }, { status: 400 });

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        user: { studentId: studentId },
        status: BookingStatus.COMPLETED, // หรือ "VERIFIED" ตามที่คุณต้องการ
        type: BookingType.CHARTER    // เช็คเฉพาะคนที่เป็นเจ้าของห้องเหมา
      },
      select: {
        id: true,
        room: {
          select: {
            id: true,
            roomId: true,
            floor: true,
            price: true,
            roomType: true,
            zone: {
              include: {
                dorm: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            studentId: true,
            name_th: true,
          },
        },
      }
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "ไม่พบการจองแบบเหมาห้องของรหัสนักศึกษานี้" }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}