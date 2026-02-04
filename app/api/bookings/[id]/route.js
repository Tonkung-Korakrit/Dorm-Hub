// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const { status } = await req.json();

    // 1️⃣ อัปเดตสถานะ Booking
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: true,
        room: { include: { dorm: true } }
      }, // ดึงข้อมูลผู้ใช้ + ห้องมาใช้ในเมล
    });

    // 2️⃣ ถ้า Confirmed → ส่งเมลแจ้งผู้จอง
    if (status === "CONFIRMED") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"ฝ่ายบริหารหอพักมหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
        to: booking.user.email,
        subject: "แจ้งผลการคัดเลือก หอพักมหาวิทยาลัยธรรมศาสตร์",
        text: `เรียนคุณ ${booking.user.name_th || booking.user.name},\n
        หอพักมหาวิทยาลัยธรรมศาสตร์\n
        ขอขอบคุณที่ท่านให้ความสนใจ\n
        สมัครหอพักของเรา\n
        และมีความยินดีจะแจ้งให้ท่านทราบ\n
        ว่าท่านได้รับสิทธิ์เข้าพักหอพักแล้ว\n
        รายละเอียดการจอง:\n
        - หมายเลขการจอง: ${booking.id}\n
        - หอพัก: ${booking.room?.dorm?.name}\n
        - ห้องพัก: ${booking.room?.roomId}\n
        - ราคา: ${booking.room?.price} บาท/เดือน\n
        - สถานะปัจจุบัน: ${booking.status}\n
        โดยชำระเงินได้ที่ psm.tu.ac.th/pay\n
        สามารถ login ได้ในวันถัดไป โดย\n
        username คือ เลขประจำตัวประชาชน 13 หลัก\n
        password สำหรับ login ครั้งแรก คือ P@ssw0rd\n
        หากไม่ชำระเงินภายในกำหนดจะถือว่าสละสิทธิ์\n
        เมื่อชำระเงินค่าธรรมเนียมหอพักแล้ว\n
        โปรดเก็บใบรับชำระไว้เป็นหลักฐาน\n
        ขอบคุณที่ใช้บริการระบบจองหอพักนักศึกษา
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return Response.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return Response.json(
      { error: "ไม่สามารถอัปเดตการจองได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  try {
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
      include: { user: true, room: { include: { dorm: true } } },
    });

    // ส่งอีเมลแจ้งเตือน
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"ฝ่ายบริหารหอพักมหาวิทยาลัยธรรมศาสตร์" <${process.env.EMAIL_USER}>`,
      to: booking.user.email,
      subject: "❌ แจ้งผลการคัดเลือก: ไม่ได้รับสิทธิ์เข้าพักหอพักมหาวิทยาลัยธรรมศาสตร์",
      html: `
    <div style="font-family: Tahoma, Arial, sans-serif; font-size: 14px; line-height: 1.6;">
      <p>เรียนคุณ <strong>${booking.user.name_th || booking.user.name}</strong>,</p>

      <p>ฝ่ายบริหารหอพักมหาวิทยาลัยธรรมศาสตร์ ขอขอบคุณที่ท่านให้ความสนใจสมัครเข้าพักหอพักของเรา</p>

      <hr />

      <p style="color: red; font-weight: bold; font-size: 16px;">
        ❌ ผลการพิจารณา: ท่าน <strong>ไม่ได้รับสิทธิ์เข้าพักหอพัก</strong>
      </p>

      <hr />

      <p><strong>รายละเอียดการจอง:</strong></p>
      <ul>
        <li>หมายเลขการจอง: <strong>${booking.id}</strong></li>
        <li>หอพัก: <strong>${booking.room?.dorm?.name}</strong></li>
        <li>ห้องพัก: <strong>${booking.room?.roomId}</strong></li>
        <li>ราคา: <strong>${booking.room?.price} บาท/เดือน</strong></li>
        <li>สถานะปัจจุบัน: <strong>${booking.status}</strong></li>
      </ul>

      <p>
        หากมีข้อสงสัยหรือต้องการติดต่อสอบถามเพิ่มเติม<br/>
        โทรศัพท์: 02-026-2345<br/>
        อีเมล: marketing@psm.tu.ac.th
      </p>

      <p>ขอแสดงความนับถือ<br/>สำนักงานบริหารทรัพย์สิน และกีฬาธรรมศาสตร์</p>
    </div>
  `
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ message: "Booking cancelled", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return Response.json(
      { error: "ไม่สามารถยกเลิกการจองได้" },
      { status: 500 }
    );
  }
}
