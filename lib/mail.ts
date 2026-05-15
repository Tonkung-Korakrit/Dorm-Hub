// lib/mail.ts
// import nodemailer from 'nodemailer';
import dns from 'dns';
import * as Brevo from '@getbrevo/brevo';
import { BookingStatus, MailBookingData } from "@/utils/types";
import { DORM_LABELS } from '../utils/constants';
import { getBookingDeadlines } from '@/utils/date_deadline';

// บังคับให้ใช้ IPv4 ก่อน เพื่อป้องกันปัญหา Network Timeout บน Railways
dns.setDefaultResultOrder('ipv4first');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY as string);

const baseUrl = process.env.NEXTAUTH_URL || 'https://tudormbooking-production.up.railway.app/';
// const senderName = "ฝ่ายบริหารหอพัก มหาวิทยาลัยธรรมศาสตร์";
const senderName = "สำนักงานบริหารทรัพย์สิน และกีฬา ธรรมศาสตร์";
const senderEmail = process.env.BREVO_USER as string;

const cleanEmail = (email: string) => email.replace(/[\n\r\t\s]/g, "").trim();

// --- สไตล์ส่วนที่ใช้ร่วมกัน (Common Components) ---
const commonTableStyle = `width: 100%; border-collapse: collapse;`;
const labelStyle = `padding: 8px 0; color: #64748b; font-size: 14px; width: 130px; vertical-align: top;`;
const valueStyle = `padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600;`;
const cardStyle = `background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 25px; border-radius: 12px; margin-bottom: 30px;`;

const { startDate, endDate } = getBookingDeadlines();

// --- 1. ฟังก์ชันส่งเมลแจ้งผลการตรวจ (CONFIRMED / REJECTED) ---
export const sendStatusEmail = async (
  booking: MailBookingData,
  status: BookingStatus,
  remark?: string,
  coResidentNote?: string,
) => {
  const targetEmail = cleanEmail(booking.cus_users.email);
  const isConfirmed = status === BookingStatus.COMPLETED;
  const isRejected = status === BookingStatus.REJECTED;
  const isResubmitting = status === BookingStatus.PENDING_CORRECTION;
  // const transporter = getTransporter();
  if (!isConfirmed && !isRejected && !isResubmitting) return;

  const residentTypeText = DORM_LABELS.RESIDENT_TYPE[booking.type] || booking.type;
  const roomTypeObj = DORM_LABELS.ROOM_TYPES[booking.room.roomType as keyof typeof DORM_LABELS.ROOM_TYPES] || booking.room.roomType;
  const roomTypeText = (roomTypeObj && typeof roomTypeObj === 'object' && 'label' in roomTypeObj)
    ? roomTypeObj.label 
    : String(roomTypeObj || booking.room.roomType);

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  // sendSmtpEmail.subject = isConfirmed
  //   ? `[CONFIRMED] ยืนยันสิทธิ์การเข้าพักหอพักเรียบร้อยแล้ว - ห้อง ${booking.room.roomId}`
  //   : `[REJECTED] แจ้งแก้ไขหลักฐานการชำระเงิน - เลขที่การจอง #${booking.id}`;
  let subject = "";
  if (isConfirmed) {
    subject = `[CONFIRMED] ยืนยันสิทธิ์การเข้าพักเรียบร้อยแล้ว - ห้อง ${booking.room.roomId}`;
  } else if (isResubmitting) {
    subject = `[ACTION REQUIRED] แจ้งแก้ไขข้อมูลการจองเพื่อให้สิทธิ์สมบูรณ์ - เลขที่จอง #${booking.id}`;
  } else {
    subject = `[REJECTED] ผลการพิจารณาการจองหอพักไม่ผ่านการอนุมัติ - เลขที่จอง #${booking.id}`;
  }
  sendSmtpEmail.subject = subject;

  sendSmtpEmail.sender = { "name": senderName, "email": senderEmail };
  sendSmtpEmail.to = [{ "email": targetEmail, "name": booking.cus_users.name_th }];

  const htmlConfirmed = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #006432; padding: 40px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">ยืนยันสิทธิ์การเข้าพักสำเร็จ</h2>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 35px; background-color: #ffffff;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 25px;">
          ยินดีด้วย! หอพักมหาวิทยาลัยได้ตรวจสอบหลักฐานการชำระเงินของท่านเรียบร้อยแล้ว และขอ <b>ยืนยันสิทธิ์การเข้าพัก</b> ของท่าน โดยมีรายละเอียดดังนี้:
        </p>
        
        <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">หอพัก/โซน:</td>
              <td style="${valueStyle}">${DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ห้องพัก:</td>
              <td style="${valueStyle}">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ประเภทห้อง:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${roomTypeText}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ประเภทการจอง:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${residentTypeText}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">สถานะปัจจุบัน:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: 600;">อนุมัติแล้ว (Confirmed)</td>
            </tr>
          </table>
          ${coResidentNote ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0369a1;">
            <b>หมายเหตุ:</b> ${coResidentNote}
          </div>` : ''}
        </div>

        <h4 style="font-size: 16px; color: #991b1b; margin: 0 0 15px 0; display: flex; items-center">ขั้นตอนถัดไป:</h4>
        <div style="font-size: 14px; color: #4b5563; line-height: 1.8;">
          <div style="margin-bottom: 12px;">
            <b>1. การรับกุญแจ:</b> ติดต่อรับกุญแจได้ที่ <b>สำนักงานจัดการทรัพย์สิน (อาคารยิมเนเซียม 7)</b>
          </div>
          <div style="margin-bottom: 12px;">
            <b>2. ระยะเวลาดำเนินการ:</b> ภายใน 7 วันทำการ 
            <div style="margin-top: 4px; background: #ffffff; padding: 8px; border-radius: 8px; border: 1px dashed #fca5a5; display: inline-block;">
                ระหว่างวันที่ <span style="color: #006432; font-weight: bold;">${startDate}</span> 
                ถึง <span style="color: #dc2626; font-weight: bold;">${endDate}</span>
            </div>
          </div>
          <div style="margin-bottom: 12px;">
              <b>3. เอกสารที่ต้องเตรียม:</b> บัตรนักศึกษา หรือ บัตรประจำตัวประชาชนตัวจริง
          </div>
          <div style="color: #dc2626; margin-top: 15px; font-weight: 600; border-top: 1px solid #fecaca; padding-top: 12px;">
              ⚠️ ข้อควรระวัง: หากไม่มาติดต่อภายในระยะเวลาที่กำหนด ระบบจะยกเลิกสิทธิ์การจองโดยอัตโนมัติ
          </div>
        </div>

        <div style="text-align: center; margin-top: 16px; margin-bottom: 16px;">
          <a href="${baseUrl}/my-booking" style="background-color: #006432; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">พิมพ์ใบยืนยันการจอง</a>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  const htmlRejected = `
    <div style="font-family: 'Sarabun', sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #fee2e2; padding: 0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #dc2626; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งผลการตรวจสอบข้อมูลการจอง</h2>
        <p style="color: #dcaaaa; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 25px;">
          ขออภัยในความไม่สะดวก เจ้าหน้าที่ได้ตรวจสอบข้อมูลการจองของท่านแล้ว <b>ไม่สามารถอนุมัติสิทธิ์การเข้าพักได้</b> 
          เนื่องจากสาเหตุดังต่อไปนี้:
        </p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <p style="${labelStyle}">เลขที่อ้างอิง #${booking.id} ไม่ผ่านการอนุมัติ</p>
          <h3 style="font-size: 13px; color: #991b1b; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">🚫 สาเหตุการปฏิเสธ:</h3>
          <div style="font-size: 15px; color: #b91c1c; background: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626;">
            ${remark || 'ข้อมูลไม่เป็นไปตามเงื่อนไขที่มหาวิทยาลัยกำหนด'}
          </div>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  const htmlPendingCorrection = `
    <div style="font-family: 'Sarabun', sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #fed7aa; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background-color: #f97316; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งแก้ไขข้อมูลการจอง</h2>
        <p style="color: #ffffff; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 25px;">
          เจ้าหน้าที่ได้ตรวจสอบข้อมูลของท่านแล้ว <b>พบจุดที่ต้องแก้ไขเพิ่มเติม</b> กรุณาดำเนินการแก้ไขเพื่อให้การจองสมบูรณ์:
        </p>

        <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id} รอการแก้ไขจากท่าน</td>
            </tr>
          </table>
          <h3 style="font-size: 13px; color: #9a3412; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">⚠️ รายละเอียดที่ต้องแก้ไข:</h3>
          <div style="font-size: 15px; color: #7c2d12; margin: 0; line-height: 1.6; background: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #f97316;">
            ${remark || 'กรุณาตรวจสอบรายละเอียดการแก้ไขในระบบ'}
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${baseUrl}/my-booking" style="background-color: #f97316; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">เข้าสู่ระบบเพื่อแก้ไขข้อมูล</a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">
          <b>กรุณาดำเนินการแก้ไขข้อมูลให้ถูกต้องภายในระยะเวลา:</b> ภายใน 7 วันทำการ นับจากวันที่ได้รับอีเมลฉบับนี้ เพื่อรักษาเสถียรภาพสิทธิ์ในการจองห้องพักของท่าน
          <br />
          (ตั้งแต่วันที่ <span style="color: #006432; font-weight: bold;">${startDate}</span> 
            ถึงวันที่ <span style="color: #dc2626; font-weight: bold;">${endDate}</span>)
        </p>

        <p style="font-size: 13px; color: #64748b; background: #f8fafc; padding: 15px; border-radius: 6px;">
          <b>หมายเหตุ:</b> หลังจากท่านแก้ไข และส่งข้อมูลอีกครั้ง เจ้าหน้าที่จะรีบดำเนินการตรวจสอบให้เร็วที่สุดครับ
        </p>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  // sendSmtpEmail.htmlContent = isConfirmed ? htmlConfirmed : htmlRejected;
  if (isConfirmed) {
    sendSmtpEmail.htmlContent = htmlConfirmed;
  } else if (isResubmitting) {
    sendSmtpEmail.htmlContent = htmlPendingCorrection; // ตัวใหม่ที่เราจะสร้าง
  } else {
    sendSmtpEmail.htmlContent = htmlRejected;
  }

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

  const htmlVerifying = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #3b82f6; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งยืนยันการรับหลักฐานการชำระเงินค่ามัดจำ</h2>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 30px;">
          หอพักมหาวิทยาลัยได้รับหลักฐานการชำระเงินค่ามัดจำสำหรับการจองหอพักของท่านเรียบร้อยแล้ว 
          ขณะนี้ข้อมูลดังกล่าวอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b> 
          โดยเจ้าหน้าที่${senderName} โปรดรอการดำเนินการภายใน 7 วันทำการ
        </p>
        
        <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">หอพัก/โซน:</td>
              <td style="${valueStyle}">${DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ห้องพัก:</td>
              <td style="${valueStyle}">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="${labelStyle}">สถานะปัจจุบัน:</td>
              <td style="padding: 6px 0; color: #3b82f6; font-weight: 600;">อยู่ระหว่างการตรวจสอบข้อมูล (Verifying)</td>
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
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  sendSmtpEmail.htmlContent = htmlVerifying;

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

export const sendResubmissionReceivedEmail = async (
  booking: MailBookingData,
) => {
  const targetEmail = cleanEmail(booking.cus_users.email);
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  // ปรับ Subject ให้ชัดเจนว่าเป็นการรับข้อมูลที่ "แก้ไขแล้ว"
  sendSmtpEmail.subject = `[RE-SUBMITTED] ระบบได้รับข้อมูลที่แก้ไขแล้ว - ห้อง ${booking.room.roomId}`;
  sendSmtpEmail.sender = { "name": senderName, "email": senderEmail };
  sendSmtpEmail.to = [{ "email": targetEmail, "name": booking.cus_users.name_th }];

  console.log(`[GmailService] พยายามส่งเมล RE-VERIFYING ไปที่: ${targetEmail}`);

  const htmlResubmission = `
    <div style="font-family: 'Sarabun', -apple-system, sans-serif; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #F59E0B; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">ระบบได้รับข้อมูลที่แก้ไขแล้ว</h2>
        <p style="color: #fef3c7; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>

      <div style="padding: 40px 30px;">
        <p style="font-size: 16px; margin-bottom: 20px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p style="line-height: 1.7; color: #4b5563; margin-bottom: 30px;">
          ระบบได้รับข้อมูลที่ท่านดำเนินการ <b>แก้ไข และส่งเข้ามาใหม่ (Resubmitted)</b> เรียบร้อยแล้ว 
          ขณะนี้ข้อมูลดังกล่าวถูกส่งกลับเข้าสู่ระบบเพื่อให้เจ้าหน้าที่ตรวจสอบความถูกต้องอีกครั้ง 
          โปรดรอการดำเนินการภายใน 7 วันทำการ
        </p>
        
        <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #b45309; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง (แก้ไขข้อมูล)</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ห้องพัก:</td>
              <td style="${valueStyle}">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="${labelStyle}">สถานะปัจจุบัน:</td>
              <td style="padding: 6px 0; color: #d97706; font-weight: 600;">อยู่ระหว่างตรวจสอบข้อมูลที่แก้ไข (Verifying)</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 35px;">
          <a href="${baseUrl}/my-booking" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">ตรวจสอบสถานะการจองล่าสุด</a>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">ขั้นตอนถัดไป:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เจ้าหน้าที่จะตรวจสอบข้อมูลตามที่ท่านได้แก้ไขเข้ามาใหม่</li>
            <li>หากข้อมูลถูกต้อง ท่านจะได้รับอีเมลยืนยันสิทธิ์หรือแจ้งสถานะถัดไปผ่านทางระบบ</li>
          </ul>
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  sendSmtpEmail.htmlContent = htmlResubmission;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ [Brevo API Success]: ส่งเมลแจ้งรับข้อมูลแก้ไขเรียบร้อย!", data.body.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [Brevo API Error]:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
};

export const sendStayStatusEmail = async (
  booking: any, 
  type: "CHECKIN" | "CHECKOUT"
) => {
  const targetEmail = booking.cus_users.email.trim().toLowerCase();
  const campusName = DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name;
  const today = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const commonStyles = `
    font-family: 'Sarabun', -apple-system, sans-serif;
    line-height: 1.8;
    color: #1f2937;
  `;

  // --- TEMPLATE: CHECK-IN SUCCESSFUL ---
  const htmlCheckin = `
    <div style="${commonStyles} max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #006432; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">เริ่มเข้าพักเรียบร้อยแล้ว</h2>
        <p style="color: #d1fae5; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>
      
      <div style="padding: 35px; background: white;">
        <p style="font-size: 16px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p>ท่านได้ดำเนินการรับกุญแจและเช็คอินเข้าสู่ที่พักอย่างเป็นทางการแล้ว โดยมีรายละเอียดดังนี้:</p>

        <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">หอพัก/โซน:</td>
              <td style="${valueStyle}">${DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ห้องพัก:</td>
              <td style="${valueStyle}">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="${labelStyle}">วันที่เริ่มพัก:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${today}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border: 1px solid #e0f2fe; margin-bottom: 30px;">
          <h4 style="margin: 0 0 10px 0; color: #0369a1;">🏠 ข้อควรปฏิบัติหลังเข้าพัก:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
            <li><b>ตรวจสอบห้อง:</b> โปรดตรวจสอบอุปกรณ์ภายในห้อง หากพบจุดชำรุด <b>กรุณาแจ้งผ่านระบบภายใน 24 ชม.</b></li>
            <li><b>ความปลอดภัย:</b> กรุณาล็อกห้องพักทุกครั้งเมื่อไม่อยู่ และไม่นำบุคคลภายนอกเข้าพักโดยไม่ได้รับอนุญาต</li>
            <li><b>ติดต่อสอบถาม:</b> หากมีปัญหาเรื่องน้ำ-ไฟ สามารถติดต่อเจ้าหน้าที่ประจำอาคารได้ทันที</li>
          </ul>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${baseUrl}/my-booking" style="background: #006432; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,100,50,0.2);">แจ้งซ่อม / ดูข้อมูลห้องพัก</a>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  // --- TEMPLATE: CHECK-OUT SUCCESSFUL ---
  const htmlCheckout = `
    <div style="${commonStyles} max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #475569; padding: 30px 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">แจ้งย้ายออกเรียบร้อยแล้ว</h2>
        <p style="color: #ffffff; margin-top: 8px; font-size: 14px;">${senderName}</p>
      </div>
      <div style="padding: 35px; background: white;">
        <p style="font-size: 16px;">เรียน คุณ <b>${booking.cus_users.name_th}</b>,</p>
        <p>หอพักมหาวิทยาลัยได้รับคืนกุญแจและตรวจสอบสถานะห้องพักของท่านเรียบร้อยแล้ว โดยมีรายละเอียดสรุปดังนี้:</p>

         <div style="${cardStyle}">
          <h3 style="font-size: 14px; color: #64748b; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">รายละเอียดการจอง</h3>
          <table style="${commonTableStyle}">
            <tr>
              <td style="${labelStyle}">เลขที่อ้างอิง:</td>
              <td style="${valueStyle}">#${booking.id}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">หอพัก/โซน:</td>
              <td style="${valueStyle}">${DORM_LABELS.CAMPUS[booking.room.dorm.campus.name as keyof typeof DORM_LABELS.CAMPUS] || booking.room.dorm.campus.name} / ${booking.room.dorm.name}</td>
            </tr>
            <tr>
              <td style="${labelStyle}">ห้องพัก:</td>
              <td style="${valueStyle}">ห้อง ${booking.room.roomId} (ชั้น ${booking.room.floor})</td>
            </tr>
            <tr>
              <td style="${labelStyle}">วันที่ย้ายออก:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${today}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fefce8; padding: 20px; border-radius: 12px; border: 1px solid #fef08a; margin-bottom: 30px;">
          <h4 style="margin: 0 0 10px 0; color: #854d0e;">💰 ขั้นตอนการคืนเงินมัดจำ:</h4>
          <div style="font-size: 14px; color: #713f12;">
            1. <b>การตรวจสอบ:</b> เจ้าหน้าที่จะสรุปค่าใช้จ่ายน้ำ-ไฟ งวดสุดท้ายและค่าความเสียหาย (ถ้ามี) <br/>
            2. <b>ระยะเวลา:</b> ท่านจะได้รับเงินมัดจำส่วนที่เหลือคืนภายใน <b>15-30 วันทำการ</b> <br/>
            3. <b>ช่องทาง:</b> โอนเข้าบัญชีที่ท่านระบุไว้ในระบบตอนแจ้งย้ายออก
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${baseUrl}/my-booking" style="background: #006432; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,100,50,0.2);">กดจองห้องพักใหม่</a>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <h4 style="font-size: 15px; color: #1f2937; margin: 0 0 10px 0;">หากมีข้อสงสัย<br />ท่านสามารถสอบถามเพิ่มเติมผ่านทาง:</h4>
          <ul style="font-size: 14px; color: #64748b; padding-left: 20px; line-height: 1.8;">
            <li>เบอร์โทรศัพท์: <a href="tel:020262345" style="color: #006432; text-decoration: none; font-weight: 600;">02-026-2345</a></li>
            <li>Line@: <a href="https://line.me/ti/p/@baantuofficial" style="color: #006432; text-decoration: none; font-weight: 600;">@baantuofficial</a></li> 
            <li>Email: <a href="mailto:marketing@psm.tu.ac.th" style="color: #006432; text-decoration: none; font-weight: 600;">marketing@psm.tu.ac.th</a></li>
            <li>Facebook Page: <a href="https://www.facebook.com/psm.tu?locale=th_TH" target="_blank" style="color: #006432; text-decoration: none; font-weight: 600;">baantuofficial</a></li>
          </ul>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 25px; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 5px 0;">อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName} | หอพักมหาวิทยาลัยธรรมศาสตร์</p>
      </div>
    </div>`;

  // --- Send Logic ---
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { name: senderName, email: senderEmail };
  sendSmtpEmail.to = [{ email: targetEmail, name: booking.cus_users.name_th }];

  if (type === "CHECKIN") {
    sendSmtpEmail.subject = `[CHECK-IN] ยืนยันการเข้าพักเรียบร้อยแล้ว - ห้อง ${booking.room.roomId}`;
    sendSmtpEmail.htmlContent = htmlCheckin;
  } else {
    sendSmtpEmail.subject = `[CHECK-OUT] ยืนยันการแจ้งย้ายออกสำเร็จ - เลขที่จอง #${booking.id}`;
    sendSmtpEmail.htmlContent = htmlCheckout;
  }

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ [Brevo Stay Status]: ${type} Success!`, data.body.messageId);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ [Brevo Stay Status Error]:`, error.response?.body || error.message);
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
