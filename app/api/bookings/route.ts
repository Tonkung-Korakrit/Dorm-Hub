import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RoomStatus, BookingType, BookingStatus } from "@prisma/client";

// export async function POST(request: NextRequest) {
//   try {
//     // 1. รับข้อมูล lifestyle เพิ่มจากก้อน user
//     const { user, room, type } = await request.json();

//     console.log("user: ", user);
//     console.log("room: ", room);
//     console.log("type: ", type);

//     const result = await prisma.$transaction(async (tx) => {
//       // 2. ดึงข้อมูลห้องพักและตรวจสอบความสัมพันธ์
//       const targetRoom = await tx.room.findUnique({
//         where: { id: Number(room.id) },
//         include: { zone: { include: { dorm: true } } }
//       });

//       if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพัก");

//       // const isCharter = type === "CHARTER";
//       let dbType: BookingType;
//       if (type === "CHARTER") dbType = BookingType.CHARTER;
//       else if (type === "CO_RESIDENT") dbType = BookingType.CO_RESIDENT;
//       else dbType = BookingType.NOT_CHARTER;

//       const currentOcc = targetRoom.currentOccupancy;
//       const maxCap = targetRoom.capacity;
//       const CO_RESIDENT_LIMIT = maxCap + 10; // เวลาคนเหมาห้องจะทำให้ห้องเต็มทันที ต้องบวกเพิ่มจากขนาดห้อง

//       // 3. ตรวจสอบเงื่อนไขการจอง
//       if (dbType === BookingType.CHARTER) {
//         if (currentOcc > 0 || targetRoom.status !== RoomStatus.AVAILABLE) {
//           throw new Error("ห้องนี้ไม่สามารถจองแบบเหมาได้เนื่องจากมีผู้พักอยู่แล้ว");
//         }
//       } else if (dbType === BookingType.CO_RESIDENT) {
//         // เคสผู้พักร่วม: ต้องไม่เกิน 10 คน
//         if (currentOcc >= CO_RESIDENT_LIMIT) {
//           throw new Error("ขออภัย! ห้องพักนี้มีผู้พักร่วมเต็มจำนวน 10 คนแล้ว");
//         }
//         // หมายเหตุ: กรณี CO_RESIDENT เราอาจจะไม่เช็ค RoomStatus.FULL 
//         // เพราะสถานะ FULL ของห้องปกติอาจจะอ้างอิงตาม capacity (เช่น 2 หรือ 4 คน)
//       } else {
//         // สำหรับ NOT_CHARTER
//         if (currentOcc >= maxCap || targetRoom.status === RoomStatus.FULL) {
//           throw new Error("ขออภัย! ห้องพักนี้เต็มแล้ว");
//         }
//       }

//       await tx.user.update({
//         where: { id: Number(user.id) },
//         data: {
//           citizenType: user.citizenType,
//           citizenNumber: user.citizenNumber,
//           studentId: user.studentId,
//           gender: user.gender,
//           prefix: user.prefix,
//           // name: user.name,
//           name_en: user.name_en,
//           name_th: user.name_th,
//           birthDate: user.birthDate,
//           phone: user.phone,
//           isScholarshipStudent: user.isScholarshipStudent,
//           isDisabled: user.isDisabled,
//           // address_own: user.address_own,
//           // country: user.country,
//           // province: user.province,
//           // district: user.district,
//           // sub_district: user.sub_district,
//           // postal_code: user.postal_code,

//           faculty_department: user.faculty_department,
//           lifestyle: user.lifestyle
//         }
//       });

//       // 4. สร้างรายการจอง
//       const booking = await tx.booking.create({
//         data: {
//           status: BookingStatus.PENDING, // รอจ่ายตัง
//           type: dbType,
//           createdAt: new Date(),
//           user: { connect: { id: Number(user.id) } },
//           room: { connect: { id: targetRoom.id } },
//         },
//       });

//       // 5. คำนวณสถานะและเตรียมข้อมูลไลฟ์สไตล์
//       // let newStatus = targetRoom.status;
//       // const newOcc = isCharter ? maxCap : currentOcc + 1;
//       // if (isCharter || newOcc === maxCap) {
//       //   newStatus = RoomStatus.FULL;
//       // } else if (newOcc > 3) {
//       //   newStatus = RoomStatus.PENDING;
//       // }

//       if (dbType === BookingType.CHARTER) {
//         newStatus = RoomStatus.PENDING;
//       } else if (dbType === BookingType.CO_RESIDENT) {
//         // ถ้าพักร่วมครบ 10 คนค่อยเปลี่ยนเป็น FULL
//         newStatus = RoomStatus.FULL;
//         // if (dbType === BookingType.CO_RESIDENT) {
//         // newStatus = newOcc >= CO_RESIDENT_LIMIT ? RoomStatus.FULL : RoomStatus.PENDING;
//         // newStatus = newOcc >= CO_RESIDENT_LIMIT ? RoomStatus.FULL : targetRoom.status;
//         // }
//       } else {
//         // จองปกติ: ถ้าเท่ากับความจุห้อง (เช่น 2 หรือ 4) ให้ FULL
//         if (newOcc >= maxCap) newStatus = RoomStatus.PENDING;
//         else newStatus = RoomStatus.AVAILABLE;
//       }

//       // แปลง lifestyle array เป็น JSON string เพื่อเก็บลง DB
//       // const lifestyleJson = user.lifestyle ? JSON.stringify(user.lifestyle) : null;
//       const lifestyleArray = user.lifestyle || [];

//       // 6. อัปเดตห้องพัก
//       await tx.room.update({
//         where: { id: targetRoom.id },
//         data: {
//           currentOccupancy: newOcc,
//           status: newStatus,
//           // ถ้าเป็นคนแรกที่จอง ให้ Set Lifestyle ของห้องตามคนจองทันที
//           ...(currentOcc === 0 && { lifestyleConfig: lifestyleArray })
//         },
//       });

//       return { booking };
//     }, {
//       timeout: 10000 // เพิ่มเป็น 10 วินาที
//     });

//     return NextResponse.json({ success: true, booking: result.booking });

//   } catch (error: any) {
//     console.error("📌 Booking Error:", error.message);
//     return NextResponse.json({ success: false, error: error.message }, { status: 400 });
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const { user, room, type, groupId } = await request.json();

    // 1. เตรียม Data และ Logic พื้นฐานนอก Transaction
    // let dbType: BookingType = type === "CHARTER" ? BookingType.CHARTER : 
    //                          type === "CO_RESIDENT" ? BookingType.CO_RESIDENT : 
    //                          BookingType.NOT_CHARTER;

    const lifestyleArray = user.lifestyle || [];

    const result = await prisma.$transaction(async (tx) => {
      // 2. Select เฉพาะที่ใช้จริง (ลดเวลาการดึงข้อมูลลงได้มหาศาล)
      const targetRoom = await tx.room.findUnique({
        where: { id: Number(room.id) },
        select: { id: true, status: true, capacity: true, currentOccupancy: true }
      });

      if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องพัก");

      const currentOcc = targetRoom.currentOccupancy;
      const maxCap = targetRoom.capacity;
      const CO_RESIDENT_LIMIT = maxCap + 10;

      // 3. Validation Logic
      if (type === BookingType.CHARTER && (currentOcc > 0 || targetRoom.status !== RoomStatus.AVAILABLE)) {
        throw new Error("ห้องนี้ไม่สามารถจองแบบเหมาได้เนื่องจากมีผู้พักอยู่แล้ว");
      }
      
      //  4. คำนวณค่าใหม่
      let newOcc = currentOcc + 1;
      // let newStatus = RoomStatus.AVAILABLE;
      // let newStatus: RoomStatus = RoomStatus.AVAILABLE;
      let newStatus: RoomStatus = targetRoom.status;

      if (type === BookingType.CHARTER) {
        newOcc = maxCap;
        newStatus = RoomStatus.PENDING;
      } else if (type === BookingType.CO_RESIDENT) {
        newStatus = RoomStatus.FULL; 
      } else if (newOcc >= maxCap) {
        newStatus = RoomStatus.PENDING;
      }

      // 5. สร้างใบ booking
      const newBooking = await tx.booking.create({
        data: {
          userId: Number(user.id),
          roomId: targetRoom.id,
          status: BookingStatus.PENDING,
          type: type,
          groupId: groupId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // บวกเพิ่ม 10 นาที
        },
      });

      // 6. อัปเดตห้อง (ปิด Transaction ทันที)
      await tx.room.update({
        where: { id: targetRoom.id },
        data: {
          currentOccupancy: newOcc,
          status: newStatus,
          ...(currentOcc === 0 && { lifestyleConfig: lifestyleArray })
        },
      });

      return newBooking;
    }, { timeout: 10000 });

    // 7. อัปเดตข้อมูล (พยายามส่งเฉพาะฟิลด์ที่จำเป็นจริงๆ)
    await prisma.user.update({
      where: { id: Number(user.id) },
      data: {
        citizenType: user.citizenType,
        citizenNumber: user.citizenNumber,
        studentId: user.studentId,
        isScholarshipStudent: user.isScholarshipStudent,
        gender: user.gender,
        prefix: user.prefix,
        name_th: user.name_th,
        name_en: user.name_en,
        birthDate: user.birthDate,
        phone: user.phone,
        email: user.email,
        faculty_department: user.faculty_department,
        lifestyle: lifestyleArray,
      }
    }).catch(err => console.error("User Profile Update Error (Non-critical):", err));

    return NextResponse.json({ success: true, booking: result });

  } catch (error: any) {
    console.error("📌 Booking Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}