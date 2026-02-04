// // /api/bookings/reject-payment/route.ts
// import { prisma } from "@/lib/prisma";
// import nodemailer from "nodemailer";
// import { NextRequest, NextResponse } from "next/server";
// import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";

// export async function POST(request: NextRequest) {
//   try {
//     const { bookingId } = await request.json();

//     if (!bookingId) {
//       return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
//     }

//     const booking = await prisma.$transaction(async (tx) => {
//       // ดึงข้อมูลการจองปัจจุบันมาดูก่อน
//       const currentBooking = await tx.booking.findUnique({
//         where: { id: Number(bookingId) },
//         include: { room: true }
//       });

//       if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

//       // อัปเดตสถานะการจองเป็น VERIFYING 
//       const updatedBooking = await tx.booking.update({
//         where: { id: Number(bookingId) },
//         data: { status: BookingStatus.VERIFYING },
//         include: {
//           user: true,
//           room: {
//             include: {
//               zone: { include: { dorm: true } }
//             }
//           }
//         }
//       });

//       // 4. ส่ง Email ยืนยัน (โครงสร้างแบบทางการ)
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS
//         },
//       });

//       await transporter.sendMail({
//         from: `"กองบริการหอพัก มหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
//         to: booking.user.email,
//         // เปลี่ยน Subject ให้ชัดเจนว่า "ได้รับหลักฐานแล้ว"
//         subject: `[ACTION REQUIRED] พบปัญหาเกี่ยวกับหลักฐานการโอนเงิน - #${booking.id}`,
//         html: `
//       <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
//         <h2 style="color: #C0392B;">แจ้งปัญหาการตรวจสอบการชำระเงิน</h2>
//         <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>
//         <p>เจ้าหน้าที่ไม่สามารถยืนยันการชำระเงินของท่านได้เนื่องจากสาเหตุดังนี้:</p>

//         <div style="background-color: #fdedec; padding: 20px; border-radius: 15px; margin: 20px 0; border: 1px solid #fadbd8; color: #C0392B;">
//           <b>เหตุผลจากเจ้าหน้าที่:</b> ${adminRemark || "สลิปไม่ชัดเจนหรือยอดเงินไม่ถูกต้อง"}
//         </div>
        
//         <p style="font-size: 14px;"><b>กรุณาดำเนินการ:</b> เข้าสู่ระบบจองหอพักอีกครั้งเพื่ออัปโหลดหลักฐานที่ถูกต้องภายใน 12 ชั่วโมง มิฉะนั้นระบบอาจจำเป็นต้องยกเลิกรายการจองของท่าน</p>
    
//         <div style="text-align: center; margin-top: 30px;">
//           <a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-booking" style="background-color: #333; color: #fff; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: bold;">แก้ไขข้อมูลการจอง</a>
//         </div>

//         <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
//           <p>ท่านสามารถเข้าตรวจสอบสถานะการจองล่าสุดได้ที่หน้าเว็บไซต์ของระบบจองหอพัก</p>
//           <p>📞 สอบถามเพิ่มเติม: 02-XXX-XXXX | ✉️ อีเมล: accommodation@tu.ac.th</p>
//         </div>
//       </div>
//       `
//       });

//       return NextResponse.json({ success: true });
//     } catch (error: any) {
//       console.error("Confirm Payment Error:", error.message);
//       return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//     }
//   }