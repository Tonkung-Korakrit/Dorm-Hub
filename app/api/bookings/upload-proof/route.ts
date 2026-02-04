// // npm install @aws-sdk/client-s3

// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { BookingStatus } from "@prisma/client";
// // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import nodemailer from "nodemailer";

// // 1. ตั้งค่า R2 Client
// const s3Client = new S3Client({
//   region: "auto",
//   endpoint: process.env.R2_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
//   },
// });

// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get("paymentProof") as File;
//     const bookingId = formData.get("bookingId") as string;

//     if (!file || !bookingId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

//     // 2. เตรียมไฟล์สำหรับ Upload
//     const buffer = Buffer.from(await file.arrayBuffer());
//     const fileName = `proofs/${bookingId}-${Date.now()}-${file.name}`;

//     // 3. ยิงไฟล์ขึ้น Cloudflare R2
//     await s3Client.send(
//       new PutObjectCommand({
//         Bucket: process.env.R2_BUCKET_NAME,
//         Key: fileName,
//         Body: buffer,
//         ContentType: file.type,
//       })
//     );

//     const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

//     // 4. บันทึกลงฐานข้อมูล
//     await prisma.booking.update({
//       where: { id: Number(bookingId) },
//       data: {
//         status: BookingStatus.VERIFYING,
//         paymentProof: publicUrl,
//       },
//     });

//     const transporter = nodemailer.createTransport({
//           service: "gmail",
//           auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//           },
//         });

//         await transporter.sendMail({
//       from: `"กองบริการหอพัก มหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
//       to: booking.user.email,
//       // เปลี่ยน Subject ให้ชัดเจนว่า "ได้รับหลักฐานแล้ว"
//       subject: `[PENDING] ได้รับหลักฐานการชำระเงินแล้ว - ห้อง ${booking.room.roomId} (รอการตรวจสอบ)`,
//       html: `
//     <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px;">
//       <h2 style="color: #E67E22;">ได้รับข้อมูลการชำระเงินเรียบร้อยแล้ว</h2>
//       <p>เรียน คุณ <b>${booking.user.name_th}</b>,</p>
  
//       <p>เจ้าหน้าที่ได้รับหลักฐานการโอนเงินของท่านแล้ว ขณะนี้กำลังอยู่ใน <b>ขั้นตอนการตรวจสอบความถูกต้อง</b></p>
  
//       <div style="background-color: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
//         <p style="margin: 5px 0;"><b>เลขที่อ้างอิง:</b> #${booking.id}</p>
//         <p style="margin: 5px 0;"><b>ห้องพัก:</b> ${booking.room.roomId} (${booking.room.zone.dorm.name})</p>
//         <p style="margin: 5px 0;"><b>สถานะปัจจุบัน:</b> <span style="color: #E67E22; font-weight: bold;">อยู่ระหว่างการตรวจสอบ (VERIFYING)</span></p>
       
//         ${coResidentNote} 
//       </div>

//       <h3 style="font-size: 16px; color: #006432;">🗓️ ขั้นตอนถัดไป (What's Next?)</h3>
//       <ul style="font-size: 14px; padding-left: 20px; line-height: 1.6;">
//         <li><b>รอการตรวจสอบ:</b> เจ้าหน้าที่จะตรวจสอบสลิปภายใน 24-48 ชั่วโมง (ในวันและเวลาทำการ)</li>
//         <li><b>การยืนยันสิทธิ์:</b> เมื่อตรวจสอบสำเร็จ ระบบจะส่งอีเมล <b>"ยืนยันสิทธิ์การเข้าพัก (Confirmed)"</b> ให้ท่านอีกครั้งหนึ่ง</li>
//         <li><b>กรณีข้อมูลไม่ถูกต้อง:</b> หากยอดเงินไม่ตรงหรือสลิปไม่ชัดเจน เจ้าหน้าที่จะแจ้งผลการปฏิเสธผ่านทางอีเมลเพื่อให้ท่านดำเนินการแก้ไข</li>
//       </ul>

//       <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
//         <p>ท่านสามารถเข้าตรวจสอบสถานะการจองล่าสุดได้ที่หน้าเว็บไซต์ของระบบจองหอพัก</p>
//         <p>📞 สอบถามเพิ่มเติม: 02-XXX-XXXX | ✉️ อีเมล: accommodation@tu.ac.th</p>
//       </div>
//     </div>
//   `
//     });

//     return NextResponse.json({ success: true, url: publicUrl });

//   } catch (error: any) {
//     console.error("R2 Upload Error:", error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }