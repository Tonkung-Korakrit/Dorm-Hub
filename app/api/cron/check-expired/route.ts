import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { BookingStatus } from "@/utils/types";

export async function GET(req: Request) {
  // 1. เช็ค Secret Key (เหมือนเดิม)
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sevenDaysAgo = new Date();
  // const testTime = new Date();
  // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
  // testTime.setMinutes(testTime.getMinutes() - 5);

  try {
    // 2. ดึงข้อมูลที่เข้าข่าย "ต้องสงสัย" ว่าจะหมดอายุ
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { status: BookingStatus.COMPLETED },        // เคสไม่มารับกุญแจ
          { status: BookingStatus.PENDING_CORRECTION } // เคสไม่ยอมแก้ไขข้อมูล
        ],
        // สำหรับคนที่ COMPLETED ต้องยังไม่เคย CHECKIN
        checkins: { none: { type: "CHECKIN" } } 
      },
      include: {
        booking_logs: {
          orderBy: { createdAt: 'desc' },
          take: 1 // เอา Log ล่าสุดมาดูว่าเปลี่ยนสถานะมานานแค่ไหนแล้ว
        }
      }
    });

    // 3. กรองข้อมูลด้วย Logic ที่เข้มข้นขึ้น
    const expiredBookings = bookings.filter(booking => {
      const latestLog = booking.booking_logs[0];
      if (!latestLog) return false;

      const isOverdue = new Date(latestLog.createdAt) < sevenDaysAgo;

      // เงื่อนไข: สถานะปัจจุบันต้องตรงกับ Log ล่าสุด และต้องผ่านไปแล้ว 7 วัน
      return booking.status === latestLog.status && isOverdue;
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({ message: "No expired bookings found." });
    }

    // 4. ส่งไปยกเลิกที่ API Cancel (ยิงพร้อมกันเพื่อความเร็ว)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `https://${process.env.RAILWAY_STATIC_URL}`;
    
    const cancelRequests = expiredBookings.map((booking) => {
      // แยกเหตุผลตามสถานะ
      const reason = booking.status === BookingStatus.COMPLETED
        ? "Auto-cancelled: Key not picked up within 7 days"
        : "Auto-cancelled: Information not corrected within 7 days";

      return fetch(`${baseUrl}/api/bookings/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-key": process.env.CRON_SECRET || "",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          isExpired: true, // บอก API Cancel ว่านี่คือเคสหมดอายุนะ
          reason: reason
        }),
      });
    });

    const results = await Promise.allSettled(cancelRequests);

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: expiredBookings.map(b => ({ id: b.id, status: b.status }))
    });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}