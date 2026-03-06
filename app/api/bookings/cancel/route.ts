import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { BookingStatus, BookingType, PaymentStatus, RoomStatus } from "@/types/booking";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, isExpired } = await request.json();

    // 1. ตรวจสอบตัวตน (Hybrid Auth)
    // const cookieStore = await cookies();
    // const userToken = cookieStore.get("token")?.value;
    // const nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // let userId: number | null = null;
    // let studentIdFromToken: string | null = null;

    // if (userToken) {
    //   const { payload } = await jwtVerify(userToken, SECRET_USER);
      // จุดเช็ค: ถ้าใน Login ใส่ { id: studentId } ตรงนี้ต้องใช้ payload.studentId
      // console.log("✅ JWT Payload:", payload);
      //   JWT Payload: {
      //   studentId: '6509650203',
      //   role: 'STUDENT',
      //   provider: 'TU',
      //   iat: 1771483739,
      //   exp: 1771487339
      // }
    //   studentIdFromToken = payload.studentId as string;
    // } else if (nextAuthToken) {
    //   userId = Number(nextAuthToken.id);
    //   studentIdFromToken = nextAuthToken.studentId as string;
    // }

    // if (!userId && !studentIdFromToken) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { excludeConditions, isAuthenticated } = await getCurrentUser();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ยกเลิกรายการจองนี้" }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. ดึงข้อมูลการจองมาเช็ค "ความเป็นเจ้าของ"
      const current = await tx.booking.findUnique({
        where: { 
          id: Number(bookingId),
          cus_users: {
            OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
          }
        },
        include: { 
          room: true,
          // cus_users: {
          //   select: {
          //     studentId: true,
          //   },
          // } // ดึงข้อมูลเจ้าของมาเช็ค
        }
      });

      if (!current) throw new Error("ไม่พบข้อมูลการจอง");

      // 3. ด่านตรวจความเป็นเจ้าของ (ป้องกันคนแอบแก้ ID ในหน้าบ้านแล้วกด Cancel)
      // const isOwner = 
      //   (userId && current.userId === userId) || 
      //   (studentIdFromToken && current.cus_users.studentId === studentIdFromToken);

      const finalStatus = isExpired ? BookingStatus.EXPIRED : BookingStatus.CANCELLED;

      // 4. Logic การคืนห้อง
      const newOcc = current.type === BookingType.CHARTER ? 0 : Math.max(0, current.room.currentOccupancy - 1);
      
      await tx.room.update({
        where: { id: current.room.id },
        data: { currentOccupancy: newOcc, status: RoomStatus.AVAILABLE }
      });

      if (current.room.parentId) {
        await tx.room.update({
          where: { id: current.room.parentId },
          data: { status: RoomStatus.AVAILABLE }
        });
      }

      if (isExpired) {
        await tx.payment.updateMany({
          where: { bookingId: current.id, status: BookingStatus.PENDING },
          data: { status: PaymentStatus.EXPIRED }
        });
      }

      // 5. บันทึก Log การยกเลิก
      await tx.booking_log.create({
        data: {
          bookingId: current.id,
          status: finalStatus
        }
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Cancel Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

//     const result = await prisma.$transaction(async (tx) => {
//       const currentBooking = await tx.booking.findUnique({
//         where: { id: Number(bookingId) },
//         select: {
//           id: true,
//           // status: true,
//           booking_logs: {
//             orderBy: { createdAt: 'desc' }, // ดึงตัวล่าสุดมาเช็ค
//             take: 1,
//             select: { status: true }
//           },
//           type: true,
//           cus_users: { select: { studentId: true } },
//           room: { select: { id: true, status: true, currentOccupancy: true, capacity: true, parentId: true } }
//         }
//       });

//       // 2. ตรวจสอบสิทธิ์และสถานะ
//       if (!currentBooking || currentBooking.cus_users.studentId !== studentId) {
//         throw new Error("คุณไม่มีสิทธิ์ยกเลิกรายการนี้");
//       }

//       // const allowedStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.VERIFYING];
//       // if (!allowedStatuses.includes(currentBooking.booking_logs[0].status)) {
//       //   throw new Error("รายการจองนี้ไม่สามารถยกเลิกได้แล้ว (อาจได้รับการอนุมัติหรือยกเลิกไปแล้ว)");
//       // }

//       // 2. เช็คสถานะจาก Log ตัวล่าสุด
//       const currentStatus = currentBooking?.booking_logs[0]?.status;
//       const allowedStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.VERIFYING];

//       if (!currentStatus || !allowedStatuses.includes(currentStatus)) {
//         throw new Error("รายการจองนี้ไม่สามารถยกเลิกได้แล้ว");
//       }
      
//       const { type, room } = currentBooking;
//       let newOcc = room.currentOccupancy;
//       let newStatus = room.status;

//       // 3. คำนวณการคืนสิทธิ์ (Logic นี้เป๊ะแล้วครับ)
//       if (type === BookingType.CHARTER) {
//         newOcc = 0;
//         newStatus = RoomStatus.AVAILABLE;
//       } else {
//         newOcc = Math.max(0, room.currentOccupancy - 1);
//         // ถ้าห้องเคยเต็ม (FULL) แล้วคนออก 1 คน ต้องเปิดเป็น AVAILABLE
//         if (newOcc < room.capacity) {
//           newStatus = RoomStatus.AVAILABLE;
//         }
//       }

//       // 4. อัปเดตข้อมูลแบบ Atomic
//       await tx.booking.update({
//         where: { id: currentBooking.id },
//         data: {
//           // status: isExpired 
//           // ? BookingStatus.EXPIRED 
//           // : BookingStatus.CANCELLED 
//           booking_logs: {
//             create: {
//               status: isExpired ? BookingStatus.EXPIRED : BookingStatus.CANCELLED,
//               // createdAt: new Date(),
//             }
//           },
//         }
//       });

//       await tx.room.update({
//         where: { id: room.id },
//         data: { currentOccupancy: newOcc, status: newStatus }
//       });

//       return { success: true };
//     }, { timeout: 10000 });

//     return NextResponse.json(result);
//   } catch (error: any) {
//     console.error("❌ Cancel Booking Error:", error.message);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }