import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";
import { sendReceiptReceivedEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // --- 1. Lean Transaction: ดึงข้อมูลและอัปเดตจบในรอบเดียว ---
    const bookingData = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลที่จำเป็นทั้งหมดมาตั้งแต่แรกเพื่อลด Round-trip DB
      const currentBooking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        select: { 
          id: true, 
          type: true, 
          roomId: true,
          user: { select: { name_th: true, email: true } },
          room: {
            select: {
              id: true,
              roomId: true,
              status: true,
              capacity: true,
              currentOccupancy: true,
              zone: { select: { name: true, dorm: { select: { name: true } } } }
            }
          }
        }
      });

      if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

      // อัปเดตสถานะการจองเป็น VERIFYING
      await tx.booking.update({
        where: { id: Number(bookingId) },
        data: { status: BookingStatus.VERIFYING }
      });

      // คำนวณสถานะห้องพักใหม่ตาม Logic ที่คุณกำหนด
      const { type, room } = currentBooking;
      let finalRoomStatus = room.status;
      const CO_RESIDENT_LIMIT = room.capacity + 10;

      if (type === BookingType.CHARTER) {
        finalRoomStatus = RoomStatus.FULL;
      } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
        finalRoomStatus = RoomStatus.FULL;
      } else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
        finalRoomStatus = RoomStatus.FULL;
      }

      // อัปเดตสถานะห้อง
      await tx.room.update({
        where: { id: room.id },
        data: { status: finalRoomStatus }
      });

      return currentBooking; 
    }, { timeout: 15000 }); // เผื่อเวลาให้ DB กรณีอยู่ไกล

    // --- 2. Background Tasks: ส่ง Notification โดยไม่ให้ User รอ (Fire and Forget) ---
    const runBackgroundTasks = async () => {
      try {
        // Line Notification
        const lineMessage = `📢 รับหลักฐานชำระเงินแล้ว!\nคุณ: ${bookingData.user.name_th}\nห้อง: ${bookingData.room.roomId}\nสถานะ: รอตรวจสอบ`;
        fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
          },
          body: new URLSearchParams({ message: lineMessage })
        }).catch(err => console.error("Line Notify Error:", err));

        // Email Notification
        if (bookingData.user.email) {
          let coResidentNote = "";
          if (bookingData.type === BookingType.CO_RESIDENT) {
            const owner = await prisma.booking.findFirst({
              where: {
                roomId: bookingData.roomId,
                type: BookingType.CHARTER,
                status: BookingStatus.VERIFYING
              },
              include: { user: { select: { name_th: true } } }
            });
            coResidentNote = `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${owner?.user.name_th || "เจ้าของห้องหลัก"}`;
          }
          await sendReceiptReceivedEmail(bookingData as any, coResidentNote);
        }
      } catch (err) {
        console.error("Background Tasks Error:", err);
      }
    };

    runBackgroundTasks(); // รันเบื้องหลังทันที ไม่รอให้เสร็จก่อน

    return NextResponse.json({ success: true }); // คืนค่า success ให้ User ได้ทันที

  } catch (error: any) {
    console.error("📌 Submit Payment Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";
// import { sendReceiptReceivedEmail } from "@/lib/mail";

// export async function POST(request: NextRequest) {
//   try {
//     const { bookingId } = await request.json();

//     if (!bookingId) {
//       return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
//     }

//     // --- 1. Lean Transaction: ทำเฉพาะงานที่ต้อง Lock DB ---
//     const transactionResult = await prisma.$transaction(async (tx) => {
//       const currentBooking = await tx.booking.findUnique({
//         where: { id: Number(bookingId) },
//         select: { 
//           id: true, 
//           type: true, 
//           roomId: true,
//           room: {
//             select: {
//               id: true,
//               status: true,
//               capacity: true,
//               currentOccupancy: true
//             }
//           }
//         }
//       });

//       if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

//       // อัปเดตสถานะการจองเป็น VERIFYING
//       const updated = await tx.booking.update({
//         where: { id: Number(bookingId) },
//         data: { status: BookingStatus.VERIFYING }
//       });

//       // คำนวณสถานะห้องพักใหม่ (ย้าย Logic มาไว้ตรงนี้ให้จบไวๆ)
//       const { type, room } = currentBooking;
//       let finalRoomStatus = RoomStatus.AVAILABLE;
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

//       return updated;
//     }, {
//       timeout: 15000 // เพิ่ม Timeout เป็น 15 วินาที
//     });

//     // --- 2. Post-Transaction: ดึงข้อมูลเพื่อส่ง Notification (ทำข้างนอกลดภาระ DB) ---
//     const fullBookingData = await prisma.booking.findUnique({
//       where: { id: transactionResult.id },
//       include: {
//         user: true,
//         room: {
//           include: {
//             zone: { include: { dorm: true } }
//           }
//         }
//       }
//     });

//     if (!fullBookingData) return NextResponse.json({ success: true });

//     // --- 3. Line Notification ---
//     const lineMessage = `📢 รับหลักฐานชำระเงินแล้ว!\nคุณ: ${fullBookingData.user.name_th}\nห้อง: ${fullBookingData.room.roomId}\nสถานะ: รอตรวจสอบ`;
//     fetch("https://notify-api.line.me/api/notify", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//         "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
//       },
//       body: new URLSearchParams({ message: lineMessage })
//     }).catch(err => console.error("Line Notify Error:", err));

//     // --- 4. เตรียมข้อมูล Co-Resident และส่ง Email ---
//     let coResidentNote = "";
//     if (fullBookingData.type === BookingType.CO_RESIDENT) {
//       const ownerBooking = await prisma.booking.findFirst({
//         where: {
//           roomId: fullBookingData.room.id,
//           type: BookingType.CHARTER,
//           status: BookingStatus.VERIFYING
//         },
//         include: { user: { select: { name_th: true } } }
//       });
//       coResidentNote = `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${ownerBooking?.user.name_th || "เจ้าของห้องหลัก"}`;
//     }

//     if (fullBookingData.user.email) {
//       // ไม่ต้องใช้ await ตรงนี้ก็ได้ถ้าไม่อยากให้ User รอนานเกินไป
//       sendReceiptReceivedEmail(fullBookingData as any, coResidentNote)
//         .catch(err => console.error("Email Error:", err));
//     }

//     return NextResponse.json({ success: true });

//   } catch (error: any) {
//     console.error("Confirm Payment Error:", error.message);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

// // import { prisma } from "@/lib/prisma";
// // import { NextRequest, NextResponse } from "next/server";
// // import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";
// // import { sendReceiptReceivedEmail } from "@/lib/mail"; // 🚩 1. Import helper ที่เราสร้างไว้

// // export async function POST(request: NextRequest) {
// //   try {
// //     const { bookingId } = await request.json();

// //     if (!bookingId) {
// //       return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
// //     }

// //     const booking = await prisma.$transaction(async (tx) => {
// //       const currentBooking = await tx.booking.findUnique({
// //         where: { id: Number(bookingId) },
// //         include: { room: true }
// //       });

// //       if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

// //       const updatedBooking = await tx.booking.update({
// //         where: { id: Number(bookingId) },
// //         data: { status: BookingStatus.VERIFYING },
// //         include: {
// //           user: true,
// //           room: {
// //             include: {
// //               zone: { include: { dorm: true } }
// //             }
// //           }
// //         }
// //       });

// //       const { type, room } = updatedBooking;
// //       let finalRoomStatus = room.status;
// //       const maxCap = room.capacity;
// //       const CO_RESIDENT_LIMIT = maxCap + 10;

// //       if (type === BookingType.CHARTER) {
// //         finalRoomStatus = RoomStatus.FULL;
// //       } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
// //         finalRoomStatus = RoomStatus.FULL;
// //       } else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
// //         finalRoomStatus = RoomStatus.FULL;
// //       } else {
// //         finalRoomStatus = RoomStatus.AVAILABLE;
// //       }

// //       await tx.room.update({
// //         where: { id: room.id },
// //         data: { status: finalRoomStatus }
// //       });

// //       return updatedBooking;
// //     });

// //     // 2. ส่ง Line Notification (เหมือนเดิม)
// //     const lineMessage = `📢 จองหอพักสำเร็จ!\nคุณ: ${booking.user.name_th}\nห้อง: ${booking.room.roomId}\nวิทยาเขต: ${booking.room.zone.dorm.name}`;
// //     fetch("https://notify-api.line.me/api/notify", {
// //       method: "POST",
// //       headers: {
// //         "Content-Type": "application/x-www-form-urlencoded",
// //         "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
// //       },
// //       body: new URLSearchParams({ message: lineMessage })
// //     }).catch(err => console.error("Line Notify Error:", err));

// //     // 3. เตรียมข้อมูล Co-Resident (ถ้ามี)
// //     let coResidentNote = "";
// //     if (booking.type === BookingType.CO_RESIDENT) {
// //       const ownerBooking = await prisma.booking.findFirst({
// //         where: {
// //           roomId: booking.room.id,
// //           type: BookingType.CHARTER,
// //           status: BookingStatus.VERIFYING
// //         },
// //         include: { user: { select: { name_th: true } } }
// //       });

// //       const ownerName = ownerBooking?.user.name_th || "เจ้าของห้องหลัก";
// //       coResidentNote = `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${ownerName}`;
// //     }

// //     // 🚩 4. เรียกใช้ฟังก์ชันส่ง Email จาก Mail Helper
// //     // เราส่ง booking object และ coResidentNote เข้าไปได้เลย
// //     if (booking.user.email) {
// //       await sendReceiptReceivedEmail(booking as any, coResidentNote);
// //     }

// //     return NextResponse.json({ success: true });
// //   } catch (error: any) {
// //     console.error("Confirm Payment Error:", error.message);
// //     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
// //   }
// // }