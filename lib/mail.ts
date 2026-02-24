// lib/mail.ts
// import nodemailer from 'nodemailer';
import dns from 'dns';
import * as Brevo from '@getbrevo/brevo';
import { Booking, BookingStatus, MailBookingData } from "@/types/booking";
import { DORM_LABELS } from './constants';

// บังคับให้ใช้ IPv4 ก่อน เพื่อป้องกันปัญหา Network Timeout บน Railways
dns.setDefaultResultOrder('ipv4first');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY as string);

const baseUrl = process.env.NEXTAUTH_URL || 'https://tudormbooking-production.up.railway.app/';
// const senderName = "ฝ่ายบริหารหอพัก มหาวิทยาลัยธรรมศาสตร์";
const senderName = "สำนักงานบริหารทรัพย์และกีฬา มหาวิทยาลัยธรรมศาสตร์";
const senderEmail = process.env.BREVO_USER as string;

const cleanEmail = (email: string) => email.replace(/[\n\r\t\s]/g, "").trim();

// --- 1. ฟังก์ชันส่งเมลแจ้งผลการตรวจ (CONFIRMED / REJECTED) ---
export const sendStatusEmail = async (
  booking: MailBookingData,
  status: BookingStatus,
  remark?: string,
  coResidentNote?: string,
) => {
  const targetEmail = cleanEmail(booking.cus_users.email);
  const isConfirmed = status === BookingStatus.COMPLETED;
  // const transporter = getTransporter();

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = isConfirmed
    ? `[CONFIRMED] ยืนยันสิทธิ์การเข้าพักหอพักเรียบร้อยแล้ว - ห้อง ${booking.room.roomId}`
    : `[REJECTED] แจ้งแก้ไขหลักฐานการชำระเงิน - เลขที่การจอง #${booking.id}`;

  sendSmtpEmail.sender = { "name": senderName, "email": senderEmail };
  sendSmtpEmail.to = [{ "email": targetEmail, "name": booking.cus_users.name_th }];

  const htmlConfirmed = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #006432; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">ยืนยันสิทธิ์การเข้าพักสำเร็จ</h2>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 14px;">เลขที่การจอง #${booking.id}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 30px;">
          ยินดีด้วย! หอพักมหาวิทยาลัยได้ตรวจสอบหลักฐานการชำระเงินของท่านเรียบร้อยแล้ว และขอ <b>ยืนยันสิทธิ์การเข้าพัก</b> ของท่านตามรายละเอียดดังนี้:
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">ข้อมูลการเข้าพัก</h3>
          <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">หอพัก/โซน:</td>
              <td style="padding: 6px 0; font-weight: 600;">${booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">ห้องพัก:</td>
              <td style="padding: 6px 0; font-weight: 600;">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">ประเภทห้อง:</td>
              <td style="padding: 6px 0;">${booking.room.roomType} (${booking.type})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">สถานะ:</td>
              <td style="padding: 6px 0; color: #006432; font-weight: 600;">ยืนยันสำเร็จ (Confirmed)</td>
            </tr>
          </table>
          ${coResidentNote ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0369a1;">
            <b>หมายเหตุ:</b> ${coResidentNote}
          </div>` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">🗓️ ขั้นตอนถัดไป:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li><b>การรับกุญแจ:</b> ติดต่อรับได้ที่สำนักงานหอพักในวันรายงานตัวเข้าพัก</li>
            <li><b>เอกสารที่ต้องเตรียม:</b> บัตรนักศึกษา หรือ บัตรประจำตัวประชาชนตัวจริง</li>
            <li><b>การย้ายเข้า:</b> ตรวจสอบกำหนดการย้ายเข้าได้ที่หน้าเว็บไซต์หอพัก</li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${baseUrl}/my-booking" style="background-color: #006432; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">พิมพ์ใบยืนยันการจอง</a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">© 2026 ${senderName} | ระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
      </div>
    </div>`;

  // const htmlConfirmed = `
  //   <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 24px; overflow: hidden;">
  //     <div style="background-color: #006432; padding: 40px 20px; text-align: center;">
  //       <h1 style="color: #ffffff; margin: 0; font-size: 28px;">ยืนยันการจองสำเร็จ</h1>
  //       <p style="color: #d1fae5; margin-top: 10px; font-size: 16px;">เลขที่การจอง #${booking.id}</p>
  //     </div>
  //     <div style="padding: 30px;">
  //       <p style="font-size: 18px;">เรียน คุณ <b>${booking.user.name_th}</b>,</p>
  //       <p style="color: #4b5563;">ยินดีด้วย! ระบบได้ยืนยันสิทธิ์การเข้าพักของท่านเรียบร้อยแล้ว:</p>
  //       <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #f1f5f9;">
  //         <p style="margin: 5px 0;"><b>หอพัก:</b> ${booking.room.zone.dorm.name}</p>
  //         <p style="margin: 5px 0;"><b>โซน:</b> ${booking.room.zone.name}</p>
  //         <p style="margin: 5px 0;"><b>ห้อง:</b> ${booking.room.roomId} (ชั้น ${booking.room.floor})</p>
  //         <p style="margin: 5px 0;"><b>ประเภทห้อง:</b> ${booking.room.roomType}</p>
  //         <p style="margin: 5px 0;"><b>ประเภทการจอง:</b> ${booking.type}</p>
  //         ${coResidentNote ? `<p style="margin-top: 10px; color: #0369a1;">ℹ️ ${coResidentNote}</p>` : ''}
  //       </div>
  //       <h3 style="color: #006432;">🗓️ ขั้นตอนถัดไป</h3>
  //       <ul style="font-size: 14px; color: #4b5563; line-height: 1.8;">
  //         <li><b>การรับกุญแจ:</b> ติดต่อรับได้ที่สำนักงานหอพักในวันรายงานตัว</li>
  //         <li><b>เอกสาร:</b> บัตรนักศึกษา หรือ บัตรประจำตัวประชาชนตัวจริง</li>
  //       </ul>
  //       <div style="text-align: center; margin-top: 30px;">
  //         <a href="${baseUrl}/my-booking" style="background-color: #006432; color: white; padding: 14px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">ดูรายละเอียดในระบบ</a>
  //       </div>
  //     </div>
  //   </div>`;

  const htmlRejected = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #fee2e2; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #dc2626; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งปัญหาการตรวจสอบการชำระเงิน</h2>
        <p style="color: #fee2e2; margin-top: 8px; font-size: 14px;">รายการจอง #${booking.id} ต้องได้รับการแก้ไข</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 25px;">
          จากการตรวจสอบหลักฐานการชำระเงินของท่านโดยเจ้าหน้าที่ <b>พบข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน</b> 
          ทำให้ไม่สามารถยืนยันการจองได้ในขณะนี้
        </p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #991b1b; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">❌ สาเหตุที่ปฏิเสธ:</h3>
          <p style="font-size: 15px; color: #b91c1c; margin: 0; line-height: 1.6; background: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626;">
            "${remark || 'หลักฐานการชำระเงินไม่ชัดเจน หรือข้อมูลไม่ตรงกับยอดที่ต้องชำระ'}"
          </p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">
          กรุณาตรวจสอบความถูกต้องของสลิปการโอนเงิน และดำเนินการอัปโหลดหลักฐานใหม่อีกครั้งภายในระยะเวลาที่กำหนด เพื่อรักษาเสถียรภาพสิทธิ์ในการจองห้องพักของท่าน
        </p>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #94a3b8;">
          หากท่านมีข้อสงสัยเพิ่มเติม สามารถติดต่อสอบถามได้ที่ Line@: <b>@baantuofficial</b> หรือโทร 02-026-2345
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0;">© 2026 ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

    //  <div style="text-align: center; margin-bottom: 30px;">
    //       <a href="${baseUrl}/payment" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">อัปโหลดสลิปใหม่อีกครั้ง</a>
    //     </div>

  // const htmlRejected = `
  //   <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #fee2e2; padding: 0; border-radius: 24px; overflow: hidden;">
  //     <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
  //       <h1 style="color: #ffffff; margin: 0; font-size: 26px;">ชำระเงินไม่สำเร็จ</h1>
  //       <p style="color: #fee2e2; margin-top: 10px; font-size: 14px;">รายการจอง #${booking.id} ถูกปฏิเสธ</p>
  //     </div>
  //     <div style="padding: 30px;">
  //       <p style="font-size: 18px;">เรียน คุณ <b>${booking.user.name_th}</b>,</p>
  //       <p style="color: #4b5563;">เจ้าหน้าที่ได้ตรวจสอบหลักฐานการชำระเงินของท่านแล้วพบว่าข้อมูลไม่ถูกต้อง</p>
  //       <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 16px; margin: 25px 0;">
  //         <p style="margin: 5px 0;"><b>หอพัก:</b> ${booking.room.zone.dorm.name}</p>
  //         <p style="margin: 5px 0;"><b>โซน:</b> ${booking.room.zone.name}</p>
  //         <p style="margin: 5px 0;"><b>ห้อง:</b> ${booking.room.roomId} (ชั้น ${booking.room.floor})</p>
  //         <p style="margin: 5px 0;"><b>ประเภทห้อง:</b> ${booking.room.roomType}</p>
  //         <p style="margin: 5px 0;"><b>ประเภทการจอง:</b> ${booking.type}</p>  
  //         <p style="margin: 0; color: #991b1b; font-weight: bold;">❌ เหตุผลที่ปฏิเสธ:</p>
  //         <p style="margin: 10px 0 0 0; color: #b91c1c;">"${remark || 'หลักฐานไม่ชัดเจน กรุณาอัปโหลดใหม่อีกครั้ง'}"</p>
  //       </div>
  //       <div style="text-align: center; margin-top: 30px;">
  //         <a href="${baseUrl}/payment" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">อัปโหลดสลิปใหม่อีกครั้ง</a>
  //       </div>
  //     </div>
  //   </div>`;

  sendSmtpEmail.htmlContent = isConfirmed ? htmlConfirmed : htmlRejected;

  console.log(`[GmailService] กำลังส่งเมลแจ้งผลไปที่: ${targetEmail}`);

  // return await resend.emails.send({
  //   from: FROM_EMAIL,
  //   to: [booking.user.email],
  //   // to: targetEmail,
  //   subject: isConfirmed
  //     ? `[CONFIRMED] ยืนยันสิทธิ์การเข้าพัก - ห้อง ${booking.room.roomId}`
  //     : `[REJECTED] แจ้งแก้ไขหลักฐานการชำระเงิน - เลขที่การจอง #${booking.id}`,
  //   html: isConfirmed ? htmlConfirmed : htmlRejected,
  // });

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ [Brevo API Success]: ส่งผลการตรวจสำเร็จ!", data.body.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [Brevo API Error]:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

// --- 2. ได้รับหลักฐานการชำระเงินแล้ว และอยู่ในขั้นตอน Verifying (ตรวจสอบ) ---
export const sendPaymentVerifyingEmail = async (
  booking: MailBookingData,
  coResidentNote?: string
) => {
  const targetEmail = cleanEmail(booking.cus_users.email);
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `[VERIFYING] แจ้งยืนยันการรับหลักฐานการชำระเงินค่ามัดจำ - ห้อง ${booking.room.roomId}`;
  sendSmtpEmail.sender = { "name": senderName, "email": senderEmail };
  sendSmtpEmail.to = [{ "email": targetEmail, "name": booking.cus_users.name_th }];

  console.log(`[GmailService] พยายามส่งเมล PENDING ไปที่: ${targetEmail}`);

  // const htmlPending = `
  //   <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
  //     <h2 style="color: #E67E22;">ได้รับข้อมูลการชำระเงินเรียบร้อยแล้ว</h2>
  //     <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>

  //     <p>เจ้าหน้าที่ได้รับหลักฐานการโอนเงินของท่านแล้ว ขณะนี้กำลังอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b></p>

  //     <div style="background-color: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
  //       <p style="margin: 5px 0;"><b>เลขที่อ้างอิง:</b> #${booking.id}</p>
  //       <p style="margin: 5px 0;"><b>ห้องพัก:</b> ${booking.room.roomId} (${booking.room.zone.dorm.name})</p>
  //       <p style="margin: 5px 0;"><b>สถานะปัจจุบัน:</b> <span style="color: #E67E22; font-weight: bold;">อยู่ระหว่างการตรวจสอบ (VERIFYING)</span></p>

  //       ${coResidentNote ? `<p style="margin-top: 10px; color: #0369a1;">ℹ️ ${coResidentNote}</p>` : ''} 
  //     </div>

  //     <h3 style="font-size: 16px; color: #006432;">🗓️ ขั้นตอนถัดไป (What's Next?)</h3>
  //     <ul style="font-size: 14px; padding-left: 20px; line-height: 1.6;">
  //       <li><b>รอการตรวจสอบ:</b> เจ้าหน้าที่จะตรวจสอบสลิปภายใน 24-48 ชั่วโมง (ในวันและเวลาทำการ)</li>
  //       <li><b>การยืนยันสิทธิ์:</b> เมื่อตรวจสอบสำเร็จ ระบบจะส่งอีเมล <b>"ยืนยันสิทธิ์การเข้าพัก (Confirmed)"</b> ให้ท่านอีกครั้งหนึ่ง</li>
  //       <li><b>กรณีข้อมูลไม่ถูกต้อง:</b> หากยอดเงินไม่ตรงหรือสลิปไม่ชัดเจน เจ้าหน้าที่จะแจ้งผลการปฏิเสธผ่านทางอีเมลเพื่อให้ท่านดำเนินการแก้ไข</li>
  //     </ul>

  //     <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
  //       <p>ท่านสามารถเข้าตรวจสอบสถานะการจองล่าสุดได้ที่หน้าเว็บไซต์ของระบบจองหอพัก</p>
  //       <p>📞 สอบถามเพิ่มเติม: 02-XXX-XXXX | ✉️ อีเมล: accommodation@tu.ac.th</p>
  //     </div>
  //   </div>`;

  const htmlPending = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #00B7EB; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งยืนยันการรับหลักฐานการชำระเงินค่ามัดจำ</h2>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 30px;">
          หอพักมหาวิทยาลัยได้รับหลักฐานการชำระเงินค่ามัดจำสำหรับการจองหอพักของท่านเรียบร้อยแล้ว 
          ขณะนี้ข้อมูลดังกล่าวอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b> 
          โดยเจ้าหน้าที่${senderName} โปรดรอการดำเนินการภายใน 1-2 วันทำการ
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">เลขที่อ้างอิง:</td>
              <td style="padding: 6px 0; font-weight: 600;">#${booking.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">หอพัก/โซน:</td>
              <td style="padding: 6px 0;">${DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">ห้องพัก:</td>
              <td style="padding: 6px 0;">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">สถานะปัจจุบัน:</td>
              <td style="padding: 6px 0; color: #9a3412; font-weight: 600;">อยู่ระหว่างการตรวจสอบ (Verified)</td>
            </tr>
          </table>
          ${coResidentNote ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0369a1;">
            <b>หมายเหตุ:</b> ${coResidentNote}
          </div>` : ''}
        </div>

        <div style="text-align: center; margin-bottom: 35px;">
          <a href="${baseUrl}/my-booking" style="background-color: #006432; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">ตรวจสอบสถานะการจองล่าสุด</a>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">ข้อควรทราบ:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>หากข้อมูลถูกต้อง ระบบจะส่งอีเมลยืนยันสิทธิ์เข้าพัก (Confirmed) ให้ท่านอีกครั้ง</li>
            <li>หากพบความผิดปกติของสลิป เจ้าหน้าที่จะแจ้งผลการปฏิเสธเพื่อให้ท่านแก้ไข</li>
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© 2026 ${senderName}</p>
      </div>
    </div>`;

  sendSmtpEmail.htmlContent = htmlPending;

  // transporter.verify((error, success) => {
  //   if (error) {
  //     console.error("❌ [Transporter Check]: เชื่อมต่อ Gmail ไม่ได้:", error.message);
  //   } else {
  //     console.log("🚀 [Transporter Check]: พร้อมส่งเมลแล้ว!");
  //   }
  // });

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ [Brevo API Success]: ได้รับสลิปเรียบร้อย!", data.body.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [Brevo API Error]:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

// const getTransporter = () => {
//   return nodemailer.createTransport({
//     host: 'smtp-relay.brevo.com',
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     // ใส่ Timeout ให้สั้นลงเพื่อไม่ให้ดึง Process ทั้งหมดค้าง
//     debug: true,
//     logger: true,
//     connectionTimeout: 20000,
//     greetingTimeout: 20000,
//     socketTimeout: 30000,
//     // tls: {
//     //   rejectUnauthorized: false,
//     //   minVersion: 'TLSv1.2',
//     // },
//   });
// };
