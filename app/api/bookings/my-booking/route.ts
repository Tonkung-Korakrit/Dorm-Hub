// app/api/bookings/my-booking/route.ts

import { prisma } from "@/lib/prisma";
import { PROFILE_IMAGE_TYPES } from "@/lib/profile-images";
import { NextResponse } from "next/server";
import { BookingStatus } from "@/utils/types";
import { getAuthSession } from "@/services/identify";

export async function GET() {
// export const getMyBooking = async () => { 
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    // 2. ใช้ select แทน include เพื่อดึงเฉพาะฟิลด์ที่ต้องการ
    // ช่วยลดจำนวนการ JOIN ตารางและขนาดของข้อมูลที่วิ่งใน Network
    const booking = await prisma.booking.findFirst({
      where: {
        // OR: [
        //   ...(email ? [{ cus_users: { email } }] : []),
        //   ...(studentId ? [{ cus_users: { studentId: studentId } }] : [])
        // ]
        cus_users: {
          OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        }
      },
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        type: true,
        booking_logs: {
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
            verifier: {
              select: {
                id: true,
                staff_action_log: {
                  select: {
                    remark: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: "desc" // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
                  },
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc" // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
          },
          take: 1
        },
        checkins: {
          select: {
            type: true,
          },
        },
        room: {
          select: {
            roomId: true,
            floor: true,
            // lifestyleConfig: true,
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
            lifestyle: true,
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
                file_info: true
              }
            },
          }
        },
      },
      // orderBy: {
      //   booking_logs: {
      //     createdAt: "desc"
      //   }
      // }
    });

    const userTMP = await prisma.cus_users.findFirst({
      where: {
        OR: excludeConditions
      },
      select: {
        id: true,
        studentId: true,
        name_en: true
      }
    });

    if (!booking) {
      const lineLoginsCount = userTMP
        ? await prisma.line_login.count({ where: { userId: userTMP.id } })
        : 0;

      return NextResponse.json({
        cus_users: userTMP
          ? {
              id: userTMP.id,
              name_en: userTMP.name_en,
              hasLineLogin: lineLoginsCount > 0,
            }
          : null,
      });
    }

    const lineLoginsCount = await prisma.line_login.count({
      where: {
        userId: booking.cus_users.id,
      }
    });

    const hasCheckin = booking.checkins.some((record) => record.type === "CHECKIN");
    const hasCheckout = booking.checkins.some((record) => record.type === "CHECKOUT");
    const currentStatus = booking.booking_logs[0]?.status || BookingStatus.PENDING;
    const rebookableStatuses: BookingStatus[] = [
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
      BookingStatus.REJECTED,
    ];
    const canBookAgain =
      rebookableStatuses.includes(currentStatus) ||
      (currentStatus === BookingStatus.COMPLETED && hasCheckout);

    // 3. Flatten ข้อมูล (เหมือนเดิมแต่โครงสร้างสะอาดขึ้น)
    return NextResponse.json({
    // return ({
      id: booking.id,
      status: currentStatus,
      hasCheckin,
      hasCheckout,
      canBookAgain,
      type: booking.type,
      createdAt: booking.booking_logs[0]?.createdAt,
      remark: booking.booking_logs[0]?.verifier?.staff_action_log?.[0]?.remark || null,      // expiresAt: booking.expiresAt,
      room: {
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        dorm: booking.room.dorm.name,
        campus: booking.room.dorm.campus.name,
        roomType: booking.room.roomType,
        // lifestyleConfig: booking.room.lifestyleConfig || []
      },
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
        hasLineLogin: lineLoginsCount > 0,
        lifestyle: booking.cus_users.lifestyle,
        address: booking.cus_users.address,
        profileImage: booking.cus_users.profileImage,
        vehicleInfo: booking.cus_users.vehicleInfo ? {
          ...booking.cus_users.vehicleInfo,
          fileImages: booking.cus_users.vehicleInfo.file_info?.path || ""
        } : null
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
