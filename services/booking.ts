// /app/action/my-booking.ts
// "use server"

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/services/identify";
import { Booking, BookingStatus } from "@/utils/types";

export const getMyBooking = async (): Promise<Booking> => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" };
    }

    const currentUser = await prisma.cus_users.findFirst({
      where: {
        OR: excludeConditions,
      },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        email: true,
      },
    });

    const hasLineLogin = currentUser
      ? (await prisma.line_login.count({ where: { userId: currentUser.id } })) >
        0
      : false;

    const booking = await prisma.booking.findFirst({
      where: {
        cus_users: {
          OR: excludeConditions, // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        },
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        status: true,
        type: true,
        // groupId: true,
        booking_logs: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            // updatedAt: true,
            verifier: {
              select: {
                id: true,
                staff_action_log: {
                  select: {
                    remark: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: "desc", // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc", // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
          },
          take: 1,
        },
        checkins: {
          select: {
            type: true,
          },
        },
        room: {
          select: {
            id: true,
            roomId: true,
            floor: true,
            dorm: {
              select: {
                name: true,
                campus: { select: { name: true } },
              },
            },
            // status: true,
            // isLocked: true,
            roomType: true,
            // price: true,
            // capacity: true,
            // currentOccupancy: true,
            // lifestyleConfig: true,
            lifestyleNote: true,
            facultyConfig: true,
            // isSuite: true,
            // parentId: true,
            // parent: true,
            // subRooms: true,
            // booking: true,
            // posX: true,
            // posY: true,
            // createdAt: true,
            // updatedAt: true,
          },
        },
        cus_users: {
          select: {
            id: true,
            citizenType: true,
            citizenNumber: true,
            studentId: true,
            gender: true,
            titleName: true,
            name: true,
            name_th: true,
            name_en: true,
            email: true,
            mobilePhone: true,
            birthDate: true,
            isScholarshipStudent: true,
            isDisabled: true,
            faculty_department: true,
            lifestyle: true,
            lifestyleNote: true,
            // isEnabled: true,
            address: true,
            // guardians: true,
            // profileImage: true,
            // vehicleInfo: true,
            // role: true,
            // bookings: true,
            // emailVerified: true,
            // googleAccounts: true,
            // line_logins: true,
            // sessions: true,
            // logs: true,
            // createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // if (!booking) return NextResponse.json({ booking: null });
    if (!booking) {
      return {
        // id: booking.id,
        success: false,
        message: "Reservation Not Found",
        // status: "EXPIRED",
        // type: "NOT_CHARTER",
        // groupId: null,
        // createdAt: null,
        // remark: null,
        cus_users: currentUser
          ? {
              id: currentUser.id,
              name_th: currentUser.name_th,
              name_en: currentUser.name_en,
              email: currentUser.email,
              hasLineLogin,
            }
          : undefined,
      };
    }

    // สั่งให้ Next.js ไปดึงข้อมูลที่หน้า /my-booking ใหม่ (ไม่ต้อง reload เอง)
    // revalidatePath("/my-booking");

    const bookingHasLineLogin =
      (await prisma.line_login.count({
        where: { userId: booking.cus_users.id },
      })) > 0;

    const hasCheckin = booking.checkins.some(
      (record) => record.type === "CHECKIN",
    );

    const hasCheckout = booking.checkins.some(
      (record) => record.type === "CHECKOUT",
    );

    const rebookableStatuses: BookingStatus[] = [
      BookingStatus.CANCELLED,
      BookingStatus.EXPIRED,
      BookingStatus.REJECTED,
    ];

    const latestStatus =
      booking.booking_logs[0]?.status || BookingStatus.PENDING;

    const canBookAgain =
      rebookableStatuses.includes(latestStatus) ||
      (latestStatus === BookingStatus.COMPLETED && hasCheckout);

    let cleanFacultyConfig: string[] = [];

    if (Array.isArray(booking.room?.facultyConfig)) {
      cleanFacultyConfig = (booking.room.facultyConfig as any[])
        .map((item) => {
          // ถ้าเป็น string อยู่แล้ว (เช่น 'คณะวิทยาศาสตร์...') ให้ใช้ได้เลย
          if (typeof item === "string") return item;

          // ถ้าเป็น object (ที่ Prisma โชว์เป็น [Object]) ให้ลองหา key 'name' หรือ 'label'
          // ปรับตามโครงสร้างจริงใน DB ของคุณ เช่น item.name_th หรือ item.faculty_name
          if (typeof item === "object" && item !== null) {
            return item.name || JSON.stringify(item);
          }

          return null;
        })
        .filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        );
    }

    // return NextResponse.json({/
    return {
      id: booking.id,
      success: true,
      message: "Get current booking Success",

      status: latestStatus,
      type: booking.type,
      // groupId?: string;
      createdAt: booking.booking_logs[0]?.createdAt,
      // updatedAt: booking.updatedAt,
      remark:
        booking.booking_logs[0]?.verifier?.staff_action_log?.[0]?.remark ||
        null,

      cus_users: {
        id: booking.cus_users.id,
        citizenType: booking.cus_users.citizenType,
        citizenNumber: booking.cus_users.citizenNumber,
        studentId: booking.cus_users.studentId,
        gender: booking.cus_users.gender,
        titleName: booking.cus_users.titleName,
        // name: string,
        name_th: booking.cus_users.name_th,
        name_en: booking.cus_users.name_en,
        email: booking.cus_users.email,
        mobilePhone: booking.cus_users.mobilePhone,
        birthDate: booking.cus_users.birthDate,
        isScholarshipStudent: booking.cus_users.isScholarshipStudent,
        isDisabled: booking.cus_users.isDisabled,
        faculty_department: booking.cus_users.faculty_department,
        lifestyle: booking.cus_users.lifestyle,
        lifestyleNote: booking.cus_users.lifestyleNote,
        hasLineLogin: bookingHasLineLogin,
        address: booking.cus_users.address,
        // guardians?: Guardian[];
        // profileImage?: File_info[];
        // facePhotoFile?: File | null;
        // citizenCardFile?: File | null;
        // vehicleInfo?: Vehicle | null;
        // role: Role,
      },
      room: {
        id: booking.room.id,
        campus: booking.room.dorm.campus.name,
        dorm: { name: booking.room.dorm.name },
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        // status: booking.room;
        // isLocked: boolean;
        roomType: booking.room.roomType,
        // price: number;
        // capacity: number;
        // currentOccupancy: number;
        // lifestyleConfig: booking.room.lifestyleConfig || [],
        // lifestyleNote: booking.room.lifestyleNote,
        facultyConfig: cleanFacultyConfig,
        // isSuite: boolean;
        // parentId?: number | null; // ID ของห้องใหญ่ (กรณีที่เป็นห้องย่อย A หรือ B)
        // parent?: Room | null; // ข้อมูลห้องใหญ่
        // subRooms?: Room[];
        // posX: number;
        // posY: number;
        // booking: Booking[];
      },
      hasCheckin,
      hasCheckout,
      canBookAgain,
    };
  } catch (error) {
    // return NextResponse.json({ error: "Server Error" }, { status: 500 });
    return { success: false, message: "Server Error" };
  }
};

export const getPaymentData = async (bookingId: number) => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" };
    }
    // 1. ดึงข้อมูลการจอง
    const booking = await prisma.booking.findUnique({
      // where: { id: bookingId },
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions, // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        },
      },
      include: {
        room: true,
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        booking_logs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!booking) return null;

    // 2. Logic การสร้าง Payment หรือ QR Payload หากยังไม่มี
    // เพื่อป้องกัน Error 404 เมื่อ payments[0] เป็น undefined
    let currentPayment = booking.payments[0];

    if (!currentPayment || !currentPayment.qr_payload) {
      // ในชีวิตจริง: คุณต้องยิง API ไปหา Omise/GBPrime ตรงนี้เพื่อเอา QR
      // const charge = await omise.charges.create({ ... });
      // const qrUrl = charge.source.scannable_code.image.download_uri;

      // จำลอง QR Payload สำหรับทดสอบ (ถ้าใช้จริงให้เปลี่ยนเป็น URL จาก Gateway)
      const mockQrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PromptPay_Mockup_Data";
      // const mockQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Tudorm_Payment&format=png";

      if (!currentPayment) {
        // สร้าง Payment Record ใหม่ถ้ายังไม่มีเลย
        currentPayment = await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: booking.room.price || 5000, // ใช้ราคาห้องหรือค่ามัดจำที่ตั้งไว้
            // amount: 20, // test
            status: "PENDING",
            qr_payload: mockQrUrl,
            external_id: `temp_${Date.now()}`, // ID อ้างอิงชั่วคราว
          },
        });
      } else {
        // มี Record แล้วแต่ขาด QR (เช่น เจนไม่สำเร็จในรอบแรก) ให้ Update เพิ่มเข้าไป
        currentPayment = await prisma.payment.update({
          where: { id: currentPayment.id },
          data: { qr_payload: mockQrUrl },
        });
      }
    }

    return { success: true, booking, currentPayment };
  } catch {
    return { success: false, message: "Server Error" };
  }
};

export const getBookingForSucess = async (bookingId: number) => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" };
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions,
        },
      },
      include: {
        room: {
          include: {
            dorm: {
              include: {
                campus: true,
              },
            },
          },
        },
        cus_users: true,
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        message: "This booking information was not found.",
      };
    }

    return { success: true, booking };
  } catch (error) {
    // return NextResponse.json({ error: "Server Error" }, { status: 500 });
    return { success: false, message: "Server Error", status: 500 };
  }
};
