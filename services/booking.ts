// /app/action/my-booking.ts
// "use server"

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/services/identify";
import { BookingStatus, MyBookingResponse } from "@/utils/types";

export const getMyBooking = async (): Promise<MyBookingResponse> => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" }
    }

    const booking = await prisma.booking.findFirst({
      where: {
        // OR: [
        //   ...(email ? [{ cus_users: { email } }] : []),
        //   ...(studentId ? [{ cus_users: { studentId: studentId } }] : [])
        // ]
        cus_users: {
          OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        }
      },
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        type: true,
        booking_logs: {
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
            verifier: {
              select: {
                id: true,
                staff_action_log: {
                  select: {
                    remark: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: "desc" // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
                  },
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc" // ดึงสถานะล่าสุดของ Booking ใบนั้นๆ
          },
          take: 1
        },
        room: {
          select: {
            roomId: true,
            floor: true,
            // lifestyleConfig: true,
            facultyConfig: true,
            lifestyleNote: true,
            roomType: true,
            dorm: {
              select: {
                name: true,
                campus: { select: { name: true } }
              }
            }
          }
        },
        cus_users: {
          select: {
            id: true,
            studentId: true,
            name_th: true,
            name_en: true,
            email: true,
            mobilePhone: true,
            gender: true,
            isScholarshipStudent: true,
            isDisabled: true,
            faculty_department: true,
            lifestyle: true,
            lifestyleNote: true,
          }
        },
      },
    });

    // if (!booking) return NextResponse.json({ booking: null });
    if (!booking) return { success: false, message: "Reservation Not Found" };

    // สั่งให้ Next.js ไปดึงข้อมูลที่หน้า /my-booking ใหม่ (ไม่ต้อง reload เอง)
    // revalidatePath("/my-booking");

    // return NextResponse.json({/
    return ({
      success: true,
      message: "Get My-Booking success",

      id: booking.id,
      status: booking.booking_logs[0]?.status || BookingStatus.PENDING,
      type: booking.type,
      createdAt: booking.booking_logs[0]?.createdAt,
      remark: booking.booking_logs[0]?.verifier?.staff_action_log?.[0]?.remark || null,      // expiresAt: booking.expiresAt,
      room: {
        roomId: booking.room.roomId,
        floor: booking.room.floor,
        dorm: booking.room.dorm.name,
        campus: booking.room.dorm.campus.name,
        roomType: booking.room.roomType,
        // lifestyleConfig: booking.room.lifestyleConfig || []
        facultyConfig: booking.room.facultyConfig || [],
        lifestyleNote: booking.room.lifestyleNote,
      },
      cus_users: {
        userId: booking.cus_users.id,
        studentId: booking.cus_users.studentId,
        name_th: booking.cus_users.name_th,
        name_en: booking.cus_users.name_en,
        email: booking.cus_users.email,
        mobilePhone: booking.cus_users.mobilePhone,
        gender: booking.cus_users.gender,
        isScholarshipStudent: booking.cus_users.isScholarshipStudent,
        isDisabled: booking.cus_users.isDisabled,
        faculty_department: booking.cus_users.faculty_department,
        lifestyle: booking.cus_users.lifestyle,
        lifestyleNote: booking.cus_users.lifestyleNote,
      }
    });

  } catch (error) {
    // return NextResponse.json({ error: "Server Error" }, { status: 500 });
    return { success: false, message: "Server Error" };
  }
}

export const getPaymentData = async (bookingId: number) => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" }
    }
    // 1. ดึงข้อมูลการจอง
    const booking = await prisma.booking.findUnique({
      // where: { id: bookingId },
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        }
      },
      include: {
        room: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
        booking_logs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      }
    })

    if (!booking) return null;

    // 2. Logic การสร้าง Payment หรือ QR Payload หากยังไม่มี
    // เพื่อป้องกัน Error 404 เมื่อ payments[0] เป็น undefined
    let currentPayment = booking.payments[0];

    if (!currentPayment || !currentPayment.qr_payload) {
      // ในชีวิตจริง: คุณต้องยิง API ไปหา Omise/GBPrime ตรงนี้เพื่อเอา QR
      // const charge = await omise.charges.create({ ... });
      // const qrUrl = charge.source.scannable_code.image.download_uri;

      // จำลอง QR Payload สำหรับทดสอบ (ถ้าใช้จริงให้เปลี่ยนเป็น URL จาก Gateway)
      const mockQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PromptPay_Mockup_Data";
      // const mockQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Tudorm_Payment&format=png";

      if (!currentPayment) {
        // สร้าง Payment Record ใหม่ถ้ายังไม่มีเลย
        currentPayment = await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: booking.room.price || 5000, // ใช้ราคาห้องหรือค่ามัดจำที่ตั้งไว้
            // amount: 20, // test
            status: 'PENDING',
            qr_payload: mockQrUrl,
            external_id: `temp_${Date.now()}` // ID อ้างอิงชั่วคราว
          }
        });
      } else {
        // มี Record แล้วแต่ขาด QR (เช่น เจนไม่สำเร็จในรอบแรก) ให้ Update เพิ่มเข้าไป
        currentPayment = await prisma.payment.update({
          where: { id: currentPayment.id },
          data: { qr_payload: mockQrUrl }
        });
      }
    }

    return { success: true, booking, currentPayment }
  } catch {
    return { success: false, message: "Server Error" };
  }
}

export const getBookingForSucess = async (bookingId: number) => {
  try {
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) {
      // return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
      return { success: false, message: "Unauthorized - ไม่ได้รับอนุญาต" }
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions
        }
      },
      include: {
        room: {
          include: {
            dorm: {
              include: {
                campus: true,
              }
            }
          }
        },
        cus_users: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
      }
    })

    if (!booking) {
      return { success: false, message: "This booking information was not found." };
    }

    return { success: true, booking }
  } catch (error) {
    // return NextResponse.json({ error: "Server Error" }, { status: 500 });
    return { success: false, message: "Server Error", status: 500 };
  }
}