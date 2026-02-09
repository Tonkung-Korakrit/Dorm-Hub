import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendStatusEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const { bookingId, adminId } = await request.json();

    // ⚡ ขั้นตอนที่ 1: Transaction แบบ Lean (เน้น Update อย่างเดียว)
    // ไม่ต้อง include ข้อมูลเยอะๆ ในนี้ เพื่อให้ COMMIT ได้ทันที
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.booking.update({
        where: { id: Number(bookingId) },
        data: {
          status: "COMPLETED",
          verifiedBy: adminId,
          verifiedAt: new Date(),
        },
        // ดึงเฉพาะ ID กลับมาเพื่อใช้ Query ข้อมูลเต็มข้างนอก
        select: { id: true } 
      });
    });

    // ⚡ ขั้นตอนที่ 2: Query ข้อมูลเพื่อส่งเมล (ทำนอก Transaction)
    // ใช้ select เพื่อเลือกเฉพาะ Field ที่ต้องใช้ใน sendStatusEmail จริงๆ
    const bookingData = await prisma.booking.findUnique({
      where: { id: updated.id },
      select: {
        id: true,
        type: true,
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

    // ⚡ ขั้นตอนที่ 3: ส่งอีเมลแบบ Async (Non-blocking)
    if (bookingData?.user?.email) {
      // ส่งไปเลย ไม่ต้องรอ await เพื่อให้ Response ตอบกลับ User ได้ทันที
      sendStatusEmail(bookingData as any, "CONFIRMED")
        .catch(err => console.error("Email Error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm API Error:", error);
    return NextResponse.json({ message: "ไม่สามารถอนุมัติรายการได้" }, { status: 500 });
  }
}