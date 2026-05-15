import { prisma } from "@/lib/prisma";
import { BookingStatus, BookingType, Prisma, RoomStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sendStayStatusEmail } from "@/lib/mail";

type CheckinAction = "CHECKIN" | "CHECKOUT";
type ApiError = Error & { status?: number };

const CHECKIN: CheckinAction = "CHECKIN";
const CHECKOUT: CheckinAction = "CHECKOUT";

const bookingSelect = {
  id: true,
  type: true,
  status: true,
  cus_users: {
    select: {
      id: true,
      name_th: true,
      studentId: true,
      email: true,
      mobilePhone: true,
      faculty_department: true,
    },
  },
  room: {
    select: {
      id: true,
      roomId: true,
      floor: true,
      parentId: true,
      currentOccupancy: true,
      facultyConfig: true,
      dorm: {
        select: {
          name: true,
          campus: { select: { name: true } }
        },
      },
    },
  },
  checkins: {
    select: {
      id: true,
      type: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
} as const;

function createHttpError(message: string, status: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

async function getAdminIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) {
    throw createHttpError("Unauthorized", 401);
  }

  try {
    const secretAdmin = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secretAdmin);

    const adminId = Number(payload.id);
    if (!Number.isInteger(adminId) || payload.role !== "ADMIN") {
      throw createHttpError("Unauthorized", 401);
    }

    const staff = await prisma.staff_users.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, isEnabled: true },
    });

    if (!staff || staff.role !== "ADMIN" || !staff.isEnabled) {
      throw createHttpError("Unauthorized", 401);
    }

    return adminId;
  } catch (error: any) {
    if (error?.status) {
      throw error;
    }
    throw createHttpError("Unauthorized", 401);
  }
}

export async function GET() {
  try {
    await getAdminIdFromToken();

    const [checkinCandidates, checkoutCandidates] = await Promise.all([
      prisma.booking.findMany({
        where: {
          status: BookingStatus.COMPLETED,
          AND: [
            { checkins: { none: { type: CHECKIN } } },
            { checkins: { none: { type: CHECKOUT } } },
          ],
        },
        select: bookingSelect,
        orderBy: { id: "desc" },
      }),
      prisma.booking.findMany({
        where: {
          status: BookingStatus.COMPLETED,
          AND: [
            { checkins: { some: { type: CHECKIN } } },
            { checkins: { none: { type: CHECKOUT } } },
          ],
        },
        select: bookingSelect,
        orderBy: { id: "desc" },
      }),
    ]);

    return NextResponse.json({
      checkinCandidates,
      checkoutCandidates,
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || "ไม่สามารถดึงรายการย้ายเข้า/ออกได้";
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await getAdminIdFromToken();

    const body = await request.json();
    const bookingId = Number(body?.bookingId);
    const action = body?.action as CheckinAction;

    if (!Number.isInteger(bookingId)) {
      throw createHttpError("Booking ID ไม่ถูกต้อง", 400);
    }

    if (action !== CHECKIN && action !== CHECKOUT) {
      throw createHttpError("Action ไม่ถูกต้อง", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: bookingSelect,
      });

      if (!booking) {
        throw createHttpError("ไม่พบข้อมูลการจอง", 404);
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw createHttpError("รายการนี้ยังไม่อยู่ในสถานะที่ย้ายเข้า/ออกได้", 409);
      }

      const hasCheckin = booking.checkins.some((record) => record.type === CHECKIN);
      const hasCheckout = booking.checkins.some((record) => record.type === CHECKOUT);

      if (action === CHECKIN) {
        if (hasCheckin) {
          throw createHttpError("รายการนี้ลงชื่อย้ายเข้าแล้ว", 409);
        }
        if (hasCheckout) {
          throw createHttpError("รายการนี้ลงชื่อย้ายออกไปแล้ว", 409);
        }
      }

      if (action === CHECKOUT) {
        if (!hasCheckin) {
          throw createHttpError("ต้องลงชื่อย้ายเข้าก่อนจึงจะย้ายออกได้", 409);
        }
        if (hasCheckout) {
          throw createHttpError("รายการนี้ลงชื่อย้ายออกแล้ว", 409);
        }

        if (booking.type === BookingType.CHARTER) {
          const activeCoResidentCount = await tx.booking.count({
            where: {
              roomId: booking.room.id,
              type: BookingType.CO_RESIDENT,
              status: BookingStatus.COMPLETED,
              AND: [
                { checkins: { some: { type: CHECKIN } } },
                { checkins: { none: { type: CHECKOUT } } },
              ],
            },
          });

          if (activeCoResidentCount > 0) {
            throw createHttpError("ยังมีผู้พักร่วมที่ยังไม่ย้ายออก ไม่สามารถให้เจ้าของห้องย้ายออกได้", 409);
          }
        }
      }

      const actionLog = await tx.checkin.create({
        data: {
          bookingId,
          type: action,
          createdBy: adminId,
        },
      });

      if (action === CHECKOUT) {
        const nextOccupancy =
          booking.type === BookingType.CHARTER
            ? 0
            : Math.max(0, booking.room.currentOccupancy - 1);

        const roomUpdate: Prisma.RoomUpdateInput = {
          currentOccupancy: nextOccupancy,
          status: RoomStatus.AVAILABLE,
        };

        if (nextOccupancy === 0) {
          roomUpdate.lifestyleConfig = Prisma.DbNull;
          roomUpdate.lifestyleNote = null;
          roomUpdate.facultyConfig = [];
        } else {
          const userFaculty = booking.cus_users?.faculty_department;
          const currentFaculties = Array.isArray(booking.room.facultyConfig)
            ? [...(booking.room.facultyConfig as string[])]
            : [];

          if (userFaculty) {
            const facultyIndex = currentFaculties.indexOf(userFaculty);
            if (facultyIndex > -1) {
              currentFaculties.splice(facultyIndex, 1);
            }
          }

          roomUpdate.facultyConfig = currentFaculties;
        }

        await tx.room.update({
          where: { id: booking.room.id },
          data: roomUpdate,
        });

        if (booking.room.parentId) {
          await tx.room.update({
            where: { id: booking.room.parentId },
            data: { status: RoomStatus.AVAILABLE },
          });
        }
      }

      return { actionLog, booking };
    });

    // 2. 📧 ส่งอีเมลแจ้งเตือน (อยู่นอก Transaction เพื่อประสิทธิภาพ)
    try {
      // เรียกใช้ฟังก์ชันที่เราสร้างไว้ก่อนหน้านี้
      await sendStayStatusEmail(result.booking, action);
      console.log("✅ Email ${action} sent successfully to:", result.booking.cus_users.email)
    } catch (mailError) {
      console.error("❌ Mail Sending Failed:", mailError);
      // ไม่ต้อง throw error เพื่อให้ user เห็นว่าบันทึกสำเร็จ
    }

    return NextResponse.json({
      success: true,
      message: action === CHECKIN ? "ลงชื่อย้ายเข้าเรียบร้อย" : "ลงชื่อย้ายออกเรียบร้อย",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "รายการนี้ถูกดำเนินการไปแล้ว กรุณารีเฟรชข้อมูล" },
        { status: 409 }
      );
    }

    const status = error?.status || 500;
    const message = error?.message || "ไม่สามารถบันทึกข้อมูลย้ายเข้า/ออกได้";
    return NextResponse.json({ message }, { status });
  }
}
