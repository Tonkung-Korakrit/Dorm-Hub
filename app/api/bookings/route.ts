import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RoomStatus, BookingType, BookingStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { user, room, type, groupId } = await request.json();

    if (!user?.id || !room?.id) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const lifestyleArray = user.lifestyle || [];

    // --- เริ่มกระบวนการจองภายใน Transaction ---
    const result = await prisma.$transaction(async (tx) => {

      // 1. ดึงข้อมูลห้องที่ต้องการจอง
      const targetRoom = await tx.room.findUnique({
        where: { id: Number(room.id) },
        select: {
          id: true,
          status: true,
          capacity: true,
          currentOccupancy: true,
          isSuite: true,
          parentId: true
        }
      });

      if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพัก");
      if (targetRoom.status === RoomStatus.FULL) throw new Error("ห้องพักนี้เต็มแล้ว");

      // 2. ตรวจสอบเงื่อนไขการจองแบบเหมา (CHARTER)
      if (type === BookingType.CHARTER) {
        if (targetRoom.currentOccupancy > 0 || targetRoom.status !== RoomStatus.AVAILABLE) {
          throw new Error("ห้องนี้ไม่สามารถจองแบบเหมาได้ เนื่องจากมีผู้เข้าพักแล้วหรือถูกจองไปบางส่วนแล้ว");
        }
      }

      // 3. คำนวณค่า Occupancy และ Status ใหม่ของห้องที่จอง
      let newOcc = targetRoom.currentOccupancy + 1;
      // let newStatus: RoomStatus = RoomStatus.AVAILABLE;
      let newStatus: RoomStatus = targetRoom.status;

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

      // 4. อัปเดตข้อมูลห้องที่ผู้ใช้เลือก
      const updatedRoom = await tx.room.update({
        // await tx.room.update({
        where: { id: targetRoom.id },
        data: {
          currentOccupancy: newOcc,
          status: newStatus,
          // คนแรกที่จองห้องนี้จะเป็นคนกำหนด Lifestyle กลางของห้อง
          ...(targetRoom.currentOccupancy === 0 && { lifestyleConfig: lifestyleArray })
        },
      });

      // 5. --- LOGIC พิเศษสำหรับ ZONE B (Suite Hierarchy) ---

      // กรณี A: ถ้าผู้ใช้จอง "ห้องลูก" (Sub-room)
      // if (targetRoom.parentId) {
      //   // เช็คพี่น้องใน Suite เดียวกันทั้งหมด
      //   const allSubRooms = await tx.room.findMany({
      //     where: { parentId: targetRoom.parentId },
      //     select: { status: true }
      //   });

      //   const isEverySubRoomFull = allSubRooms.every(r => r.status === RoomStatus.FULL);

      //   // อัปเดตสถานะห้องแม่ (Suite)
      //   await tx.room.update({
      //     where: { id: targetRoom.parentId },
      //     data: {
      //       status: isEverySubRoomFull ? RoomStatus.FULL : RoomStatus.PENDING
      //     }
      //   });
      // }

      // กรณี A: ถ้าผู้ใช้จอง "ห้องลูก" (Sub-room)
      if (targetRoom.parentId) {
        // ดึงข้อมูลพี่น้อง และห้องแม่มาคำนวณพร้อมกัน
        const suiteData = await tx.room.findUnique({
          where: { id: targetRoom.parentId },
          include: { subRooms: true }
        });

        if (suiteData) {
          // คำนวณ Occupancy รวมทั้งของ suite จากยอดใหม่ของห้องลูก
          // ใช้ยอดที่อัปเดตแล้วของห้องที่เพิ่งจอง + ยอดปัจจุบันของห้องลูกอื่นๆ 
          const totalSuiteOcc = suiteData.subRooms.reduce((sum, r) => {
            return sum + (r.id === targetRoom.id ? newOcc : r.currentOccupancy);
          }, 0);

          // เช็คว่าเหลือห้องลูกห้องไหนที่ยัง AVAILABLE อยู่บ้าง
          const hasAvailableSubRoom = suiteData.subRooms.some(r => {
            if (r.id === targetRoom.id) return newStatus === RoomStatus.AVAILABLE;
            return r.status === RoomStatus.AVAILABLE;
          });

          // เช็คสถานะห้องแม่: จะขึ้น PENDING ก็ต่อเมื่อ "ทั้ง A และ B" ไม่ว่างแล้ว
          // const isRoomA_Busy = suiteData.subRooms.find(r => r.roomId.endsWith('A'))?.status !== RoomStatus.AVAILABLE;
          // const isRoomB_Busy = suiteData.subRooms.find(r => r.roomId.endsWith('B'))?.status !== RoomStatus.AVAILABLE;

          // อัปเดตสถานะห้องแม่: Sync ทั้งจำนวนคน และสถานะ
          await tx.room.update({
            where: { id: targetRoom.parentId },
            data: {
              currentOccupancy: totalSuiteOcc,
              status: hasAvailableSubRoom ? RoomStatus.AVAILABLE : RoomStatus.PENDING
            }
          })
        }
      }

      // กรณี B: ถ้าผู้ใช้จอง "ห้องแม่" (Suite) แบบเหมา (CHARTER)
      // if (targetRoom.isSuite && type === BookingType.CHARTER) {
      //   // สั่งปิดห้องลูกทุกห้องทันที
      //   await tx.room.updateMany({
      //     where: { parentId: targetRoom.id },
      //     data: {
      //       status: RoomStatus.PENDING,
      //       currentOccupancy: 2 // สมมติว่าห้องลูกมีความจุ 2
      //     }
      //   });
      // }

      // 6. สร้างใบ Booking
      const newBooking = await tx.booking.create({
        data: {
          userId: Number(user.id),
          roomId: targetRoom.id,
          // status: BookingStatus.PENDING,
          booking_logs: {
            create: {
              status: BookingStatus.PENDING, // ต้องระบุสถานะเริ่มต้นเสมอ
              createdAt: new Date(),
            }
          },
          type: type as BookingType,
          groupId: groupId || null,
          // expiresAt: new Date(Date.now() + 10 * 60 * 1000), // หมดอายุใน 10 นาที
        },

        include: {
          booking_logs: {
            select: {
              status: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      const bookingResponse = {
        ...newBooking,
        // ดึง status จาก log ตัวแรกออกมาแปะไว้ข้างบน
        status: newBooking.booking_logs[0]?.status || BookingStatus.PENDING
      };

      return bookingResponse;
    }, {
      timeout: 15000,
      isolationLevel: 'Serializable' // เพิ่มความเข้มงวดป้องกันการจองซ้อน
    });

    // 7. อัปเดต Profile ผู้ใช้งาน (ทำนอก Transaction เพื่อไม่ให้ DB Lock นานเกินไป)
    await prisma.cus_users.update({
      where: { id: Number(user.id) },
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
      }
    }).catch(err => console.error("User Update Warning:", err.message));

    return NextResponse.json({
      success: true,
      booking: result,
    });

  } catch (error: any) {
    console.error("📌 Booking Error:", error.message);
    return NextResponse.json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการจอง"
    }, { status: 400 });
  }
}