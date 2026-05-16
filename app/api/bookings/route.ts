// api/bookings/route.ts

import { prisma } from "@/lib/prisma";
import { sendBookingStatusFlex } from "@/lib/line";
import { syncProfileImages } from "@/lib/profile-images";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, BookingType, RoomStatus } from "@/utils/types";
// import { getAuthSession } from "@/services/identify";

export async function POST(request: NextRequest) {
  try {
    // const { excludeConditions, isAuthenticated } = await getAuthSession();

    // if (!isAuthenticated) {
    //   return NextResponse.json(
    //     { error: "Unauthorized - ไม่ได้รับอนุญาต" },
    //     { status: 401 },
    //   );
    // }

    const body = await request.json();
    const { user, room, type, groupId, address, profileImages } = body;

    const uId = user?.id || user?.userId;
    const rId = room?.id;

    // if (!user?.id || !room?.id) {
    //   return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    // }

    if (isNaN(uId) || isNaN(rId)) {
      console.log("❌ Invalid ID detected:", { uId, rId });
      return NextResponse.json(
        {
          error: "ID ผู้ใช้หรือ ID ห้องพักไม่ถูกต้อง",
          received: { userId: uId, roomId: rId },
        },
        { status: 400 },
      );
    }

    const lifestyleArray = user.lifestyle || [];
    const facultyConfig = user.faculty_department || [];

    // --- เริ่มกระบวนการจองภายใน Transaction ---
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. ล็อกแถวข้อมูลห้องทันที (คนอื่นที่อ่านห้องเดียวกันด้วย FOR UPDATE จะต้องรอ)
        // วิธีนี้จะทำให้คนอื่นที่พยายามเข้าถึงห้องเดียวกันต้อง "รอ" จนกว่าคนแรกจะจบ Transaction
        const rooms: any[] = await tx.$queryRaw`
        SELECT id, status, capacity, currentOccupancy, parentId, facultyConfig
        FROM Room 
        WHERE id = ${Number(room.id)} 
        FOR UPDATE
      `;
        const targetRoom = rooms[0];

        if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพัก");
        if (
          type !== BookingType.CO_RESIDENT &&
          targetRoom.status === RoomStatus.FULL
        )
          throw new Error("ห้องพักนี้เต็มแล้ว");

      // 2. ตรวจสอบเงื่อนไขการจองแบบเหมา (CHARTER)
      if (type === BookingType.CHARTER) {
        if (targetRoom.currentOccupancy > 0 && targetRoom.status !== RoomStatus.AVAILABLE) {
          throw new Error("ห้องนี้ไม่สามารถจองแบบเหมาได้ เนื่องจากมีผู้เข้าพักแล้วหรือถูกจองไปบางส่วนแล้ว");
        }
      }

        // 3. คำนวณค่า Occupancy และ Status ใหม่ของห้องที่จอง
        let newOcc = targetRoom.currentOccupancy + 1;
        // let newStatus: RoomStatus = RoomStatus.AVAILABLE;
        let newStatus: RoomStatus = targetRoom.status;

        if (type !== BookingType.CO_RESIDENT && newOcc > targetRoom.capacity) {
          throw new Error(
            "ขออภัย มีผู้ใช้งานท่านอื่นจองที่นั่งสุดท้ายไปก่อนหน้าคุณเพียงเสี้ยววินาที",
          );
        }

        const MAX_CO_RESIDENT_ADDITIONAL = 10;
        const CO_RESIDENT_LIMIT = room.capacity + MAX_CO_RESIDENT_ADDITIONAL;

        if (type === BookingType.CHARTER) {
          newOcc = targetRoom.capacity;
          newStatus = RoomStatus.PENDING; // ตั้งเป็น PENDING ระหว่างรอชำระเงิน
        } else if (type === BookingType.CO_RESIDENT) {
          // ด่านตรวจโควตา 10 คน
          if (targetRoom.currentOccupancy >= CO_RESIDENT_LIMIT) {
            throw new Error("ห้องนี้มีผู้พักร่วมเต็มโควตา (10 คน) แล้ว");
          }
          // เมื่อเป็น CO_RESIDENT ให้ล็อกสถานะเป็น FULL ทันทีตามที่คุณต้องการ
          newStatus = RoomStatus.FULL;
        } else if (newOcc >= targetRoom.capacity) {
          // ถ้าคนจองคนนี้ทำให้ห้อง "เต็มพอดี" (เป็นคนสุดท้าย)
          // ให้สถานะเป็น PENDING เพื่อรอชำระเงินก่อนจะเป็น FULL
          newStatus = RoomStatus.PENDING;
        } else {
          // ถ้ายังไม่เต็ม และไม่ใช่คนสุดท้าย ห้องต้องยัง AVAILABLE
          // เพื่อให้คนที่ 2, 3 เข้ามาเห็นและจองได้
          newStatus = RoomStatus.AVAILABLE;
        }

        // ดึงคณะเดิมออกมา ถ้าไม่มีให้เป็น Array ว่าง
        const existingFaculties = Array.isArray(targetRoom.facultyConfig)
          ? targetRoom.facultyConfig
          : [];

        // เพิ่มคณะใหม่ของ User คนนี้เข้าไป (กรองค่าว่างออกเพื่อความปลอดภัย)
        const updatedFaculties = user.faculty_department
          ? [...existingFaculties, user.faculty_department]
          : existingFaculties;

        // 4. อัปเดตข้อมูลห้องที่ผู้ใช้เลือก
        const updatedRoom = await tx.room
          .update({
            where: {
              id: targetRoom.id,
              // ด่านป้องกันสุดท้าย: ถ้าตอนที่กำลังจะเขียน ข้อมูลเปลี่ยนไปแล้ว ให้ Update ล้มเหลว
              status: targetRoom.status,
              currentOccupancy: targetRoom.currentOccupancy,
            },
            data: {
              currentOccupancy: newOcc,
              status: newStatus,
              facultyConfig: updatedFaculties,
              // คนแรกที่จองห้องนี้จะเป็นคนกำหนด Lifestyle กลางของห้อง
              ...(targetRoom.currentOccupancy === 0 && {
                lifestyleConfig: lifestyleArray,
                lifestyleNote: user.lifestyleNote,
              }),
            },
          })
          .catch(() => {
            // ถ้าจับ Error ตรงนี้ได้ แสดงว่ามีคนจองตัดหน้าไปเสี้ยววินาที
            throw new Error(
              "ขออภัย ห้องพักถูกจองไปแล้วโดยผู้ใช้อื่น กรุณาลองใหม่อีกครั้ง",
            );
          });

        // 2. อัปเดตข้อมูล (ไม่ต้องใส่เงื่อนไข status ใน where แล้ว เพราะเราล็อกแถวไว้แล้ว)
        // await tx.room.update({
        //   where: { id: targetRoom.id },
        //   data: {
        //     currentOccupancy: newOcc,
        //     status: newStatus,
        //   },
        // });

        // 5. --- LOGIC พิเศษสำหรับ ZONE B (Suite Hierarchy) ---
        // กรณี A: ถ้าผู้ใช้จอง "ห้องลูก" (Sub-room)
        if (targetRoom.parentId) {
          // ดึงข้อมูลพี่น้อง และห้องแม่มาคำนวณพร้อมกัน
          const suiteData = await tx.room.findUnique({
            where: { id: targetRoom.parentId },
            include: { subRooms: true },
          });

          if (suiteData) {
            // คำนวณ Occupancy รวมทั้งของ suite จากยอดใหม่ของห้องลูก
            // ใช้ยอดที่อัปเดตแล้วของห้องที่เพิ่งจอง + ยอดปัจจุบันของห้องลูกอื่นๆ
            const totalSuiteOcc = suiteData.subRooms.reduce((sum, r) => {
              return (
                sum + (r.id === targetRoom.id ? newOcc : r.currentOccupancy)
              );
            }, 0);

            // เช็คว่าเหลือห้องลูกห้องไหนที่ยัง AVAILABLE อยู่บ้าง
            const hasAvailableSubRoom = suiteData.subRooms.some((r) => {
              if (r.id === targetRoom.id)
                return newStatus === RoomStatus.AVAILABLE;
              return r.status === RoomStatus.AVAILABLE;
            });

            // อัปเดตสถานะห้องแม่: Sync ทั้งจำนวนคน และสถานะ
            await tx.room.update({
              where: { id: targetRoom.parentId },
              data: {
                currentOccupancy: totalSuiteOcc,
                status: hasAvailableSubRoom
                  ? RoomStatus.AVAILABLE
                  : RoomStatus.PENDING,
              },
            });
          }
        }

        // 6. สร้างใบ Booking
        // const newBooking = await tx.booking.create({
        //   data: {
        //     userId: Number(user.id),
        //     roomId: targetRoom.id,
        //     // status: BookingStatus.PENDING,
        //     booking_logs: {
        //       create: {
        //         status: BookingStatus.PENDING, // ต้องระบุสถานะเริ่มต้นเสมอ
        //         createdAt: new Date(),
        //       }
        //     },
        //     type: type as BookingType,
        //     groupId: groupId || null,
        //     // expiresAt: new Date(Date.now() + 10 * 60 * 1000), // หมดอายุใน 10 นาที
        //   },

        //   include: {
        //     booking_logs: {
        //       select: {
        //         status: true,
        //       },
        //       orderBy: { createdAt: 'desc' },
        //       take: 1
        //     }
        //   }
        // });

        // const bookingResponse = {
        //   ...newBooking,
        //   // ดึง status จาก log ตัวแรกออกมาแปะไว้ข้างบน
        //   status: newBooking.booking_logs[0]?.status || BookingStatus.PENDING
        // };

        const depositAmount = room.price || 5000;

        const newBooking = await tx.booking.create({
          data: {
            userId: Number(user.id),
            roomId: targetRoom.id,
            type: type as BookingType,
            groupId: groupId || null,
            status: BookingStatus.PENDING,
            booking_logs: {
              create: {
                status: BookingStatus.PENDING,
                createdAt: new Date(),
              },
            },

            // เพิ่มการสร้าง Payment ตรงนี้เลย
            // payments: {
            //   create: {
            //     amount: depositAmount,
            //     currency: "THB",
            //     status: PaymentStatus.PENDING,
            //     method: "PROMPTPAY",
            //     // ในขั้นตอนนี้เรายังไม่มี external_id จาก Gateway
            //     // เพราะเรายังไม่ได้ยิงไปหา Omise/ธนาคาร
            //     // เราจะสร้างไว้รอ แล้วค่อยไปอัปเดต qr_payload ที่หน้า /payment
            //   },
            // },
          },

          include: {
            booking_logs: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            room: {
              include: {
                dorm: true,
              },
            },
            // payments: {
            //   orderBy: { createdAt: 'desc' },
            //   take: 1
            // }
          },
        });

        return newBooking;
      },
      {
        timeout: 15000,
        isolationLevel: "Serializable", // เพิ่มความเข้มงวดป้องกันการจองซ้อน
      },
    );

    // 7. อัปเดต Profile ผู้ใช้งาน (ทำนอก Transaction เพื่อไม่ให้ DB Lock นานเกินไป)
    await prisma.cus_users
      .update({
        where: { id: Number(uId) },
        data: {
          citizenType: user.citizenType,
          citizenNumber: user.citizenNumber,
          studentId: user.studentId,
          isScholarshipStudent: user.isScholarshipStudent,
          isDisabled: user.isDisabled,
          gender: user.gender,
          titleName: user.titleName,
          name_th: user.name_th,
          name_en: user.name_en,
          birthDate: user.birthDate ? new Date(user.birthDate) : null,
          mobilePhone: user.mobilePhone,
          email: user.email,
          faculty_department: user.faculty_department,
          lifestyle: lifestyleArray,
          lifestyleNote: user.lifestyleNote,
        },
      })
      .catch((err) => console.error("User Update Warning:", err.message));

    await syncProfileImages(prisma, Number(uId), profileImages);

    const vehicleInfo = user.vehicleInfo

    // console.log("user in api/booking: ", user)
    // console.log("user.vehicle in api/booking: ", vehicleInfo)

    if (vehicleInfo && vehicleInfo.licensePlate) {
      try {
        let fileId = undefined;

        if (vehicleInfo.path) {
          const newFile = await prisma.file_info.create({
            data: {
              createdBy: Number(uId),
              type: "VEHICLE_CARD",
              path: body.vehicle.filePath,
            },
          });
          fileId = newFile.id;
        }

        const vehicleData = {
          licensePlate: vehicleInfo.licensePlate,
          province: vehicleInfo.province,
          ownerName: vehicleInfo.ownerName || "",
          ...(fileId && { fileId: fileId }),
        };

        await prisma.vehicle.upsert({
          where: { userId: Number(uId) },
          update: vehicleData,
          create: {
            ...vehicleData,
            userId: Number(uId),
            ownerName: vehicleInfo.ownerName || "",
          },
        });
      } catch (vehError: any) {
        console.error("Vehicle Update Warning:", vehError.message);
      }
    }

    try {
      const hasAddress = await prisma.address.findFirst({
        where: { userId: Number(uId) },
      });

      if (!hasAddress) {
        await prisma.address.create({
          data: {
            userId: Number(user.id),
            type: address.type,
            addressDetail: address.addressDetail,
            country: address.country,
            district: address.district,
            postalCode: address.postalCode,
            province: address.province,
            subDistrict: address.subDistrict,
          },
        });
      } else {
        await prisma.address.update({
          where: { id: hasAddress.id },
          data: {
            type: address.type,
            addressDetail: address.addressDetail,
            country: address.country,
            district: address.district,
            postalCode: address.postalCode,
            province: address.province,
            subDistrict: address.subDistrict,
          },
        });
      }
    } catch (err) {
      console.error("update address error:", err);
    }

    const bookingStatus =
      result.booking_logs?.[0]?.status || BookingStatus.PENDING;

    try {
      await sendBookingStatusFlex({
        userId: Number(user.id),
        bookingId: result.id,
        status: bookingStatus,
        dormName: result.room?.dorm?.name || "-",
        roomCode: result.room?.roomId || "-",
      });
    } catch (lineError: any) {
      console.error("LINE push warning:", lineError?.message || lineError);
    }

    return NextResponse.json({
      success: true,
      booking: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการจอง",
      },
      { status: 400 },
    );
  }
}
