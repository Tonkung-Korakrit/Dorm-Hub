// actions/booking-action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookingStatus, BookingType, PaymentStatus, RoomStatus } from "@/utils/types";
import { getAuthSession } from "@/services/identify";

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
    await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลการจองมาเช็คความเป็นเจ้าของ
      const current = await tx.booking.findUnique({
        where: {
          id: bookingId,
          cus_users: { OR: excludeConditions }
        },
        include: {
          cus_users: {
            select: {
              faculty_department: true,
            }
          },
          room: true
        }
      });

      if (!current) throw new Error("No booking information was found, or you are not the owner of this listing - ไม่พบข้อมูลการจอง หรือคุณไม่ใช่เจ้าของรายการนี้");

      const finalStatus = isExpired ? BookingStatus.EXPIRED : BookingStatus.CANCELLED;

      // 4. Logic การคืนห้อง (Ported from original)
      // ถ้าเป็นแบบเหมาห้อง (CHARTER) คนในห้องจะเป็น 0 ทันที ถ้าไม่ ก็ลดลง 1
      const newOcc = current.type === BookingType.CHARTER
        ? 0
        : Math.max(0, current.room.currentOccupancy - 1);

      let roomUpdate: any = {
        currentOccupancy: newOcc,
        status: RoomStatus.AVAILABLE,
      }

      if (newOcc === 0) {
        roomUpdate.lifestyleConfig = null;
        roomUpdate.lifestyleNote = null;
        roomUpdate.facultyConfig = []
      } else {
        const userFaculty = current.cus_users?.faculty_department;
        const currentFaculties = Array.isArray(current.room.facultyConfig)
          ? (current.room.facultyConfig as string[])
          : []

        if (userFaculty) {
          const facultyIndex = currentFaculties.indexOf(userFaculty);
          if (facultyIndex > -1) {
            currentFaculties.splice(facultyIndex, 1)
          }
          roomUpdate.facultyConfig = currentFaculties
        }
      }

      // Update สถานะห้องพัก
      await tx.room.update({
        where: { id: current.room.id },
        data: roomUpdate
      });

      // ถ้าเป็นห้องที่มี Parent (เช่น ห้องใน Flat) ให้ปรับสถานะตัวแม่ด้วย
      if (current.room.parentId) {
        await tx.room.update({
          where: { id: current.room.parentId },
          data: { status: RoomStatus.AVAILABLE }
        });
      }

      // 5. ถ้าเป็นการ Expire ให้เคลียร์รายการจ่ายเงินที่ค้างอยู่ด้วย
      if (isExpired) {
        await tx.payment.updateMany({
          where: {
            bookingId: current.id,
            status: PaymentStatus.PENDING
          },
          data: { status: PaymentStatus.EXPIRED }
        });
      }

      // 6. บันทึก Log การเปลี่ยนแปลงสถานะ
      await tx.booking_log.create({
        data: {
          bookingId: current.id,
          status: finalStatus
        }
      });
    });

    // 7. แจ้ง Next.js ให้ดึงข้อมูลใหม่
    revalidatePath("/my-booking");

    return { success: true, message: isExpired ? "Booking time has expired - หมดเวลาการจองแล้ว" : "Booking canceled successfully - ยกเลิกการจองสำเร็จ" };

  } catch (error: any) {
    console.error("❌ Cancel Action Error:", error.message);
    return { success: false, message: error.message || "Server Error" };
  }
}