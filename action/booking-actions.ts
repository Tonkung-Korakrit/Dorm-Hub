// actions/booking-action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  Booking,
  BookingStatus,
  BookingType,
  PaymentStatus,
  RoomStatus,
} from "@/utils/types";
import { getAuthSession } from "@/services/identify";
import { sendBookingStatusFlex } from "@/lib/line";

export async function cancelBookingAction(prevState: any, formData: FormData) {
  // 1. ดึงข้อมูลจาก Form
  const bookingId = Number(formData.get("bookingId"));
  const isExpired = formData.get("isExpired") === "true"; // แปลง string เป็น boolean

  try {
    // 2. ด่านตรวจตัวตน (Hybrid Auth)
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" };
    }

    // 3. รัน Transaction
    const result = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลการจองมาเช็คความเป็นเจ้าของ
      const current = await tx.booking.findUnique({
        where: {
          id: bookingId,
          cus_users: { OR: excludeConditions },
        },
        include: {
          cus_users: {
            select: {
              id: true,
              faculty_department: true,
            },
          },
          room: {
            include: {
              dorm: true,
            },
          },
        },
      });

      if (!current)
        throw new Error(
          "No booking information was found, or you are not the owner of this listing - ไม่พบข้อมูลการจอง หรือคุณไม่ใช่เจ้าของรายการนี้",
        );

      const finalStatus = isExpired
        ? BookingStatus.EXPIRED
        : BookingStatus.CANCELLED;

      // 4. Logic การคืนห้อง (Ported from original)
      // ถ้าเป็นแบบเหมาห้อง (CHARTER) คนในห้องจะเป็น 0 ทันที ถ้าไม่ ก็ลดลง 1
      const newOcc =
        current.type === BookingType.CHARTER
          ? 0
          : Math.max(0, current.room.currentOccupancy - 1);

      let roomUpdate: any = {
        currentOccupancy: newOcc,
        status: RoomStatus.AVAILABLE,
      };

      if (newOcc === 0) {
        roomUpdate.lifestyleConfig = null;
        roomUpdate.lifestyleNote = null;
        roomUpdate.facultyConfig = [];
      } else {
        const userFaculty = current.cus_users?.faculty_department;
        const currentFaculties = Array.isArray(current.room.facultyConfig)
          ? (current.room.facultyConfig as string[])
          : [];

        if (userFaculty) {
          const facultyIndex = currentFaculties.indexOf(userFaculty);
          if (facultyIndex > -1) {
            currentFaculties.splice(facultyIndex, 1);
          }
          roomUpdate.facultyConfig = currentFaculties;
        }
      }

      // Update สถานะห้องพัก
      await tx.room.update({
        where: { id: current.room.id },
        data: roomUpdate,
      });

      // ถ้าเป็นห้องที่มี Parent (เช่น ห้องใน Flat) ให้ปรับสถานะตัวแม่ด้วย
      if (current.room.parentId) {
        await tx.room.update({
          where: { id: current.room.parentId },
          data: { status: RoomStatus.AVAILABLE },
        });
      }

      // 5. ถ้าเป็นการ Expire ให้เคลียร์รายการจ่ายเงินที่ค้างอยู่ด้วย
      if (isExpired) {
        await tx.payment.updateMany({
          where: {
            bookingId: current.id,
            status: PaymentStatus.PENDING,
          },
          data: { status: PaymentStatus.EXPIRED },
        });
      }

      // 6. บันทึก Log การเปลี่ยนแปลงสถานะ
      const updatedBookingLog = await tx.booking_log.create({
        data: {
          bookingId: current.id,
          status: finalStatus,
        },
      });

      return { updatedBookingLog, current };
    });

    const bookingStatus =
      result.updatedBookingLog.status || BookingStatus.CANCELLED;

    try {
      await sendBookingStatusFlex({
        userId: result.current.cus_users.id,
        bookingId: result.current.id,
        status: bookingStatus,
        dormName: result.current.room.dorm.name,
        roomCode: result.current.room.roomId,
      });
    } catch (err) {
      console.error("Line Notification Error: ", err);
    }

    // 7. แจ้ง Next.js ให้ดึงข้อมูลใหม่
    revalidatePath("/my-booking");

    return {
      success: true,
      message: isExpired
        ? "Booking time has expired - หมดเวลาการจองแล้ว"
        : "Booking canceled successfully - ยกเลิกการจองสำเร็จ",
    };
  } catch (error: any) {
    console.error("❌ Cancel Action Error:", error.message);
    return { success: false, message: error.message || "Server Error" };
  }
}

/**
 * ดึงข้อมูลการจองตาม ID (ใช้สำหรับหน้าแก้ไข/Resubmit)
 */
export async function getBookingById(bookingId: number): Promise<Booking> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        cus_users: {
          include: {
            address: true,
            profileImage: true,
            vehicleInfo: {
              include: {
                file_info: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            dorm: {
              select: {
                name: true,
                campus: true,
              },
            },
            roomId: true,
            floor: true,
            // status: true,
            // isLocked: true,
            roomType: true,
            // price: true,
            // capacity: true,
            // currentOccupancy: true,
            // lifestyleConfig: true,
            lifestyleNote: true,
            facultyConfig: true,
            // isSuite: true,
            // parentId: true,
            // parent: true,
            // subRooms: true,
            // booking: true,
            // posX: true,
            // posY: true,
            // createdAt: true,
            // updatedAt: true,
          },
        },
        booking_logs: {
          orderBy: { createdAt: "desc" }, // ดึง Logs โดยเรียงจากใหม่ไปเก่า
          take: 1,
          include: {
            verifier: {
              select: {
                id: true,
                staff_action_log: {
                  select: {
                    remark: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: "desc", // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
                  },
                },
              },
            },
          },
        },
      },
    });


    return {
      id: booking.id,
      success: true,
      message: "โหลดข้อมูลสำเร็จ",
      status: booking.status,
      type: booking.type,
      createdAt: booking.booking_logs[0].createdAt,
      remark: booking.booking_logs[0]?.verifier?.staff_action_log[0]?.remark || "", // เอา remark มาแปะให้ตรงตาม Interface Booking
      cus_users: booking.cus_users,
      room: {
        id: booking.room.id,
        campus: booking.room.dorm.campus.name,
        dorm: { name: booking.room.dorm.name },
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        // status: booking.room;
        // isLocked: boolean;
        roomType: booking.room.roomType,
        // price: number;
        // capacity: number;
        // currentOccupancy: number;
        // lifestyleConfig: booking.room.lifestyleConfig || [],
        // lifestyleNote: booking.room.lifestyleNote,
        facultyConfig: booking.room.facultyConfig,
        // isSuite: boolean;
        // parentId?: number | null; // ID ของห้องใหญ่ (กรณีที่เป็นห้องย่อย A หรือ B)
        // parent?: Room | null; // ข้อมูลห้องใหญ่
        // subRooms?: Room[];
        // posX: number;
        // posY: number;
        // booking: Booking[];
      },
    };
  } catch (error) {
    console.error("Error in getBookingById:", error);
    throw new Error("Could not fetch booking data");
  }
}

/**
 * ดึงข้อมูลการจองล่าสุดของผู้ใช้ (ใช้สำหรับดึงข้อมูลที่ค้างไว้มาแสดง)
 */
// export async function getMyLatestBooking(userId: number) {
//   try {
//     const booking = await prisma.booking.findFirst({
//       where: { userId: userId },
//       orderBy: { id: "desc" },
//       include: {
//         cus_users: {
//           include: {
//             address: true,
//             profileImage: true,
//             vehicleInfo: {
//               include: {
//                 file_info: true,
//               },
//             },
//           },
//         },
//         room: {
//           include: {
//             dorm: {
//               include: {
//                 campus: true,
//               },
//             },
//           },
//         },
//         booking_logs: {
//           orderBy: { createdAt: "desc" },
//           take: 1,
//           include: {
//             verifier: {
//               select: {
//                 staff_action_log: {
//                   orderBy: { createdAt: "desc" },
//                   take: 1,
//                   select: { remark: true },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!booking)
//       return { success: true, message: "ไม่มีประวัติการจอง", booking: null };

//     // ดึง Remark มาแปะที่ชั้นบนสุด
//     // const latestLog = booking.booking_logs[0];
//     // const remarkFromDB = latestLog?.verifier?.staff_action_log[0]?.remark;

//     // --- Logic การแยกไฟล์ ---
//     const allFiles = booking.cus_users.profileImage || [];

//     // ค้นหาไฟล์ตามประเภท
//     const facePhoto = allFiles.find((f) => f.type === "FACE_PHOTO");
//     const citizenCard = allFiles.find((f) => f.type === "CITIZEN_CARD");
//     const vehicleFile = allFiles.find((f) => f.type === "VEHICLE_CARD");

//     // return {
//     //   success: true,
//     //   message: "โหลดข้อมูลสำเร็จ",
//     //   booking: booking,
//     // };
//     return {
//       success: true,
//       message: "โหลดข้อมูลสำเร็จ",
//       booking: {
//         ...booking,
//         cus_users: {
//           ...booking.cus_users,
//           // แยกออกมาให้เรียกใช้ง่ายๆ ที่หน้าบ้าน
//           facePhotoUrl: facePhoto?.path,
//           citizenCardUrl: citizenCard?.path,
//           vehicleInfo: booking.cus_users.vehicleInfo
//             ? {
//                 ...booking.cus_users.vehicleInfo,
//                 fileImages: vehicleFile?.path, // เอาไฟล์ที่เป็น VEHICLE_CARD มาใส่ตรงนี้!
//               }
//             : null,
//         },
//       },
//     };
//   } catch (error) {
//     return { success: false, message: "เกิดข้อผิดพลาด", booking: null };
//   }
// }
