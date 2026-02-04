// /api/bookings/confirm-payment/route.ts
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, BookingType, RoomStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // 1. ใช้ Transaction เพื่ออัปเดตทั้ง Booking และ Room
    const booking = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลการจองปัจจุบันมาดูก่อน
      const currentBooking = await tx.booking.findUnique({
        where: { id: Number(bookingId) },
        include: { room: true }
      });

      if (!currentBooking) throw new Error("ไม่พบข้อมูลการจอง");

      // อัปเดตสถานะการจองเป็น VERIFYING 
      const updatedBooking = await tx.booking.update({
        where: { id: Number(bookingId) },
        data: { status: BookingStatus.VERIFYING },
        include: {
          user: true,
          room: {
            include: {
              zone: { include: { dorm: true } }
            }
          }
        }
      });

      // Logic: อัปเดตสถานะห้องพักตามเงื่อนไขที่จ่ายเงินสำเร็จแล้ว
      const { type, room } = updatedBooking;
      let finalRoomStatus = room.status;

      const maxCap = room.capacity;
      const CO_RESIDENT_LIMIT = maxCap + 10; // พักร่วมได้ไม่เกิน 10 คน

      if (type === BookingType.CHARTER) {
        finalRoomStatus = RoomStatus.FULL; // เหมาห้อง = เต็มทันที
      } else if (type === BookingType.NOT_CHARTER && room.currentOccupancy >= room.capacity) {
        finalRoomStatus = RoomStatus.FULL; // คนเต็มเตียง = เต็ม
      } else if (type === BookingType.CO_RESIDENT && room.currentOccupancy >= CO_RESIDENT_LIMIT) {
        finalRoomStatus = RoomStatus.FULL; // พักร่วมครบ 10 คน = เต็ม
      } else {
        finalRoomStatus = RoomStatus.AVAILABLE; // หากยังไม่เข้าเงื่อนไขเต็ม ให้กลับมาว่างสำหรับคนถัดไป
      }

      await tx.room.update({
        where: { id: room.id },
        data: { status: finalRoomStatus }
      });

      return updatedBooking;
    });

    // 2. ส่ง Line Notification
    const lineMessage = `📢 จองหอพักสำเร็จ!\nคุณ: ${booking.user.name_th}\nห้อง: ${booking.room.roomId}\nวิทยาเขต: ${booking.room.zone.dorm.name}`;

    // ส่ง Line แบบไม่ขวางการทำงานหลัก (Fire and forget)
    fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
      },
      body: new URLSearchParams({ message: lineMessage })
    }).catch(err => console.error("Line Notify Error:", err));

    // 3. ค้นหาชื่อเจ้าของห้องหลัก (กรณีที่เป็น Co-Resident)
    let coResidentNote = "";
    if (booking.type === BookingType.CO_RESIDENT) {
      const ownerBooking = await prisma.booking.findFirst({
        where: {
          roomId: booking.room.id,
          type: BookingType.CHARTER,
          status: BookingStatus.VERIFYING
        },
        include: { user: { select: { name_th: true } } }
      });

      const ownerName = ownerBooking?.user.name_th || "เจ้าของห้องหลัก";
      coResidentNote = `
        <div style="margin-top: 10px; padding: 10px; background-color: #eef6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 13px; color: #1e40af;">
            📌 <b>ข้อมูลเพิ่มเติม:</b> ท่านเข้าพักในฐานะผู้พักร่วมกับคุณ <b>${ownerName}</b>
          </p>
        </div>
      `;
    }

    // 4. ส่ง Email ยืนยัน (โครงสร้างแบบทางการ)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    // await transporter.sendMail({
    //   from: `"กองบริการหอพัก มหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
    //   to: booking.user.email,
    //   subject: `[CONFIRMED] ยืนยันสิทธิ์การเข้าพัก - ห้อง ${booking.room.roomId}`,
    //   html: `
    //   <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
    //     <h2 style="color: #006432;">ยืนยันการจองสำเร็จ</h2>
    //     <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>

    //     <p style="border-top: 1px solid #eee; pt-20; font-size: 12px; color: #999; margin-top: 30px;">
    //       อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบจองหอพักออนไลน์
    //     </p>

    //     <p>ระบบขอยืนยันว่าการจองหอพักของท่านเสร็จสมบูรณ์แล้ว โดยมีรายละเอียดดังนี้:</p>

    //     <div style="background-color: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
    //       <p style="margin: 5px 0;"><b>เลขที่อ้างอิง:</b> #${booking.id}</p>
    //       <p style="margin: 5px 0;"><b>หอพัก:</b> ${booking.room.zone.dorm.name}</p>
    //       <p style="margin: 5px 0;"><b>ห้อง:</b> ${booking.room.roomId} (ชั้น ${booking.room.floor})</p>
    //       <p style="margin: 5px 0;"><b>ประเภท:</b> ${booking.type}</p>

    //       ${coResidentNote} 
    //     </div>

    //     <h3 style="font-size: 16px; color: #006432;">🗓️ ขั้นตอนถัดไป (Next Steps)</h3>
    //     <ul style="font-size: 14px; padding-left: 20px;">
    //       <li><b>การรับกุญแจ:</b> ติดต่อรับได้ที่สำนักงานหอพักในวันรายงานตัวเข้าหอพัก</li>
    //       <li><b>เอกสารที่ต้องเตรียม:</b> บัตรนักศึกษา หรือ บัตรประจำตัวประชาชนตัวจริง</li>
    //       <li><b>สัญญาหอพัก:</b> เจ้าหน้าที่จะจัดเตรียมเอกสารให้ลงนามในวันรับกุญแจ</li>
    //     </ul>

    //     <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
    //       <p>หากมีข้อสงสัยเพิ่มเติม โปรดติดต่อสำนักงานหอพัก<br/>
    //       📞 โทร: 02-XXX-XXXX | ✉️ อีเมล: accommodation@tu.ac.th</p>
    //       <p style="text-align: center; margin-top: 20px;"><i>ขอบคุณที่ใช้บริการระบบจองหอพักออนไลน์</i></p>
    //     </div>
    //   </div>
    // `
    // });

    await transporter.sendMail({
      from: `"กองบริการหอพัก มหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
      to: booking.user.email,
      // เปลี่ยน Subject ให้ชัดเจนว่า "ได้รับหลักฐานแล้ว"
      subject: `[PENDING] ได้รับหลักฐานการชำระเงินแล้ว - ห้อง ${booking.room.roomId} (รอการตรวจสอบ)`,
      html: `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
      <h2 style="color: #E67E22;">ได้รับข้อมูลการชำระเงินเรียบร้อยแล้ว</h2>
      <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>
      
      <p>เจ้าหน้าที่ได้รับหลักฐานการโอนเงินของท่านแล้ว ขณะนี้กำลังอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b></p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><b>เลขที่อ้างอิง:</b> #${booking.id}</p>
        <p style="margin: 5px 0;"><b>ห้องพัก:</b> ${booking.room.roomId} (${booking.room.zone.dorm.name})</p>
        <p style="margin: 5px 0;"><b>สถานะปัจจุบัน:</b> <span style="color: #E67E22; font-weight: bold;">อยู่ระหว่างการตรวจสอบ (VERIFYING)</span></p>
        
        ${coResidentNote} 
      </div>

      <h3 style="font-size: 16px; color: #006432;">🗓️ ขั้นตอนถัดไป (What's Next?)</h3>
      <ul style="font-size: 14px; padding-left: 20px; line-height: 1.6;">
        <li><b>รอการตรวจสอบ:</b> เจ้าหน้าที่จะตรวจสอบสลิปภายใน 24-48 ชั่วโมง (ในวันและเวลาทำการ)</li>
        <li><b>การยืนยันสิทธิ์:</b> เมื่อตรวจสอบสำเร็จ ระบบจะส่งอีเมล <b>"ยืนยันสิทธิ์การเข้าพัก (Confirmed)"</b> ให้ท่านอีกครั้งหนึ่ง</li>
        <li><b>กรณีข้อมูลไม่ถูกต้อง:</b> หากยอดเงินไม่ตรงหรือสลิปไม่ชัดเจน เจ้าหน้าที่จะแจ้งผลการปฏิเสธผ่านทางอีเมลเพื่อให้ท่านดำเนินการแก้ไข</li>
      </ul>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
        <p>ท่านสามารถเข้าตรวจสอบสถานะการจองล่าสุดได้ที่หน้าเว็บไซต์ของระบบจองหอพัก</p>
        <p>📞 สอบถามเพิ่มเติม: 02-XXX-XXXX | ✉️ อีเมล: accommodation@tu.ac.th</p>
      </div>
    </div>
  `
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Confirm Payment Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}