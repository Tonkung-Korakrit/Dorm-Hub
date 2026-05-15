// app/new-booking/success/page.tsx
import { getBookingForSucess } from "@/services/booking";
import { notFound } from "next/navigation";

// icons
import { MdCheckCircle, MdEmail, MdPayments, MdInfo } from "react-icons/md";
import { RiHomeSmileFill } from "react-icons/ri";

// components
import Container from "@/components/Container";
import DownloadEvidenceButton from "./components/DownloadEvidenceButton";
import HomeButton from "@/components/HomeButton";

interface BookingSuccessPageProps { 
  searchParams: Promise<{ 
    id: string 
  }> 
}

const BookingSuccessPage = async ({ searchParams }: BookingSuccessPageProps) => {
  const { id } = await searchParams;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) return notFound();

  const data = await getBookingForSucess(bookingId);
  if (!data.success || !data.booking) return notFound();

  const booking = data.booking

  return (
    <Container title="">
      <div className="flex flex-col items-center my-4">
        <div className="relative">
          <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50 scale-150"></div>
          <MdCheckCircle className="relative text-[#126A31] text-7xl animate-bounce" />
        </div>
        <h2 className="mt-4 text-xl font-black text-gray-800">Booking Confirmed!</h2>
        <p className="text-gray-400 text-sm">เราได้รับยอดชำระเงินของคุณเรียบร้อยแล้ว</p>
      </div>

      {/* บัตรรายละเอียด */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl shadow-green-900/5 overflow-hidden mb-6">

        {/* ส่วนบน: รหัสการจอง */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-green-50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking ID</p>
            <p className="text-lg font-black text-gray-800">#TU-B-{booking.id.toString().padStart(5, '0')}</p>
          </div>
          <div className="bg-green-500/10 text-green-600 px-4 py-1.5 rounded-full text-xs font-black">
            Success
          </div>
        </div>

        {/* ส่วนกลาง: รายละเอียดห้อง */}
        <div className="px-8 py-4 space-y-6">

          {/* รายละเอียดราคา */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Amount Paid</span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#126A31]">฿{booking.payments[0]?.amount.toLocaleString()}</span>
              <span className="text-xs font-bold text-gray-300 ml-1">THB</span>
            </div>
          </div>

          <div className="h-px bg-dashed border-t border-dashed border-gray-200"></div>

          {/* ข้อมูลที่พัก */}
          <div className="grid grid-cols-1 gap-6">
            {/* Dormitory & Room Section */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
                <RiHomeSmileFill size={22} />
              </div>
              <div className="flex-1 min-w-0"> {/* เพิ่ม flex-1 และ min-w-0 เพื่อให้ตัดคำได้ */}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dormitory & Room</p>
                <p className="text-sm font-bold text-gray-700 truncate" title={`${booking.room.dorm.campus.name} — ${booking.room.roomId}`}>
                  Campus: {booking.room.dorm.campus.name}
                  <br /> 
                  Room: {booking.room.roomId}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate">
                  Floor {booking.room.floor} • {booking.room.roomType}
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
                <MdEmail size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</p>
                <div className="mt-0.5 space-y-0.5">
                  {/* <p className="text-[12px] font-bold text-gray-700 truncate" title={booking.cus_users?.email}>
                    <span className="text-gray-400 font-medium mr-1">Email:</span>
                    {booking.cus_users?.email}
                  </p> */}
                  <p className="text-[12px] font-bold text-gray-700 break-all" title={booking.cus_users?.email}>
                    <span className="text-gray-400 font-medium mr-1">Email:</span>
                    {booking.cus_users?.email}
                  </p>
                  <p className="text-[12px] font-bold text-gray-700 truncate">
                    <span className="text-gray-400 font-medium mr-1">Phone:</span>
                    {booking.cus_users?.mobilePhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนล่าง: สถานะการตรวจสอบ */}
        <div className="p-4 bg-blue-50 flex items-center justify-center gap-2 border-t border-blue-200">
          <MdInfo className="text-blue-500" size={18} />
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">Status: Verifying - เจ้าหน้าที่กำลังตรวจสอบ</span>
        </div>
      </div>

      {/* กล่องคำเตือนสีส้ม */}
      <div className="px-4 mb-8">
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-center">
          <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
            ระบบจะส่งผลการอนุมัติให้คุณทางอีเมลภายใน <span className="font-bold underline">24-48 ชั่วโมง</span>
          </p>
        </div>
      </div>

      {/* ปุ่ม Action */}
      <div className="flex flex-col md:flex-row gap-4 px-2">
        <DownloadEvidenceButton />
        <HomeButton isSuccess={true} />
      </div>
    </Container>

    // แบบเก่า
    // <Container title="Payment Successful!!! / การชำระเงินสำเร็จแล้ว" >
    //   <div className="flex justify-center mt-4">
    //     <MdCheckCircle className="text-[#126A31] text-8xl mx-auto mb-6 animate-bounce" />
    //   </div>
    //   {/* <h1 className="text-2xl font-black text-gray-800 mb-2">Payment Received!</h1>
    //   <p className="text-gray-500 mb-8">ได้รับยอดชำระค่ามัดจำของท่านเรียบร้อยแล้ว</p> */}

    //   {/* บัตรรายละเอียดการจอง */}
    //   <div className="bg-[#f0f7f0] p-6 rounded-[2rem] border-2 border-[#e0ede0] text-left mb-4">
    //     <div className="grid grid-cols-2 gap-4 text-sm">
    //       <div>
    //         <p className="text-green-700/60 font-bold uppercase text-[10px] tracking-widest">Booking ID</p>
    //         <p className="text-[18px] sm:[20px] font-bold text-gray-800">#TU-B-{booking?.id.toString().padStart(5, '0')}</p>
    //       </div>
    //       <div className="text-right">
    //         <p className="text-green-700/60 font-bold uppercase text-[10px] tracking-widest mb-[2px]">Payment Status</p>
    //         <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-bold">Successful</span>
    //       </div>
    //       <div className="col-span-2 pt-2 border-t border-green-200">
    //         {/* 1. จำนวนเงินที่ชำระ */}
    //         <div className="flex items-center pb-2 border-b border-green-200 gap-3 mb-2">
    //           <MdPayments className="text-amber-500" size={22} />
    //           <div>
    //             <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Paid Amount</p>
    //             <p className="text-sm font-black text-emerald-500">฿ {booking?.payments[0]?.amount?.toLocaleString()}<span className="text-gray-700 font-semibold"> THB</span></p>
    //             {/* <p className="text-sm font-black text-emerald-500">฿ 20<span className="text-gray-700 font-semibold"> THB</span></p> */}
    //           </div>
    //         </div>

    //         {/* 2. ส่วนข้อมูลห้องที่จอง */}
    //         <div className="flex items-center gap-3 mb-2">
    //           <RiHomeSmileFill className="text-green-600" size={20} />
    //           <div>
    //             <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Campus: <span className="font-bold text-[14px] text-gray-700">{booking.room.dorm.campus.name}</span></p>
    //             <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Dorm: <span className="font-bold text-[14px] text-gray-700">{booking.room.dorm?.name}</span> - Room <span className="font-bold text-[14px] text-gray-700">{booking.room.roomId}</span></p>
    //             <p className="text-xs text-gray-500">Floor {booking?.room.floor} | {booking?.room.roomType}</p>
    //           </div>
    //         </div>

    //         {/* 3. ส่วนข้อมูลการติดต่อ (Email) */}
    //         {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl"> */}
    //         <div className="col-span-2 pt-2 border-t border-green-200">
    //           <div className="flex items-center pb-2 border-b border-green-200 gap-3 mb-2">
    //             <MdEmail className="text-red-500" size={22} />
    //             <div>
    //               <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Email Notification</p>
    //               <p className="text-sm font-bold text-gray-700 break-all">{booking.cus_users?.email}</p>
    //             </div>
    //           </div>

    //           {/* 4. ส่วนสถานะการจอง (Booking Status) */}
    //           <div className="flex items-center gap-3 mb-2">
    //             <MdInfo className="text-blue-500" size={22} />
    //             <div>
    //               <p className="text-green-700/80 font-bold uppercase text-[10px] tracking-widest">Booking Status</p>
    //               <p className="text-sm font-bold text-emerald-700">VERIFYING - รอตรวจสอบ</p>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>

    //   <div className="px-2 md:px-10 pb-8 space-y-4 text-center">
    //     <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
    //       <p className="text-sm text-amber-800 leading-relaxed font-medium">
    //         <span className="font-black">Currently:</span> เจ้าหน้าที่กำลังตรวจสอบข้อมูลของท่าน
    //         ระบบจะส่งผลการอนุมัติการจองของท่านให้ทางอีเมลภายใน <span className="underline">24-48 ชั่วโมง</span>
    //       </p>
    //     </div>
    //     <p className="text-[12px] text-gray-400 italic">
    //       Our staff is currently reviewing your information. You will be notified of the official booking result via email within 24-48 hours.
    //     </p>
    //   </div>

    //   {/* คำแนะนำเพิ่มเติม - ปรับให้เข้ากับสถานะ Verifying */}
    //   {/* <div className="text-left mb-10 px-2 md:px-4">
    //     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
    //       <div className="p-1.5 bg-blue-100 rounded-lg">
    //         <MdCalendarToday className="text-blue-600" size={18} />
    //       </div>
    //       Next Steps - ขั้นตอนต่อไป:
    //     </h3>
    //     <ul className="space-y-3">
    //       <li className="flex gap-3 text-sm text-gray-600">
    //         <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
    //         <span>รอรับอีเมลยืนยันผลการตรวจสอบภายใน 24-48 ชม.</span>
    //       </li>
    //       <li className="flex gap-3 text-sm text-gray-600">
    //         <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
    //         <span>เมื่อได้รับอีเมลอนุมัติแล้ว ให้ดาวน์โหลดใบยืนยันการจอง</span>
    //       </li>
    //       <li className="flex gap-3 text-sm text-gray-600">
    //         <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
    //         <span>นำบัตรนักศึกษาและใบยืนยันมาติดต่อรับกุญแจที่สำนักงานหอพัก</span>
    //       </li>
    //     </ul>
    //   </div> */}

    //   <div className="flex flex-col md:flex-row gap-3">
    //     <PrintButton />
    //     <HomeButton isSuccess={true} />
    //   </div>
    // </Container>
  )
}

export default BookingSuccessPage