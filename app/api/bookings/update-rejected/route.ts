import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { BookingStatus } from "@/types/booking";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendResubmissionReceivedEmail } from "@/lib/mail";

export async function PUT(request: Request) {
  try {
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

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { bookingId, user, vehicle } = await request.json();

    // 2. ใช้ Transaction เพื่อความปลอดภัย
    const result = await prisma.$transaction(async (tx) => {

      // ตรวจสอบก่อนว่า Booking นี้เป็นของ User คนนี้จริง และสถานะคือ REJECTED
      const existing = await tx.booking.findFirst({
        where: {
          id: Number(bookingId),
          userId: userId, // 🔒 สำคัญมาก: ป้องกันการแอบแก้ของคนอื่น
        }
      });

      if (!existing) throw new Error("ไม่พบรายการจอง หรือคุณไม่มีสิทธิ์เข้าถึง");

      // 3. อัปเดตเฉพาะฟิลด์ที่อนุญาต (Explicit Update)
      await tx.cus_users.update({
        where: { id: userId },
        data: {
          citizenType: user.citizenType,
          citizenNumber: user.citizenNumber,
          studentId: user.studentId,
          isScholarshipStudent: user.isScholarshipStudent,
          isDisabled: user.isDisabled,
          // gender: user.gender,      
          // titleName: user.titleName,
          name_th: user.name_th,
          name_en: user.name_en,
          birthDate: user.birthDate,
          mobilePhone: user.mobilePhone,
          email: user.email,
          faculty_department: user.faculty_department,
          // lifestyle: user.lifestyle, // เก็บเป็น Json

          // 4. จัดการข้อมูล Vehicle (ใช้ upsert เพราะตอนแรกเขาอาจไม่ได้ระบุรถไว้)
          vehicleInfo: vehicle?.licensePlate ? {
            upsert: {
              create: {
                licensePlate: vehicle.licensePlate,
                province: vehicle.province,
                ownerName: vehicle.ownerName || user.name_th, // fallback เป็นชื่อนศ.
              },
              update: {
                licensePlate: vehicle.licensePlate,
                province: vehicle.province,
                ownerName: vehicle.ownerName || user.name_th,
              }
            }
          } : undefined
        }
      });

      const newLog = await tx.booking_log.create({
        data: {
          bookingId: Number(bookingId),
          status: BookingStatus.VERIFYING, // "VERIFYING"
          // หมายเหตุ: ตรงนี้ไม่ต้องใส่ verifiedBy เพราะยังไม่มี admin มาตรวจ
        }
      });

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

      // กรณีเป็นผู้พักร่วม (CO_RESIDENT) ให้หาชื่อเจ้าของห้องหลักไว้เลย
      // let ownerName = "";
      // if (type === BookingType.CO_RESIDENT) {
      //   const owner = await tx.booking.findFirst({
      //     where: {
      //       roomId: currentBooking.roomId,
      //       type: BookingType.CHARTER,
      //       // status: { in: [BookingStatus.COMPLETED] },
      //       booking_logs: {
      //         some: {
      //           status: {
      //             in: [BookingStatus.COMPLETED]
      //           }
      //         }
      //       }
      //     },
      //     include: { cus_users: { select: { name_th: true } } }
      //   });
      //   ownerName = owner?.cus_users.name_th || "เจ้าของห้องหลัก";
      // }

      return { id: bookingId, status: newLog.status, bookingData: updatedBooking };
    }, {
      timeout: 15000, // ขยายเวลาเป็น 15 วินาที
      isolationLevel: 'Serializable' // หรือตามที่นายตั้งไว้
    });

    try {
      if (result.bookingData.cus_users.email) {
        // let coResidentNote = result.ownerName
        //   ? `ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ ${result.ownerName}`
        //   : "";

        // ส่งอีเมล (ใส่ await เพื่อให้มั่นใจว่าส่งออกไปจริงก่อนปิด request)
        await sendResubmissionReceivedEmail(result.bookingData);
      }

      // ถ้ามี Line Notify ให้ใส่ตรงนี้
      // await sendLineNotify(...); 

    } catch (notifError) {
      // ถ้าส่งเมลพลาด ไม่ต้องระเบิด Error ใส่ User แต่ให้ Log ไว้ตรวจสอบ
      console.error("🔔 Notification Error:", notifError);
    }

    return NextResponse.json({ success: true, booking: result });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: error.message || "Update failed" }, { status: 500 });
  }
}