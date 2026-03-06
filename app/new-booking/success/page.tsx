// app/new-booking/success
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MdCheckCircle, MdRoom, MdCalendarToday, MdPrint, MdEmail, MdPayments, MdInfo } from "react-icons/md";
import { RiHomeSmileFill } from "react-icons/ri";
import PrintButton from "../components/PrintButton";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) return notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const session = await getServerSession(authOptions);

  // console.log("🛠️ Auth Check:", {
  //   tokenFound: !!token,
  //   sessionFound: !!session,
  //   userEmail: session?.user?.email
  // });

  // 2. ตรวจสอบเบื้องต้น: ต้องมีทั้ง Session และ Token
  if (!session && !token) {
    console.log("🚫 No Auth found, redirecting...");
    redirect("/");
  }

  // 3. Decode Custom Token เพื่อเอา userId
  // 3. Decode Token เฉพาะ "เมื่อมี token อยู่จริง" เท่านั้น
  let studentId: string | undefined;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      console.log("🔑 JWT Payload found:", payload);
      studentId = payload.studentId as string;
    } catch (err) {
      console.error("⚠️ Token verify failed, but session might still work");
      // ไม่ต้อง redirect ตรงนี้ เพราะเดี๋ยวเราจะไปลองเช็ค session.user.email ใน Prisma ต่อ
    }
  }

  // console.log("--- DEBUG START ---");
  // console.log("Booking ID from URL:", bookingId);
  // console.log("Token User ID:", userId);
  // console.log("Session Email:", session?.user?.email);
  // console.log("--- DEBUG END ---");

  // 4. Query โดยใช้เงื่อนไข "และ" (AND) จากทั้งสองระบบ
  // ต้องตรงทั้ง ID ของการจอง, UserId จาก Token และ Email จาก Session
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        {
          cus_users: {
            studentId: studentId || "no-username"
          }
        }, // ถ้าไม่มี Token ให้ใส่ค่าที่ไม่มีในระบบ (เช่น -1) เพื่อให้เงื่อนไขนี้ไม่เป็นจริง
        {
          cus_users: {
            email: session?.user?.email || "no-email"
          }
        }
      ]
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
      payments: true,
    },
  });

  // console.log(booking);

  if (!booking) return notFound();

  return (
    <div className="max-w-2xl mx-auto my-2 p-8 bg-white rounded-[2.5rem] shadow-xl border border-green-50 text-center">
      <div className="flex justify-center mt-4">
        {/* <div className="bg-green-100 p-4 rounded-full">
          <MdCheckCircle className="text-green-600" size={64} />
        </div> */}
        <MdCheckCircle className="text-[#126A31] text-8xl mx-auto mb-6 animate-bounce" />
      </div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Payment Received!</h1>
      <p className="text-gray-500 mb-8">ได้รับยอดชำระค่ามัดจำของท่านเรียบร้อยแล้ว</p>

      {/* บัตรรายละเอียดการจอง */}
      <div className="bg-[#f0f7f0] p-6 rounded-[2rem] border-2 border-[#e0ede0] text-left mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-700/60 font-bold uppercase text-[10px] tracking-widest">Booking ID</p>
            <p className="text-[18px] sm:[20px] font-bold text-gray-800">#TUD-{booking.id.toString().padStart(5, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-green-700/60 font-bold uppercase text-[10px] tracking-widest mb-[2px]">Payment Status</p>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-bold">Successful</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-green-200">
            {/* 1. จำนวนเงินที่ชำระ */}
            <div className="flex items-center pb-2 border-b border-green-200 gap-3 mb-2">
              <MdPayments className="text-amber-500" size={22} />
              <div>
                <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Paid Amount</p>
                <p className="text-sm font-black text-emerald-500">฿ {booking.payments[0]?.amount.toLocaleString()}<span className="text-gray-700 font-semibold"> THB</span></p>
                {/* <p className="text-sm font-black text-emerald-500">฿ 20<span className="text-gray-700 font-semibold"> THB</span></p> */}
              </div>
            </div>

            {/* 2. ส่วนข้อมูลห้องที่จอง */}
            <div className="flex items-center gap-3 mb-2">
              <RiHomeSmileFill className="text-green-600" size={20} />
              <div>
                <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Campus: <span className="font-bold text-[14px] text-gray-700">{booking.room.dorm.campus.name}</span></p>
                <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Dorm: <span className="font-bold text-[14px] text-gray-700">{booking.room.dorm?.name}</span> - Room <span className="font-bold text-[14px] text-gray-700">{booking.room.roomId}</span></p>
                <p className="text-xs text-gray-500">Floor {booking.room.floor} | {booking.room.roomType}</p>
              </div>
            </div>

            {/* 3. ส่วนข้อมูลการติดต่อ (Email) */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl"> */}
            <div className="col-span-2 pt-2 border-t border-green-200">
              <div className="flex items-center pb-2 border-b border-green-200 gap-3 mb-2">
                <MdEmail className="text-red-500" size={22} />
                <div>
                  <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Email Notification</p>
                  <p className="text-sm font-bold text-gray-700 break-all">{booking.cus_users?.email}</p>
                </div>
              </div>

              {/* 4. ส่วนสถานะการจอง (Booking Status) */}
              <div className="flex items-center gap-3 mb-2">
                <MdInfo className="text-blue-500" size={22} />
                <div>
                  <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Booking Status</p>
                  <p className="text-sm font-bold text-emerald-700">VERIFYING - รอตรวจสอบ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 md:px-10 pb-8 space-y-4 text-center">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <p className="text-sm text-amber-800 leading-relaxed font-medium">
            <span className="font-black">Currently:</span> เจ้าหน้าที่กำลังตรวจสอบข้อมูลและหลักฐานการชำระเงินของท่าน
            ระบบจะส่งผลการอนุมัติการจองของท่านให้ทางอีเมลภายใน <span className="underline">24-48 ชั่วโมง</span>
          </p>
        </div>
        <p className="text-[12px] text-gray-400 italic">
          Our staff is currently reviewing your information. You will be notified of the official booking result via email within 24-48 hours.
        </p>
      </div>

      {/* คำแนะนำเพิ่มเติม - ปรับให้เข้ากับสถานะ Verifying */}
      {/* <div className="text-left mb-10 px-2 md:px-4">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <MdCalendarToday className="text-blue-600" size={18} />
          </div>
          Next Steps - ขั้นตอนต่อไป:
        </h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm text-gray-600">
            <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            <span>รอรับอีเมลยืนยันผลการตรวจสอบภายใน 24-48 ชม.</span>
          </li>
          <li className="flex gap-3 text-sm text-gray-600">
            <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
            <span>เมื่อได้รับอีเมลอนุมัติแล้ว ให้ดาวน์โหลดใบยืนยันการจอง</span>
          </li>
          <li className="flex gap-3 text-sm text-gray-600">
            <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
            <span>นำบัตรนักศึกษาและใบยืนยันมาติดต่อรับกุญแจที่สำนักงานหอพัก</span>
          </li>
        </ul>
      </div> */}

      <div className="flex flex-col md:flex-row gap-3">
        {/* <button
          className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 print:hidden"
          onClick={handlePrint}
        >
          <MdPrint size={20} /> Print Receipt
        </button> */}
        <PrintButton />
        <Link href="/my-booking" className="flex-1 py-4 bg-[#126A31] text-white rounded-2xl font-bold hover:bg-[#093218] shadow-lg shadow-green-100 transition-all">
          Go to My-Bookings
        </Link>
      </div>
    </div>
  );
}

{/* <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center">
  <MdCheckCircle className="text-[#126A31] text-8xl mx-auto mb-6 animate-bounce" />
  <h1 className="text-2xl font-black text-gray-800 mb-2">The evidence has been received / ได้รับหลักฐานเรียบร้อย!</h1>
  <p className="text-gray-500">Our staff is currently reviewing your balance and other information. You will be notified of the result via email within 24 hours.</p>
  <p className="text-gray-400 mb-8">เจ้าหน้าที่กำลังตรวจสอบยอดเงิน และข้อมูลอื่นๆ ของคุณ ระบบจะแจ้งผลทางอีเมลภายใน 24 ชม</p>

  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 mb-8 text-left">
    <p className="text-sm text-emerald-800 font-bold mb-2">Inspection data - ข้อมูลการตรวจสอบ:</p>
    <ul className="text-sm text-emerald-700 space-y-1">
      <li>• สถานะ: <span className="font-bold">VERIFYING - เจ้าหน้าที่กำลังตรวจสอบ</span></li>
      <li>• อีเมลแจ้งเตือน: {formResident.email}</li>
    </ul>
  </div>

  <button onClick={() => window.location.href = "/"} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">
    กลับหน้าหลัก
  </button>
</div> */}