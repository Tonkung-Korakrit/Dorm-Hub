// api/webhook/omise
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, BookingType, PaymentStatus, RoomStatus } from "@prisma/client";
import { sendPaymentVerifyingEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // 1. ตรวจสอบว่าเป็น Event การชำระเงินสำเร็จจริงหรือไม่ (อิงตาม Omise Style)
    if (event.key !== 'charge.complete' || event.data.status !== 'successful') {
      return NextResponse.json({ message: "Ignore irrelevant events" }, { status: 200 });
    }

    const chargeId = event.data.id;

    // 2. เริ่ม Transaction เพื่อความปลอดภัยระดับสูงสุด
    const result = await prisma.$transaction(async (tx) => {
      
      // ค้นหา Payment จาก external_id (chargeId)
      const payment = await tx.payment.findUnique({
        where: { external_id: chargeId },
        include: {
          booking: {
            include: {
              cus_users: { select: { name_th: true, email: true } },
              room: {
                include: {
                  dorm: { include: { campus: true } }
                }
              },
              booking_logs: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          }
        }
      });

      if (!payment) throw new Error("Payment record not found");

      // ป้องกันการรันซ้ำ (Idempotency Check)
      // ถ้าสถานะเป็น SUCCESS หรือ VERIFYING อยู่แล้ว ให้หยุดทำงานทันที
      const currentStatus = payment.booking.booking_logs[0]?.status;
      if (payment.status === PaymentStatus.SUCCESS || currentStatus === BookingStatus.VERIFYING) {
        return { alreadyProcessed: true };
      }

      const { booking } = payment;
      const { room, type } = booking;

      // 3. Logic คำนวณสถานะห้องพัก (ยกมาจาก submit-payment)
      let finalRoomStatus = room.status;
      const MAX_CO_RESIDENT_ADDITIONAL = 10;
      const CO_RESIDENT_LIMIT = room.capacity + MAX_CO_RESIDENT_ADDITIONAL;

      if (type === BookingType.CHARTER) {
        finalRoomStatus = RoomStatus.FULL;
      } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
        finalRoomStatus = RoomStatus.FULL;
      } else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
        finalRoomStatus = RoomStatus.FULL;
        throw new Error("Quota exceeded for co-resident");
      } else if (room.currentOccupancy >= room.capacity) {
        finalRoomStatus = RoomStatus.FULL;
      }

      // 4. อัปเดตข้อมูลทั้งหมดแบบ Atomic
      // ก. อัปเดตสถานะ Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date() }
      });

      // ข. บันทึก Log การจอง
      await tx.booking_log.create({
        data: {
          bookingId: booking.id,
          status: BookingStatus.VERIFYING,
          paymentProof: `Omise_Charge_${chargeId}`
        }
      });

      // ค. อัปเดตสถานะห้องพัก (ลูก/เดี่ยว)
      await tx.room.update({
        where: { id: room.id },
        data: { status: finalRoomStatus }
      });

      // ง. Sync สถานะห้องแม่ (กรณีเป็น Suite)
      if (room.parentId) {
        const allSubRooms = await tx.room.findMany({
          where: { parentId: room.parentId }
        });
        const isEverySubRoomBusy = allSubRooms.every(r => r.status !== RoomStatus.AVAILABLE);
        await tx.room.update({
          where: { id: room.parentId },
          data: { status: isEverySubRoomBusy ? RoomStatus.FULL : RoomStatus.AVAILABLE }
        });
      }

      // 5. ค้นหาชื่อเจ้าของห้องหลัก (กรณีผู้พักร่วม)
      let ownerName = "";
      if (type === BookingType.CO_RESIDENT) {
        const owner = await tx.booking.findFirst({
          where: {
            roomId: booking.roomId,
            type: BookingType.CHARTER,
            booking_logs: { some: { status: BookingStatus.COMPLETED } }
          },
          include: { cus_users: { select: { name_th: true } } }
        });
        ownerName = owner?.cus_users.name_th || "เจ้าของห้องหลัก";
      }

      return { bookingData: booking, ownerName, alreadyProcessed: false };
    }, {
      timeout: 15000,
      isolationLevel: 'Serializable'
    });

    // 6. ส่งอีเมลยืนยัน (ทำนอก Transaction)
    if (result && !result.alreadyProcessed) {
      try {
        let coResidentNote = result.ownerName 
          ? `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${result.ownerName}` 
          : "";
        
        await sendPaymentVerifyingEmail(result.bookingData, coResidentNote);
      } catch (emailError) {
        console.error("📧 Webhook Email Error:", emailError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("📌 Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}