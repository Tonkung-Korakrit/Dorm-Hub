// api/bookings/payment
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@/types/booking';
import { getCurrentUser } from '@/lib/auth-utils';
// import { PaymentStatus } from '@prisma/client';

// แนะนำให้เช็คความถูกต้องของ Key ก่อนเรียกใช้งาน
const omise = require('omise')({
  'publicKey': process.env.OMISE_PUBLIC_KEY,
  'secretKey': process.env.OMISE_SECRET_KEY,
});

export async function POST(req: Request) {
  try {
    const { bookingId, amount } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const { excludeConditions, isAuthenticated } = await getCurrentUser();

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    // 1. ตรวจสอบว่ามี Booking นี้อยู่จริง และยังไม่ได้จ่ายเงิน
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        cus_users: {
          OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
        }
      },
      include: {
        payments: { where: { status: PaymentStatus.PENDING } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    // 2. เรียก Omise API เพื่อสร้าง Source (PromptPay QR)
    // หมายเหตุ: จำนวนเงิน Omise ต้องเป็น Integer หน่วยสตางค์
    const amountInSatang = Math.round(amount * 100);

    const source = await omise.sources.create({
      amount: amountInSatang,
      currency: 'THB',
      type: 'promptpay',
    });

    // 3. สร้าง "Charge" เพื่อผูก Source
    const charge = await omise.charges.create({
      amount: amountInSatang,
      currency: 'THB',
      source: source.id,
      // return_uri คือหน้าที่ User จะกลับไปหลังจากจ่าย (สำหรับเคส Card) 
      // สำหรับ PromptPay ส่วนใหญ่จะใช้ Webhook เป็นหลัก
      // return_uri: `${process.env.NEXT_PUBLIC_APP_URL}/payment/${bookingId}`,
      return_uri: `${process.env.URL_NGROK}/payment/${bookingId}`,
    });

    // 4. บันทึกข้อมูลการชำระเงินลง Database
    // ใช้ upsert เพื่อที่ว่าถ้าเขากดเจน QR ซ้ำ จะได้ไม่เกิด record ขยะเยอะเกินไป
    const payment = await prisma.payment.upsert({
      where: {
        // ถ้าคุณมี external_id อยู่แล้วให้ใช้ค้นหา แต่ถ้ายังไม่มีให้สร้างใหม่ผ่าน bookingId
        id: booking.payments[0]?.id || 'new-payment-uuid'
      },
      update: {
        external_id: charge.id,
        qr_payload: charge.source.scannable_code.image.download_uri,
        amount: amount,
      },
      create: {
        bookingId: bookingId,
        amount: amount,
        status: PaymentStatus.PENDING,
        external_id: charge.id,
        qr_payload: charge.source.scannable_code.image.download_uri,
      }
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl: charge.source.scannable_code.image.download_uri,
      chargeId: charge.id
    });

  } catch (error: any) {
    console.error("Omise Error:", error);
    return NextResponse.json({
      error: error.message || 'Payment initialization failed'
    }, { status: 500 });
  }
}