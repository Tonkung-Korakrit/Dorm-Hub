// api/bookings/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { PROFILE_IMAGE_TYPES } from "@/lib/profile-images";
import { NextResponse } from "next/server";
import { BookingStatus } from "@/utils/types";
import { getAuthSession } from "@/services/identify";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. ตรวจสอบสิทธิ์ (Security First!)
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized - ไม่ได้รับอนุญาต" },
        { status: 401 },
      );
    }

    // 2. ดึงข้อมูลการจอง (ต้องเป็นของ User คนนี้เท่านั้น)
    const { id } = await params;
    const bookingId = Number(id);
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions, // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        },
      },
      include: {
        cus_users: {
          include: {
            address: true,
            profileImage: {
              where: {
                type: {
                  in: PROFILE_IMAGE_TYPES,
                },
              },
            },
            vehicleInfo: {
              include: {
                file_info: true,
              },
            },
          },
        },
        room: {
          include: {
            dorm: {
              include: { campus: true },
            },
          },
        },
        // ดึง Log ตัวล่าสุดเพื่อดูสถานะ และเหตุผลที่โดน Reject
        booking_logs: {
          select: {
            bookingId: true,
            status: true,
            file: true,
            verifier: {
              select: {
                staff_action_log: {
                  select: {
                    remark: true,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลการจอง" },
        { status: 404 },
      );
    }

    if (booking.room && Array.isArray(booking.room.facultyConfig)) {
      // แปลงให้เป็น Array ของ String เพียวๆ
      booking.room.facultyConfig = booking.room.facultyConfig.map(
        (item: any) => {
          if (typeof item === "string") return item; // ถ้าเป็น string อยู่แล้วก็คืนค่าเดิม
          if (typeof item === "object" && item !== null) return item.name; // ถ้าเป็น object ให้ดึงแค่ .name
          return "ไม่ระบุคณะ";
        },
      );
    }

    // 3. จัด Format ข้อมูลเล็กน้อยเพื่อให้ Frontend ใช้ง่าย
    const latestLog = booking.booking_logs?.[0] || null;
    const actionLogs = latestLog?.verifier?.staff_action_log || [];
    const lastRemark = actionLogs.find(log => log.remark !== null && log.remark !== "")?.remark || null;

    // Note: เนื่องจาก Schema เก็บ remark ไว้ใน Staff_action_log
    // ถ้ายังไม่ได้เชื่อม BookingId เข้าไป แนะนำให้ไปหาทางดึงมา
    const responseData = {
      ...booking,
      status: latestLog?.status || BookingStatus.PENDING_CORRECTION,
      remark: lastRemark,
      cus_users: {
        ...booking.cus_users,
        vehicleInfo: booking.cus_users.vehicleInfo
          ? {
              ...booking.cus_users.vehicleInfo,
              fileImages: booking.cus_users.vehicleInfo.file_info?.path || "",
            }
          : null,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Fetch Booking Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
