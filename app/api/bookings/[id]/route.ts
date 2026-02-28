import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { BookingStatus } from "@/types/booking";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. กำหนดเป็น Promise
) {
  try {
    // 1. ตรวจสอบสิทธิ์ (Security First!)
    let userId: number | null = null;

    // --- แบบที่ 1: ถ้า Next-Auth ไม่เจอ ให้เช็คจาก Custom Token (API มอ) ---
    const cookieStore = await cookies();
    // ลองเช็คทุกชื่อที่เป็นไปได้ (ลองเปิด F12 ดูชื่อจริงอีกทีนะ)
    const token = cookieStore.get("token")?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = Number(payload.id);
        console.log("✅ Authenticated via: University API (JWT)");
      } catch (err) {
        console.error("❌ JWT Verify Error:", err);
      }
    }
    if (!userId) {
      // --- แบบที่ 2: เช็คจาก Next-Auth (Google Login) ---
      const session = await getServerSession(authOptions);

      if (session?.user?.id) {
        userId = Number(session.user.id);
        console.log("✅ Authenticated via: Next-Auth (Google)");
      }
    }

    // ถ้าตรวจทั้ง 2 อย่างแล้วยังไม่เจอ ใครก็ไม่รู้แล้วเนี่ย ดีดออกไป!
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: ไม่พบข้อมูลการเข้าสู่ระบบ" }, { status: 401 });
    }

    // 2. ดึงข้อมูลการจอง (ต้องเป็นของ User คนนี้เท่านั้น)
    const { id } = await params;
    const bookingId = Number(id);
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId, // 🔒 ป้องกันคนอื่นมาแอบดู
      },
      include: {
        cus_users: {
          include: {
            vehicleInfo: true, // ดึงข้อมูลรถมาด้วย
          }
        },
        room: {
          include: {
            dorm: {
              include: { campus: true }
            }
          }
        },
        // ดึง Log ตัวล่าสุดเพื่อดูสถานะ และเหตุผลที่โดน Reject
        booking_logs: {
          select: {
            bookingId: true,
            status: true,
            file: true,
            verifier: {
              select: {
                staff_action_log: {
                  select: {
                    remark: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ message: "ไม่พบข้อมูลการจอง" }, { status: 404 });
    }

    // 3. จัด Format ข้อมูลเล็กน้อยเพื่อให้ Frontend ใช้ง่าย
    const latestLog = booking.booking_logs[0];

    // 💡 Note: เนื่องจาก Schema นายเก็บ remark ไว้ใน Staff_action_log 
    // ถ้านายยังไม่ได้เชื่อม BookingId เข้าไป พี่แนะนำให้ไปหาทางดึงมา 
    // แต่เบื้องต้นส่งข้อมูลก้อนนี้กลับไปก่อนครับ
    const responseData = {
      ...booking,
      status: latestLog?.status || BookingStatus.REJECTED,
      remark: latestLog?.verifier?.staff_action_log?.[0].remark, // ถ้าในอนาคตนายเก็บ remark ใน Booking_log จะดีมาก
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Fetch Booking Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}