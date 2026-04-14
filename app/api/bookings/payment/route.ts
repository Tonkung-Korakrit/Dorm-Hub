// api/bookings/payment
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@/utils/types';
import { getAuthSession } from '@/services/identify';

export async function POST(req: Request) {
  console.log("DEBUG: OMISE_KEY_EXIST?", !!process.env.OMISE_SECRET_KEY);
  console.log("DEBUG: NEXT_PUBLIC_APP_URL_EXIST?", !!process.env.NEXT_PUBLIC_APP_URL);
  console.log("DEBUG: KEY_START_WITH:", process.env.OMISE_SECRET_KEY?.substring(0, 10));

  try {
    const { bookingId, amount } = await req.json();
    const { excludeConditions, isAuthenticated } = await getAuthSession();

    if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findFirst({
      where: {
        id: Number(bookingId),
        cus_users: { OR: excludeConditions }
      },
      include: { payments: { where: { status: PaymentStatus.PENDING }, take: 1 } }
    });

    if (!booking) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

    // 1. ตรวจสอบก่อนว่ามีกุญแจไหม
    const secretKey = process.env.OMISE_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ OMISE_SECRET_KEY is missing in Env Variables!");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    // ใช้ Fetch แทน SDK เพื่อป้องกัน Error "listener must be function"
    const authKey = Buffer.from(secretKey.trim() + ":").toString('base64');
    const amountInSatang = Math.round(amount * 100);

    console.log("authKey: ", authKey)
    console.log("🚀 [Omise Request] Preparing to create Source...");

    // 1. สร้าง Source (PromptPay)
    const sourceRes = await fetch('https://api.omise.co/sources', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ amount: amountInSatang.toString(), currency: 'thb', type: 'promptpay' })
    });
    const source = await sourceRes.json();

    console.log("📥 [Omise Source Response]:", {
      status: sourceRes.status,
      id: source.id,
      object: source.object,
      message: source.message // ถ้าพังตรงนี้ จะเห็น Error Message จริงๆ
    });

    console.log("🚀 [Omise Request] Creating Charge with Source ID:", source.id);
    // 2. สร้าง Charge
    const chargeRes = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        amount: amountInSatang.toString(),
        currency: 'thb',
        source: source.id,
        return_uri: `${process.env.NEXT_PUBLIC_APP_URL}/my-booking`
      })
    });
    const charge = await chargeRes.json();

    console.log("📥 [Omise Charge Response]:", {
      status: chargeRes.status,
      id: charge.id,
      object: charge.object,
      message: charge.message
    });

    if (charge.object === 'error') throw new Error(charge.message);

    const qrUrl = charge.source.scannable_code.image.download_uri;

    // 3. บันทึกลง Database
    // await prisma.payment.upsert({
    //   where: { id: booking.payments[0]?.id || 'new-record' },
    //   update: { external_id: charge.id, qr_payload: qrUrl, amount },
    //   create: {
    //     bookingId: Number(bookingId),
    //     amount,
    //     status: PaymentStatus.PENDING,
    //     external_id: charge.id,
    //     qr_payload: qrUrl,
    //   }
    // });

    const existingPayment = booking.payments[0];

    if (existingPayment) {
      // มีรายการเก่าที่ PENDINGอยู่ -> อัปเดต QR ใหม่
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          external_id: charge.id,
          qr_payload: qrUrl,
          amount: amount,
        }
      });
    } else {
      // ยังไม่เคยเจน QR หรือรายการเก่าหมดอายุไปแล้ว -> สร้างใหม่
      await prisma.payment.create({
        data: {
          bookingId: Number(bookingId),
          amount: amount,
          status: PaymentStatus.PENDING,
          external_id: charge.id,
          qr_payload: qrUrl,
        }
      });
    }

    return NextResponse.json({ success: true, qrCodeUrl: qrUrl });

  } catch (error: any) {
    console.error("❌ Payment Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { PaymentStatus } from '@/types/booking';
// import { getAuthSession } from '@/lib/auth-utils';

// export async function POST(req: Request) {
//   try {
//     const { bookingId, amount } = await req.json();

//     if (!bookingId) {
//       return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
//     }

//     const { excludeConditions, isAuthenticated } = await getAuthSession();

//     if (!isAuthenticated) {
//       return NextResponse.json({ error: "Unauthorized - ไม่ได้รับอนุญาต" }, { status: 401 });
//     }

//     // แนะนำให้เช็คความถูกต้องของ Key ก่อนเรียกใช้งาน
//     const omise = require('omise')({
//       'publicKey': process.env.OMISE_PUBLIC_KEY,
//       'secretKey': process.env.OMISE_SECRET_KEY,
//     });

//     // 1. ตรวจสอบว่ามี Booking นี้อยู่จริง และยังไม่ได้จ่ายเงิน
//     const booking = await prisma.booking.findUnique({
//       where: {
//         id: bookingId,
//         cus_users: {
//           OR: excludeConditions // ข้อมูลต้องตรงกับ Email หรือ Student ID ของตัวเอง
//         }
//       },
//       include: {
//         payments: { where: { status: PaymentStatus.PENDING } }
//       }
//     });

//     if (!booking) {
//       return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
//     }

//     // 2. เรียก Omise API เพื่อสร้าง Source (PromptPay QR)
//     // หมายเหตุ: จำนวนเงิน Omise ต้องเป็น Integer หน่วยสตางค์
//     const amountInSatang = Math.round(amount * 100);

//     const source = await omise.sources.create({
//       amount: amountInSatang,
//       currency: 'THB',
//       type: 'promptpay',
//     });

//     // 3. สร้าง "Charge" เพื่อผูก Source
//     const charge = await omise.charges.create({
//       amount: amountInSatang,
//       currency: 'THB',
//       source: source.id,
//       // return_uri คือหน้าที่ User จะกลับไปหลังจากจ่าย (สำหรับเคส Card)
//       // สำหรับ PromptPay ส่วนใหญ่จะใช้ Webhook เป็นหลัก
//       // return_uri: `${process.env.NEXT_PUBLIC_APP_URL}/payment/${bookingId}`,
//       return_uri: `${process.env.URL_NGROK}/payment/${bookingId}`,
//     });

//     // 4. บันทึกข้อมูลการชำระเงินลง Database
//     // ใช้ upsert เพื่อที่ว่าถ้าเขากดเจน QR ซ้ำ จะได้ไม่เกิด record ขยะเยอะเกินไป
//     const payment = await prisma.payment.upsert({
//       where: {
//         // ถ้าคุณมี external_id อยู่แล้วให้ใช้ค้นหา แต่ถ้ายังไม่มีให้สร้างใหม่ผ่าน bookingId
//         id: booking.payments[0]?.id || 'new-payment-uuid'
//       },
//       update: {
//         external_id: charge.id,
//         qr_payload: charge.source.scannable_code.image.download_uri,
//         amount: amount,
//       },
//       create: {
//         bookingId: bookingId,
//         amount: amount,
//         status: PaymentStatus.PENDING,
//         external_id: charge.id,
//         qr_payload: charge.source.scannable_code.image.download_uri,
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       qrCodeUrl: charge.source.scannable_code.image.download_uri,
//       chargeId: charge.id
//     });

//   } catch (error: any) {
//     console.error("Omise Error:", error);
//     return NextResponse.json({
//       error: error.message || 'Payment initialization failed'
//     }, { status: 500 });
//   }
// }