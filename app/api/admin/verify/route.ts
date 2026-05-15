// api/admin/verify

import { prisma } from "@/lib/prisma";
import { PROFILE_IMAGE_TYPES } from "@/lib/profile-images";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { cookies } from "next/headers";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/services/auth"; // พาธไฟล์ auth ของต้น

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // 1. รับค่าการแบ่งหน้า (Pagination) จาก Query Params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    // 2. Query ข้อมูล
    const bookings = await prisma.booking.findMany({
      where: {
        // booking_logs: {
        //   some: { status: BookingStatus.VERIFYING }
        // }
        status: BookingStatus.VERIFYING,
      },
      include: {
        cus_users: {
          select: {
            id: true,
            gender: true,
            name_th: true,
            name_en: true,
            citizenType: true,
            citizenNumber: true,
            studentId: true,
            email: true,
            mobilePhone: true,
            faculty_department: true,
            address: {
              select: {
                id: true,
                type: true,
                addressDetail: true,
                subDistrict: true,
                district: true,
                province: true,
                postalCode: true,
                country: true,
              },
            },
            profileImage: {
              where: {
                type: {
                  in: PROFILE_IMAGE_TYPES,
                },
              },
              select: {
                id: true,
                type: true,
                path: true,
              },
            },
            vehicleInfo: {
              include: {
                file_info: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          }
        },
        room: {
          // select: {
          //   roomId: true,
          //   floor: true,
          // },
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
        status: BookingStatus.VERIFYING,
      },
    });

    const metadata = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    const formattedBookings = filteredBookings.map((booking) => ({
      ...booking,
      cus_users: {
        ...booking.cus_users,
        vehicleInfo: booking.cus_users.vehicleInfo
          ? {
              ...booking.cus_users.vehicleInfo,
              fileImages: booking.cus_users.vehicleInfo.file_info?.path || "",
            }
          : null,
      },
    }));

    return NextResponse.json({
      data: formattedBookings, // ข้อมูลที่ผ่านการกรองแล้ว
      metadata
    });
  } catch (error: any) {
    console.error("Admin Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// import { prisma } from "@/lib/prisma";
// import { BookingStatus } from "@/utils/types";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(request: NextRequest) {
//   try {
//     // 1. เพิ่มระบบ Pagination เพื่อป้องกันการดึงข้อมูลมหาศาลในครั้งเดียว
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "50"); // ดึงทีละ 50 รายการ
//     const skip = (page - 1) * limit;

//     // 2. ใช้ Select แทน Include เพื่อดึงเฉพาะฟิลด์ที่ต้องใช้ใน Dashboard จริงๆ
//     // วิธีนี้ช่วยลดขนาด JSON Payload และลดภาระของ Database
//     const bookings = await prisma.booking.findMany({
//       where: {
//         // status: "VERIFYING",
//         booking_logs: {
//           some: {
//             status: BookingStatus.VERIFYING,
//           },
//         }
//       },
//       select: {
//         id: true,
//         type: true,
//         // paymentProof: true,
//         // createdAt: true,
//         booking_logs: {
//           orderBy: {
//             createdAt: "desc"
//           },
//           // take: 3, // <--- ดึงแค่อันเดียว (อันที่ใหม่ที่สุด)
//         },
//         cus_users: {
//           select: {
//             name_th: true,
//             studentId: true,
//           },
//         },
//         room: {
//           select: {
//             roomId: true,
//           },
//         },
//       },

//       take: limit, // ดึงตามจำนวนที่กำหนด
//       skip: skip,  // ข้ามตามหน้า
//     });

//     const onlyPendingVerify = bookings.filter((booking) => {
//       const latestLog = booking.booking_logs[0];
//       return latestLog?.status === BookingStatus.VERIFYING;
//     });

//     return NextResponse.json(onlyPendingVerify);
//   } catch (error) {
//     console.error("Fetch Verify Error:", error);
//     return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
//   }
// }
