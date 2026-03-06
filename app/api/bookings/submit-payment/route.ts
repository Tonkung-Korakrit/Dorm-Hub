// api/bookings/submit-payment
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendPaymentVerifyingEmail } from "@/lib/mail";
import { getCurrentUser } from "@/lib/auth-utils";
import { BookingStatus, BookingType, PaymentStatus, RoomStatus } from "@/types/booking";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const { excludeConditions, isAuthenticated } = await getCurrentUser();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    // --- 1. Database Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลการจองพร้อมข้อมูลที่เกี่ยวข้องทั้งหมด
      const currentBooking = await tx.booking.findUnique({
        where: {
          id: Number(bookingId),
          cus_users: {
            OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
          }
        },
        include: {
          cus_users: { select: { name_th: true, email: true } },
          room: {
            include: {
              dorm: { include: { campus: true } }
            }
          }
        }
      });

      if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

      // 🛡️ เพิ่ม Authorization Check (ตัวอย่าง)
      // if (currentBooking.cus_users.studentId !== loggedInStudentId) throw new Error("Unauthorized");

      // --- เช็คสถานะก่อนดำเนินการ ---
      // if (currentBooking.room.status === RoomStatus.FULL && currentBooking.type !== BookingType.CO_RESIDENT) {
      //   throw new Error("ขออภัย ห้องพักนี้เต็มเรียบร้อยแล้ว");
      // }

      // Logic คำนวณสถานะห้องพัก
      const { type, room } = currentBooking;
      let finalRoomStatus = room.status;
      const MAX_CO_RESIDENT_ADDITIONAL = 10;
      const CO_RESIDENT_LIMIT = room.capacity + MAX_CO_RESIDENT_ADDITIONAL;

      if (type === BookingType.CHARTER) {
        finalRoomStatus = RoomStatus.FULL;
      } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
        finalRoomStatus = RoomStatus.FULL;
      }
      // else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
      //   finalRoomStatus = RoomStatus.FULL;
      else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= (CO_RESIDENT_LIMIT)) {
        finalRoomStatus = RoomStatus.FULL;
        throw new Error("ขออภัย มีผู้ทำรายการชำระเงินตัดหน้าไปก่อนหน้าเพียงครู่เดียว ทำให้โควตาเต็มแล้ว");
      } else if (room.currentOccupancy >= room.capacity) {
        // กรณีจองปกติ (Individual): ถ้าเต็มความจุเตียงปกติแล้ว ให้เป็น FULL
        finalRoomStatus = RoomStatus.FULL;
      }

      // อัปเดตสถานะการจองเป็น VERIFYING
      const updatedBooking = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          booking_logs: {
            create: {
              status: BookingStatus.VERIFYING,
              createdAt: new Date()
            }
          }
        },
        include: {
          cus_users: { select: { name_th: true, email: true } },
          room: {
            include: {
              dorm: { include: { campus: true } }
            }
          }
        }
      });

      // อัปเดตตาราง Payment ให้สอดคล้องกัน
      await tx.payment.updateMany({
        where: { bookingId: Number(bookingId), status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCESS } // หรือตามสถานะใน Enum ของคุณ
      });

      // --- 1.2 อัปเดตสถานะห้องปัจจุบัน (ห้องลูก หรือ ห้องเดี่ยว) ---
      await tx.room.update({
        where: { id: room.id },
        data: { status: finalRoomStatus }
      });

      // --- 1.3 Sync สถานะไปยังห้องแม่ (กรณีเป็น Suite) ---
      // if (room.parentId) {
      //   const allSubRooms = await tx.room.findMany({
      //     where: { parentId: room.parentId },
      //     select: { status: true }
      //   });

      //   // เช็คว่าห้องย่อยทุกห้อง (A และ B) ไม่ว่างแล้วใช่ไหม
      //   // (เป็น FULL หรือ PENDING ทั้งหมด)
      //   const isEverySubRoomBusy = allSubRooms.every(r =>
      //     r.status === RoomStatus.FULL || r.status === RoomStatus.PENDING
      //   );

      //   await tx.room.update({
      //     where: { id: room.parentId },
      //     data: {
      //       status: isEverySubRoomBusy ? RoomStatus.FULL : RoomStatus.AVAILABLE
      //     }
      //   });
      // }

      if (currentBooking.room.parentId) {
        const allSubRooms = await tx.room.findMany({
          where: { parentId: currentBooking.room.parentId }
        });

        // ปรับปรุง: ถ้าห้องลูก "ไม่ใช่ AVAILABLE" แม้แต่ห้องเดียว ห้องแม่ต้องไม่ AVAILABLE
        const isEverySubRoomBusy = allSubRooms.every(r => r.status !== RoomStatus.AVAILABLE);

        await tx.room.update({
          where: { id: currentBooking.room.parentId },
          data: { status: isEverySubRoomBusy ? RoomStatus.FULL : RoomStatus.AVAILABLE }
        });
      }

      // กรณีเป็นผู้พักร่วม (CO_RESIDENT) ให้หาชื่อเจ้าของห้องหลักไว้เลย
      let ownerName = "";
      if (type === BookingType.CO_RESIDENT) {
        const owner = await tx.booking.findFirst({
          where: {
            roomId: currentBooking.roomId,
            type: BookingType.CHARTER,
            // status: { in: [BookingStatus.COMPLETED] },
            booking_logs: {
              some: {
                status: {
                  in: [BookingStatus.COMPLETED]
                }
              }
            }
          },
          include: { cus_users: { select: { name_th: true } } }
        });
        ownerName = owner?.cus_users.name_th || "เจ้าของห้องหลัก";
      }

      return { bookingData: updatedBooking, ownerName };
    }, {
      timeout: 15000,
      isolationLevel: 'Serializable' // เพิ่มความเข้มงวดป้องกันการจองซ้อน
    });


    // --- 2. Notification (แนะนำให้ await บน Cloud เพื่อป้องกัน Process โดนตัด) ---
    try {
      if (result.bookingData.cus_users.email) {
        let coResidentNote = result.ownerName
          ? `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${result.ownerName}`
          : "";

        // ส่งอีเมล (ใส่ await เพื่อให้มั่นใจว่าส่งออกไปจริงก่อนปิด request)
        await sendPaymentVerifyingEmail(result.bookingData, coResidentNote);
      }

      // ถ้ามี Line Notify ให้ใส่ตรงนี้
      // await sendLineNotify(...); 

    } catch (notifError) {
      // ถ้าส่งเมลพลาด ไม่ต้องระเบิด Error ใส่ User แต่ให้ Log ไว้ตรวจสอบ
      console.error("🔔 Notification Error:", notifError);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("📌 Submit Payment Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// แบบใช้ nodemailer บน local ผ่าน แต่บน server ไม่ผ่าน (น่าจะเพราะปัญหาการตั้งค่า SMTP ของ Gmail ที่เข้มงวดขึ้น) เลยเปลี่ยนมาใช้บริการส่งเมลภายนอกแทน และแยกฟังก์ชันส่งเมลออกมาเป็นไฟล์ใหม่ใน lib/mail.ts เพื่อความสะดวกในการจัดการและแก้ไขในอนาคตครับ
// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";
// import { sendPaymentVerifyingEmail } from "@/lib/mail";

// export async function POST(request: NextRequest) {
//   try {
//     const { bookingId } = await request.json();

//     if (!bookingId) {
//       return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
//     }

//     // --- 1. Lean Transaction: ดึงข้อมูลและอัปเดตจบในรอบเดียว ---
//     const bookingData = await prisma.$transaction(async (tx) => {
//       // ดึงข้อมูลที่จำเป็นทั้งหมดมาตั้งแต่แรกเพื่อลด Round-trip DB
//       const currentBooking = await tx.booking.findUnique({
//         where: { id: Number(bookingId) },
//         select: {
//           id: true,
//           type: true,
//           roomId: true,
//           user: { select: { name_th: true, email: true } },
//           room: {
//             select: {
//               id: true,
//               roomId: true,
//               status: true,
//               capacity: true,
//               currentOccupancy: true,
//               zone: { select: { name: true, dorm: { select: { name: true } } } }
//             }
//           }
//         }
//       });

//       if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

//       // อัปเดตสถานะการจองเป็น VERIFYING
//       await tx.booking.update({
//         where: { id: Number(bookingId) },
//         data: { status: BookingStatus.VERIFYING }
//       });

//       // คำนวณสถานะห้องพักใหม่ตาม Logic ที่คุณกำหนด
//       const { type, room } = currentBooking;
//       let finalRoomStatus = room.status;
//       const CO_RESIDENT_LIMIT = room.capacity + 10;

//       if (type === BookingType.CHARTER) {
//         finalRoomStatus = RoomStatus.FULL;
//       } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
//         finalRoomStatus = RoomStatus.FULL;
//       } else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
//         finalRoomStatus = RoomStatus.FULL;
//       }

//       // อัปเดตสถานะห้อง
//       await tx.room.update({
//         where: { id: room.id },
//         data: { status: finalRoomStatus }
//       });

//       return currentBooking;
//     }, { timeout: 15000 }); // เผื่อเวลาให้ DB กรณีอยู่ไกล

//     // --- 2. Background Tasks: ส่ง Notification โดยไม่ให้ User รอ (Fire and Forget) ---
//     const runBackgroundTasks = async () => {
//       try {
//         // Line Notification
//         // const lineMessage = `📢 รับหลักฐานชำระเงินแล้ว!\nคุณ: ${bookingData.user.name_th}\nห้อง: ${bookingData.room.roomId}\nสถานะ: รอตรวจสอบ`;
//         // fetch("https://notify-api.line.me/api/notify", {
//         //   method: "POST",
//         //   headers: {
//         //     "Content-Type": "application/x-www-form-urlencoded",
//         //     "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
//         //   },
//         //   body: new URLSearchParams({ message: lineMessage })
//         // }).catch(err => console.error("Line Notify Error:", err));

//         // Email Notification
//         if (bookingData.user.email) {
//           let coResidentNote = "";
//           if (bookingData.type === BookingType.CO_RESIDENT) {
//             const owner = await prisma.booking.findFirst({
//               where: {
//                 roomId: bookingData.roomId,
//                 type: BookingType.CHARTER,
//                 status: BookingStatus.VERIFYING
//               },
//               include: { user: { select: { name_th: true } } }
//             });
//             coResidentNote = `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${owner?.user.name_th || "เจ้าของห้องหลัก"}`;
//           }
//           await sendPaymentVerifyingEmail(bookingData as any, coResidentNote);
//         }
//       } catch (err) {
//         console.error("Background Tasks Error:", err);
//       }
//     };

//     runBackgroundTasks(); // รันเบื้องหลังทันที ไม่รอให้เสร็จก่อน

//     return NextResponse.json({ success: true }); // คืนค่า success ให้ User ได้ทันที

//   } catch (error: any) {
//     console.error("📌 Submit Payment Error:", error.message);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }