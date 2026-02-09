import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const { bookingId, adminId, remark } = await request.json();

    if (!remark) {
      return NextResponse.json({ message: "กรุณาระบุเหตุผลที่ปฏิเสธ" }, { status: 400 });
    }

    // ⚡ 1. Lean Transaction: อัปเดตสถานะให้เร็วที่สุด
    // ลดภาระโดยไม่ใช้ 'include' ภายใน Transaction เพื่อให้ COMMIT ได้ทันที
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          status: "REJECTED",
          adminRemark: remark,
          verifiedBy: adminId,
          verifiedAt: new Date(),
        },
        // ดึงเฉพาะ ID กลับมาเพื่อยืนยันว่าการอัปเดตสำเร็จ
        select: { id: true }
      });
    }, {
      timeout: 10000 // กำหนด Timeout 10 วินาที ป้องกันคอขวด
    });

    // ⚡ 2. Post-Transaction Query: ดึงข้อมูลสำหรับส่งเมลข้างนอก
    // ใช้ select เฉพาะฟิลด์ที่จำเป็น เพื่อลดปริมาณข้อมูลข้าม Network
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      select: {
        id: true,
        type: true,
        adminRemark: true,
        user: {
          select: { email: true, name_th: true }
        },
        room: {
          select: {
            roomId: true,
            floor: true,
            roomType: true,
            zone: {
              select: {
                name: true,
                dorm: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    // ⚡ 3. Background Notification: ส่งเมลแบบไม่รอผล (Non-blocking)
    // วิธีนี้ทำให้ API ตอบกลับผลลัพธ์ไปยัง Admin ได้ทันทีโดยไม่ต้องรอ SMTP Server ตอบรับ
    if (bookingData?.user?.email) {
      sendStatusEmail(bookingData as any, "REJECTED", remark)
        .catch(err => console.error("Email Error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reject API Error:", error.message);
    return NextResponse.json(
      { message: "ไม่สามารถปฏิเสธรายการได้ หรือรายการถูกจัดการไปแล้ว" },
      { status: 500 }
    );
  }
}