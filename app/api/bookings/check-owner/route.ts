import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus, BookingType } from "@/types/booking";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) return NextResponse.json({ success: false, message: "Missing Student ID" }, { status: 400 });

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        cus_users: { studentId: studentId },
        booking_logs: {
          some: {
            status: BookingStatus.COMPLETED,
          }
        },
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
            dorm: {
              include: {
                campus: true
              }
            }
          }
        },
        cus_users: {
          select: {
            id: true,
            studentId: true,
            name_th: true,
          },
        },
      }
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "No room bookings were found for this student ID." }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}