// api/admin/bookings/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // 1. เช็คสิทธิ์ Admin (ห้ามลืมเด็ดขาด!)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // 2. รับค่าการแบ่งหน้า (Pagination) จาก Query Params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    // 3. Query ข้อมูล
    const bookings = await prisma.booking.findMany({
      where: {
        // booking_logs: {
        //   some: { status: BookingStatus.VERIFYING }
        // }
        status: BookingStatus.VERIFYING
      },
      include: {
        cus_users: {
          select: {
            id: true,
            name_th: true,
            studentId: true,
            email: true,
            mobilePhone: true
          }
        },
        room: {
          include: {
            dorm: {
              include: { campus: true }
            }
          }
        },
        // ดึง Log เฉพาะอันล่าสุดเพื่อเช็คสถานะ "ปัจจุบัน"
        booking_logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            file: true // ดึงข้อมูลไฟล์แนบ (ถ้ามี)
          }
        },
        // ดึงข้อมูลการชำระเงินล่าสุด
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        id: 'desc' // เอาเคสใหม่ล่าสุดขึ้นก่อน
      },
      skip: skip,
      take: limit,
    });

    // 3. Filter สำคัญ: กรองเฉพาะรายการที่ "สถานะล่าสุด" คือ VERIFYING เท่านั้น
    // ป้องกันเคสที่เคย VERIFYING แต่ตอนนี้ SUCCESS ไปแล้วโผล่มาซ้ำ
    const filteredBookings = bookings.filter(b =>
      b.booking_logs[0]?.status === BookingStatus.VERIFYING
    );

    // ดึงจำนวนทั้งหมดเพื่อไปทำตัวเลขหน้าใน UI
    // 1. นับจำนวนรายการที่ "เคยมี" สถานะ VERIFYING ใน Log
    // (ต้องใช้เงื่อนไขเดียวกับ findMany เพื่อให้ตัวเลขหน้า Pagination ตรงกัน)
    const total = await prisma.booking.count({
      where: {
        // booking_logs: {
        //   some: { status: BookingStatus.VERIFYING }
        // }

        // 4. นับจำนวนรายการทั้งหมดที่รอตรวจสอบ (แม่นยำ 100%)
        status: BookingStatus.VERIFYING
      }
    });

    const metadata = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    return NextResponse.json({
      data: filteredBookings, // ข้อมูลที่ผ่านการกรองแล้ว
      metadata
    });
  } catch (error: any) {
    console.error("Admin Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { BookingStatus, RoomStatus, BookingType } from "@prisma/client";

// // ดึงรายการที่รอการตรวจสอบทั้งหมด
// export async function GET() {
//   try {
//     const bookings = await prisma.booking.findMany({
//       where: { booking_logs: { some: { status: BookingStatus.VERIFYING } } },
//       include: {
//         cus_users: true,
//         room: { include: { dorm: { include: { campus: true } } } },
//         booking_logs: {
//           orderBy: { createdAt: 'asc' }
//         }
//       },
//     });
//     return NextResponse.json(bookings);
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }