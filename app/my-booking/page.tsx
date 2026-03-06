// app/my-booking/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { DORM_LABELS } from "@/lib/constants";
import ConfirmModal from "../loading/components/ConfirmModal";
import { LoadingOverlay } from "../loading/components/LoadingOverlay";
import { LoginSkeleton } from "../loading/components/login/LoginSkeleton";

import { FaUser } from "react-icons/fa";
import { FaUsersLine } from "react-icons/fa6";
import { Booking, BookingStatus } from "@/types/booking";
import { customFetch } from "@/lib/custom-api";
import { RiHomeSmileFill } from "react-icons/ri";
import { MdLogout, MdInfoOutline, MdCircle, MdClose, MdPayment, MdEdit } from "react-icons/md";

export default function StudentBooking() {
  // const { Booking } = useBooking();
  const [booking, setBooking] = useState<Booking>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLogout, setIsLogout] = useState(false);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "danger" | "warning";
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    action: () => void;
  }>({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    action: () => { },
  });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await customFetch("/api/bookings/my-booking");
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [router]);

  // console.log(booking)

  const openLogoutModal = () => {
    setModalConfig({
      isOpen: true,
      type: "danger",
      title: "Sign Out / ออกจากระบบ",
      message: "Are you sure you want to sign out of your account?\n" +
        "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบในขณะนี้?",
      confirmText: "Sign Out / ออกจากระบบ",
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));

        // 2. เริ่มแสดง Loading คลุมทั้งหน้า
        setIsLogout(true);

        try {
          await fetch("/api/auth/logout", { method: "POST" });
          await signOut({ redirect: false });
          router.push("/");
        } catch (error) {
          console.error(error);
          setIsLogout(false);
        }
      },
    });
  };

  const openCancelModal = () => {
    const isPaid = booking.status === "VERIFYING";

    setModalConfig({
      isOpen: true,
      type: "warning",
      title: "Confirm Cancellation / ยืนยันการยกเลิก",
      message: isPaid
        ? "Important: Deposit is Non-Refundable\n" +
        "As you have already paid the deposit, please be aware that it will not be refunded upon cancellation.\n" +
        "หมายเหตุสำคัญ: ไม่คืนเงินมัดจำ\n" +
        "เนื่องจากคุณชำระเงินมัดจำแล้ว การยกเลิกจะทำให้ไม่ได้รับเงินคืนตามระเบียบของหอพัก"
        : "Are you sure you want to cancel this booking?\n" +
        "This room will be returned to the system for others to book.\n\n" +
        "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? ห้องพักจะถูกคืนเข้าสู่ระบบเพื่อให้ผู้ใช้อื่นจองต่อ",
      confirmText: "Confirm Cancellation / ยืนยันการยกเลิก",
      cancelText: "Keep Booking / รักษาการจอง",
      action: handleCancelBookingAction,
    });
  };

  const handleCancelBookingAction = async () => {
    setIsCancelling(true);
    try {
      const res = await customFetch(`/api/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      alert("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setIsCancelling(false);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    }
  };

  // const currentStatus = booking?.booking_logs?.[0]?.status || "PENDING";

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 text-white border-blue-100";
      case "VERIFYING":
        return "bg-blue-500 text-white border-purple-100";
      case "COMPLETED":
        return "bg-emerald-500 text-white border-emerald-100";
      case "REJECTED":
        return "bg-red-500 text-white border-red-100";
      case "EXPIRED":
        return "bg-slate-500 text-white border-orange-100";
      default:
        return "bg-slate-500 text-white border-slate-100";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-200";
      case "VERIFYING": return "text-blue-200";
      case "COMPLETED": return "text-emerald-200";
      case "REJECTED": return "text-red-200";
      case "EXPIRED": return "text-orange-200";
      default: return "text-slate-200";
    }
  };

  if (isLoading || isRedirecting) return <LoginSkeleton />;

  // console.log("Booking: ", booking);

  return (
    <div className="min-h-screen py-10">
      {isLogout && <LoadingOverlay message="Logging out...." />}
      {isCancelling && <LoadingOverlay message="Cancelling booking...." />}
      <ConfirmModal
        {...modalConfig}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.action}
        isLoading={isCancelling}
      />
      <div className="max-w-3xl mx-auto bg-white p-4 md:p-10 rounded-2xl shadow-md border border-gray-200 animate-in fade-in duration-700">

        {/* Header Section */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
          <div>
            <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Booking <span className="text-[#006633]">Status</span></h1>
            <p className="text-gray-500 text-[12px] font-medium mt-1">ตรวจสอบ และจัดการข้อมูลการจองห้องพักได้ที่นี่</p>
          </div>
          <button
            onClick={openLogoutModal}
            disabled={isLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="ออกจากระบบ"
          >
            {isLogout ? (
              // ในปุ่มโชว์แค่ไอคอนหมุนเล็กๆ (หรือจะไม่โชว์ก็ได้เพราะมี Overlay แล้ว)
              <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <MdLogout size={22} />
            )}
          </button>
        </div>

        {error ? (
          <div className="py-10 text-center">
            <MdInfoOutline size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-[#006633] font-bold text-sm underline">ลองใหม่อีกครั้ง</button>
          </div>
        ) : !booking || !booking.id ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-green-50 text-[#006633] rounded-full flex items-center justify-center mb-6 shadow-inner">
              <RiHomeSmileFill size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h2>
            <p className="text-gray-400 mb-10 text-sm max-w-xs mx-auto">
              ดูเหมือนว่าคุณจะยังไม่มีรายการจองห้องพักในภาคเรียนนี้ เริ่มจองห้องพักของคุณได้ง่ายๆ เพียงกดปุ่มด้านล่าง
            </p>
            <button
              onClick={() => {
                setIsRedirecting(true);
                router.push('/new-booking')
              }}
              disabled={isRedirecting}
              className="w-full sm:w-auto min-w-[200px] bg-[#006633] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-[#004d26] active:scale-95 transition-all disabled:opacity-50"
            >
              {isRedirecting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                "Book your room now - จองห้องพักทันที"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Room Info Card */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
              <div className={`px-6 py-3 flex justify-between items-center text-[16px] font-black uppercase tracking-widest border-b ${getStatusStyles(booking.status)}`}>
                <div className="flex items-center gap-2">
                  <MdCircle
                    size={8}
                    className={`${getStatusDotColor(booking.status)} ${["PENDING", "VERIFYING"].includes(booking.status) ? "animate-pulse" : ""
                      }`}
                  />
                  {booking.status}
                </div>
                <span className="text-white">#{booking.id}</span>
              </div>

              <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* ไอคอนห้องพัก */}
                <div className={`w-24 h-24 ${getStatusStyles(booking.status)} rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-gray-50 shrink-0 transform md:-rotate-3`}>
                  <RiHomeSmileFill size={48} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-end md:gap-4 mb-4">
                    <h2 className="text-[52px] md:text-7xl font-black text-gray-900 tracking-tighter leading-none">
                      {booking.room.roomId}
                    </h2>
                    <span className="text-xs font-bold text-gray-500 md:mb-2 uppercase tracking-widest">Selected Unit</span>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                    <Tag label={`Floor / ชั้น: ${booking.room.floor}`} />
                    <Tag label={`Zone / โซน: ${booking.room.dorm}`} />
                    <Tag
                      label={`Campus / วิทยาเขต: ${DORM_LABELS.CAMPUS[booking.room.campus as keyof typeof DORM_LABELS.CAMPUS] || booking.room.campus}`}
                      className={`${getStatusStyles(booking.status)} text-white border-none shadow-sm`}
                    />
                    <Tag label={`Room Type / ประเภทห้อง: ${DORM_LABELS.ROOM_TYPES[booking.room.roomType as keyof typeof DORM_LABELS.ROOM_TYPES]?.label || booking.room.roomType}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Resident & Lifestyle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* ฝั่งซ้าย: Profile */}
              <div className="flex flex-col">
                <h4 className="text-gray-900 font-bold text-sm flex items-center gap-2 mb-3">
                  <FaUser className="text-[#006633] text-lg" />Resident Information
                </h4>
                <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 space-y-3 h-full">
                  <InfoRow label="Student ID / เลขประจำตัวนักศึกษา" value={booking?.cus_users?.studentId} />
                  <InfoRow label="Name / ชื่อ-นามสกุล" value={`${booking?.cus_users?.name_en} - ${booking?.cus_users?.name_th}`} />
                  <InfoRow label="Type of Booking / ประเภทการจอง" value={DORM_LABELS.RESIDENT_TYPE[booking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || booking?.type} />
                  <InfoRow label="Email / อีเมล" value={booking?.cus_users?.email} />
                  <InfoRow label="Phone / เบอร์ติดต่อ" value={booking?.cus_users?.mobilePhone} />
                  <InfoRow label="Gender / เพศ" value={DORM_LABELS.GENDER[booking?.cus_users?.gender as keyof typeof DORM_LABELS.GENDER] || booking?.cus_users?.gender} />
                  <InfoRow label="Scholarship Student / นักศึกษาทุน" value={booking?.cus_users?.isScholarshipStudent ? "Yes" : "No"} />
                  <InfoRow label="Disabled Student / นักศึกษาพิการ" value={booking?.cus_users?.isDisabled ? "Yes" : "No"} />
                  <InfoRow label="Faculty / คณะ" value={booking?.cus_users?.faculty_department} />
                </div>
              </div>

              {/* ฝั่งขวา: Lifestyle */}
              <div className="flex flex-col">
                <h4 className="text-gray-900 font-bold text-sm flex items-center gap-2 mb-3">
                  <FaUsersLine className="text-[#006633]" size={24} /> Roommate Preference
                </h4>
                <div className="bg-gray-100 p-2 rounded-3xl border border-gray-200 h-full">
                  <div className="flex flex-wrap gap-2">
                    {booking.cus_users.lifestyle?.length > 0 ? (
                      booking.cus_users.lifestyle.map((v: string) => {
                        const config = DORM_LABELS.LIFESTYLE[v as keyof typeof DORM_LABELS.LIFESTYLE];
                        if (!config) return <span key={v} className="px-3 py-1.5 bg-white text-gray-500 rounded-xl text-[10px] font-bold border border-gray-100">#{v}</span>;
                        const Icon = config.icon;
                        return (
                          <span key={v} className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#006633] rounded-xl text-[10px] font-bold border border-green-100 shadow-sm transition-transform hover:scale-105">
                            <Icon size={14} />
                            {/* {config.label.split(' - ')[1]} */}
                            {config.label}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-[12px] italic py-2">ไม่มีข้อมูลไลฟ์สไตล์</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(["PENDING", "VERIFYING", "CANCELLED", "REJECTED", "EXPIRED"].includes(booking.status)) && (
              <div className={`flex flex-col md:flex-row justify-between items-center gap-4 -mx-4 md:-mx-10 px-4 md:px-10 pb-6 md:pb-4 rounded-b-2xl transition-colors duration-300
              ${(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? "bg-gray-50/80 border-gray-100" :
                  booking.status === BookingStatus.REJECTED ? "bg-amber-50/40 border-amber-100" : "bg-red-50/30 border-red-50"}
              `}>

                {/* --- ส่วนข้อความ (Left Side) --- */}
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-2 p-2 rounded-lg 
                      ${(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? "bg-gray-200 text-gray-500" :
                      booking.status === BookingStatus.REJECTED ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                    {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? <RiHomeSmileFill size={20} /> : <MdInfoOutline size={20} />}
                  </div>

                  <div className="text-left pt-2">
                    <h5 className={`font-bold text-[14px] mb-1 uppercase tracking-wider flex items-center gap-2 
                      ${(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? "text-gray-600" :
                        booking.status === BookingStatus.REJECTED ? "text-amber-700" : "text-gray-900"}`}>
                      {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? "New Booking" :
                        booking.status === BookingStatus.REJECTED ? "Action Required" : "Cancellation"}
                      <span className="text-gray-400 font-medium font-thai">
                        / {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) ? "เริ่มจองใหม่" :
                          booking.status === BookingStatus.REJECTED ? "กรุณาแก้ไขข้อมูล" : "สละสิทธิ์การจอง"}
                      </span>
                    </h5>

                    <div className="flex flex-col gap-1">
                      {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) && (
                        <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                          Your booking has been cancelled. You can now make a new reservation.
                          <span className="block text-[11px] text-gray-400 italic font-thai">รายการจองถูกยกเลิกแล้ว คุณสามารถเริ่มทำรายการจองใหม่ได้ทันที</span>
                        </p>
                      )}
                      {booking.status === BookingStatus.PENDING && (
                        <p className="text-[12px] text-gray-700 font-semibold leading-relaxed">
                          Relinquish your booking to return the room to the system.
                          <span className="block text-[11px] text-gray-400 italic font-medium font-thai">สละสิทธิ์เพื่อคืนห้องพักกลับเข้าสู่ระบบ เพื่อให้ผู้อื่นสามารถจองต่อได้</span>
                        </p>
                      )}
                      {booking.status === BookingStatus.VERIFYING && (
                        <p className="text-[12px] text-gray-700 font-semibold leading-relaxed">
                          Note: Deposit is non-refundable upon cancellation.
                          <span className="block text-[11px] text-gray-400 italic font-medium font-thai">เนื่องจากชำระเงินแล้ว การยกเลิกตอนนี้จะทำให้ 'ไม่ได้รับเงินมัดจำคืน'</span>
                        </p>
                      )}
                      {booking.status === BookingStatus.REJECTED && (
                        <div className="mt-1 p-3 bg-white/60 border border-amber-200 rounded-xl shadow-sm">
                          <p className="text-[11px] font-bold text-amber-800 uppercase mb-1">Reason from Admin:</p>
                          <p className="text-[13px] text-amber-900 font-medium leading-relaxed font-thai">
                            "{booking.remark || "ข้อมูลไม่ถูกต้องตามเงื่อนไข กรุณาตรวจสอบอีกครั้ง"}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- ส่วนปุ่ม (Right Side) --- */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                  {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.VERIFYING) && (
                    <button
                      onClick={openCancelModal}
                      disabled={isCancelling}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-2.5 text-red-500 bg-white hover:bg-red-50 border border-red-100 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isCancelling ? <LoadingOverlay message="Cancelling..." /> : <MdClose size={18} />}
                      Cancel Booking / ยกเลิกการจอง?
                    </button>
                  )}

                  {booking.status === BookingStatus.PENDING && (
                    <button
                      onClick={() => router.push(`/payment/${booking.id}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-2.5 text-white bg-[#91b838] hover:bg-[#7a9b2f] rounded-xl text-sm font-black transition-all shadow-lg shadow-green-100"
                    >
                      <MdPayment size={18} />
                      Pay Now / ชำระเงิน
                    </button>
                  )}

                  {(booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) && (
                    <button
                      onClick={() => router.push('/new-booking')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-3 bg-[#91b838] hover:bg-[#7a9b2f] text-white rounded-xl text-sm font-black transition-all shadow-md"
                    >
                      <RiHomeSmileFill size={18} />
                      Book Again / จองใหม่อีกครั้ง
                    </button>
                  )}

                  {booking.status === BookingStatus.REJECTED && (
                    <button
                      onClick={() => router.push(`/new-booking?edit=${booking.id}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-100"
                    >
                      <MdEdit size={18} />
                      Edit & Resubmit / แก้ไขข้อมูล
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* <div className="mt-10 text-center">
          <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">Thammasat University Dormitory Management</p>
        </div> */}

      </div>
    </div >
  );
}

function InfoRow({ label, value }: { label: string, value: any }) {
  if (!value) return (
    <div className="flex justify-between items-baseline gap-6 py-2 border-b border-gray-50 last:border-0">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">{label}</dt>
      <dd className="text-gray-500 font-normal">-</dd>
    </div>
  );

  const safeValue = String(value).trim();
  const labelParts = label.split(" / ");

  // --- Logic การแยกบรรทัด ---
  let mainValue = safeValue;
  let subValue = "";

  if (safeValue.includes(" - ")) {
    // กรณีชื่อ อังกฤษ - ไทย
    [mainValue, subValue] = safeValue.split(" - ");
  } else if (safeValue.includes(" สาขา")) {
    // กรณี คณะ สาขาวิชา... (ตัดที่คำว่า " สาขา")
    const index = safeValue.indexOf(" สาขา");
    mainValue = safeValue.substring(0, index);
    subValue = safeValue.substring(index).trim(); // เก็บคำว่า "สาขา..." ไว้ด้วย
  }

  return (
    <div className="flex justify-between items-baseline gap-6 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 w-1/3 leading-tight">
        {labelParts.map((part, index) => (
          <span key={index} className="block">
            {part.trim()}
            {index < labelParts.length - 1 && "/"}
          </span>
        ))}
      </dt>

      {/* Value: แสดงผลแบบ 2 บรรทัดถ้ามีข้อมูลย่อย */}
      <dd className="text-[12px] font-semibold text-gray-800 text-right flex-1">
        {subValue ? (
          <div className="flex flex-col">
            <span className="text-gray-900 leading-tight">{mainValue}</span>
            <span className="text-[12px] text-gray-500 font-medium leading-tight mt-0.5">
              {subValue}
            </span>
          </div>
        ) : (
          mainValue
        )}
      </dd>
    </div>
  );
}

function Tag({ label, className = "bg-white text-gray-500 border-gray-200" }: { label: string, className?: string }) {
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${className}`}>
      {label}
    </span>
  );
}