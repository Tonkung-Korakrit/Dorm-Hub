// lib/mail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // เพิ่มเพื่อให้รักษาการเชื่อมต่อไว้ ไม่ต้อง Handshake ใหม่ทุกครั้ง
  maxConnections: 5, // จำนวนการเชื่อมต่อพร้อมกัน
  maxMessages: 100, // จำนวนเมลต่อการเชื่อมต่อหนึ่งครั้ง
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface MailBookingData {
  id: number;
  type: string;
  user: {
    name_th: string;
    email: string;
  };
  room: {
    roomId: string;
    floor: number;
    roomType: string;
    zone: {
      name: string;
      dorm: {
        name: string;
      };
    };
  };
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// --- 1. ฟังก์ชันส่งเมลแจ้งผลการตรวจ (CONFIRMED / REJECTED) ---
export const sendStatusEmail = async (
  booking: MailBookingData, 
  status: 'CONFIRMED' | 'REJECTED', 
  remark?: string,
  coResidentNote?: string
) => {
  const isConfirmed = status === 'CONFIRMED';

  const htmlConfirmed = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 24px; overflow: hidden;">
      <div style="background-color: #006432; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">ยืนยันการจองสำเร็จ</h1>
        <p style="color: #d1fae5; margin-top: 10px; font-size: 16px;">เลขที่การจอง #${booking.id}</p>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 18px;">เรียน คุณ <b>${booking.user.name_th}</b>,</p>
        <p style="color: #4b5563;">ยินดีด้วย! ระบบได้ยืนยันสิทธิ์การเข้าพักของท่านเรียบร้อยแล้ว:</p>
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #f1f5f9;">
          <p style="margin: 5px 0;"><b>หอพัก:</b> ${booking.room.zone.dorm.name}</p>
          <p style="margin: 5px 0;"><b>โซน:</b> ${booking.room.zone.name}</p>
          <p style="margin: 5px 0;"><b>ห้อง:</b> ${booking.room.roomId} (ชั้น ${booking.room.floor})</p>
          <p style="margin: 5px 0;"><b>ประเภทห้อง:</b> ${booking.room.roomType}</p>
          <p style="margin: 5px 0;"><b>ประเภทการจอง:</b> ${booking.type}</p>
          ${coResidentNote ? `<p style="margin-top: 10px; color: #0369a1;">ℹ️ ${coResidentNote}</p>` : ''}
        </div>
        <h3 style="color: #006432;">🗓️ ขั้นตอนถัดไป</h3>
        <ul style="font-size: 14px; color: #4b5563; line-height: 1.8;">
          <li><b>การรับกุญแจ:</b> ติดต่อรับได้ที่สำนักงานหอพักในวันรายงานตัว</li>
          <li><b>เอกสาร:</b> บัตรนักศึกษา หรือ บัตรประจำตัวประชาชนตัวจริง</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${baseUrl}/my-booking" style="background-color: #006432; color: white; padding: 14px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">ดูรายละเอียดในระบบ</a>
        </div>
      </div>
    </div>`;

  const htmlRejected = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #fee2e2; padding: 0; border-radius: 24px; overflow: hidden;">
      <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">ชำระเงินไม่สำเร็จ</h1>
        <p style="color: #fee2e2; margin-top: 10px; font-size: 14px;">รายการจอง #${booking.id} ถูกปฏิเสธ</p>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 18px;">เรียน คุณ <b>${booking.user.name_th}</b>,</p>
        <p style="color: #4b5563;">เจ้าหน้าที่ได้ตรวจสอบหลักฐานการชำระเงินของท่านแล้วพบว่าข้อมูลไม่ถูกต้อง</p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 16px; margin: 25px 0;">
          <p style="margin: 5px 0;"><b>หอพัก:</b> ${booking.room.zone.dorm.name}</p>
          <p style="margin: 5px 0;"><b>โซน:</b> ${booking.room.zone.name}</p>
          <p style="margin: 5px 0;"><b>ห้อง:</b> ${booking.room.roomId} (ชั้น ${booking.room.floor})</p>
          <p style="margin: 5px 0;"><b>ประเภทห้อง:</b> ${booking.room.roomType}</p>
          <p style="margin: 5px 0;"><b>ประเภทการจอง:</b> ${booking.type}</p>  
          <p style="margin: 0; color: #991b1b; font-weight: bold;">❌ เหตุผลที่ปฏิเสธ:</p>
          <p style="margin: 10px 0 0 0; color: #b91c1c;">"${remark || 'หลักฐานไม่ชัดเจน กรุณาอัปโหลดใหม่อีกครั้ง'}"</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${baseUrl}/payment" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">อัปโหลดสลิปใหม่อีกครั้ง</a>
        </div>
      </div>
    </div>`;

  return transporter.sendMail({
    from: `"กองบริการหอพัก มธ." <${process.env.EMAIL_USER}>`,
    to: booking.user.email,
    subject: isConfirmed ? `[CONFIRMED] ยืนยันสิทธิ์การเข้าพัก - ห้อง ${booking.room.roomId}` : `[REJECTED] แจ้งแก้ไขหลักฐานการชำระเงิน - เลขที่การจอง #${booking.id}`,
    html: isConfirmed ? htmlConfirmed : htmlRejected,
  });
};

// --- 2. ฟังก์ชันส่งเมลแจ้งได้รับสลิป (PENDING / VERIFYING) ---
export const sendReceiptReceivedEmail = async (booking: MailBookingData, coResidentNote?: string) => {
  const htmlPending = `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
      <h2 style="color: #E67E22;">ได้รับข้อมูลการชำระเงินเรียบร้อยแล้ว</h2>
      <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>
      
      <p>เจ้าหน้าที่ได้รับหลักฐานการโอนเงินของท่านแล้ว ขณะนี้กำลังอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b></p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><b>เลขที่อ้างอิง:</b> #${booking.id}</p>
        <p style="margin: 5px 0;"><b>ห้องพัก:</b> ${booking.room.roomId} (${booking.room.zone.dorm.name})</p>
        <p style="margin: 5px 0;"><b>สถานะปัจจุบัน:</b> <span style="color: #E67E22; font-weight: bold;">อยู่ระหว่างการตรวจสอบ (VERIFYING)</span></p>
        
        ${coResidentNote ? `<p style="margin-top: 10px; color: #0369a1;">ℹ️ ${coResidentNote}</p>` : ''} 
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
    </div>`;

  return transporter.sendMail({
    from: `"กองบริการหอพัก มหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
    to: booking.user.email,
    subject: `[PENDING] ได้รับหลักฐานการชำระเงินแล้ว - ห้อง ${booking.room.roomId} (รอการตรวจสอบ)`,
    html: htmlPending,
  });
};