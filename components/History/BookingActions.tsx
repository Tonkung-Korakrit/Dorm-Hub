// app/my-booking/BookingActions.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

import toast from "react-hot-toast";
import { Booking, BookingStatus } from "@/utils/types";
import { useBookingActions } from "@/hooks/useBookingActions";

// components
import ConfirmModal from "@/components/Loading/ConfirmModal";
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";
import LineLinkPrompt from "@/components/History/LineLinkPrompt";

// icons
import { RiHomeSmileFill } from "react-icons/ri";
import { MdClose, MdEdit, MdInfoOutline, MdPayment } from "react-icons/md";

const BookingActions = ({ initialBooking }: { initialBooking: Booking }) => {
  const { modalConfig, state, isCancelling, openCancelModal, closeModal } =
    useBookingActions({
      bookingId: initialBooking.id,
      currentStatus: initialBooking.status,
    });

  const newBookingHref = "/new-booking";
  const paymentHref = `/payment/${initialBooking.id}`;
  const editHref = `/new-booking?edit=${initialBooking.id}`;

  // const searchParams = useSearchParams();
  // const editId = searchParams.get("edit");

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message || "ทำรายการสำเร็จแล้ว", {
        id: "cancel-success",
        duration: 1000,
        style: {
          borderRadius: "10px",
          background: "#C0EDD0",
          color: "#000",
        },
      });
    } else {
      toast.error(state.message || "เกิดข้อผิดพลาด กรุณาลองใหม่", {
        id: "cancel-error",
        duration: 1000,
        style: {
          borderRadius: "10px",
          background: "#FFA9A9",
          color: "#000",
        },
      });
    }
  }, [state]);

  const isCheckedOut =
    initialBooking.status === BookingStatus.COMPLETED &&
    initialBooking.hasCheckout;

  // 1. สร้างด่านตรวจสี และข้อความ (Configuration)
  const getStatusConfig = (status) => {
    if (status === BookingStatus.COMPLETED && initialBooking.hasCheckout) {
      return {
        containerClass: "bg-green-50 border-green-100",
        iconContainer: "bg-green-100 text-green-500",
        icon: <RiHomeSmileFill size={20} />,
        title: "Stay Completed",
        titleTh: "สิ้นสุดการเข้าพัก",
        titleClass: "text-green-800",
      };
    }

    if (status === BookingStatus.COMPLETED && !initialBooking.hasCheckin) {
      return {
        containerClass: "bg-blue-50 border-blue-100",
        iconContainer: "bg-blue-100 text-blue-500",
        icon: <MdInfoOutline size={20} />,
        title: "Action Required",
        titleTh: "กรุณารับกุญแจ",
        titleClass: "text-blue-800",
      };
    }

    if (
      status === BookingStatus.COMPLETED &&
      initialBooking.hasCheckin &&
      !initialBooking.hasCheckout
    ) {
      return {
        containerClass: "bg-indigo-50 border-indigo-100", // ใช้สีคราม/น้ำเงินให้ความรู้สึกมั่นคง/ดูแล
        iconContainer: "bg-indigo-100 text-indigo-500",
        icon: <RiHomeSmileFill size={20} />,
        title: "Currently Staying",
        titleTh: "กำลังเข้าพัก",
        titleClass: "text-indigo-800",
      };
    }

    switch (status) {
      case BookingStatus.CANCELLED:
      case BookingStatus.EXPIRED:
      case BookingStatus.REJECTED:
        return {
          containerClass: "bg-green-50 border-green-100",
          iconContainer: "bg-green-100 text-green-500",
          icon: <RiHomeSmileFill size={20} />,
          title: "New Booking",
          titleTh: "เริ่มจองใหม่",
          titleClass: "text-green-800",
        };
      case BookingStatus.PENDING_CORRECTION:
        return {
          containerClass: "bg-orange-50 border-orange-100",
          iconContainer: "bg-orange-100 text-orange-500",
          icon: <MdInfoOutline size={20} />,
          title: "Action Required",
          titleTh: "กรุณาแก้ไขข้อมูล",
          titleClass: "text-orange-800",
        };

      case BookingStatus.PENDING:
        return {
          containerClass: "bg-orange-50 border-orange-100",
          iconContainer: "bg-orange-100 text-orange-500",
          icon: <MdInfoOutline size={20} />,
          title: "Please make the Payment",
          titleTh: "กรุณาชำระเงินค่ามัดจำ",
          titleClass: "text-orange-800",
        };
      case BookingStatus.VERIFYING: // VERIFYING
        return {
          containerClass: "bg-red-50 border-red-100",
          iconContainer: "bg-red-100 text-red-500",
          icon: <MdInfoOutline size={20} />,
          title: "Cancellation",
          titleTh: "สละสิทธิ์การจอง",
          titleClass: "text-gray-800",
        };
      default:
        return null;
    }
  };

  const getDeadlineDate = (startDate: string | Date) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const config = getStatusConfig(initialBooking.status);
  const showActions =
    [
      "PENDING",
      "VERIFYING",
      "CANCELLED",
      "REJECTED",
      "EXPIRED",
      "PENDING_CORRECTION",
      "COMPLETED",
    ].includes(initialBooking.status) || isCheckedOut;

  if (!showActions) return null;

  return (
    <>
      {isCancelling && <LoadingOverlay message={"Cancelling...."} />}

      <ConfirmModal
        {...modalConfig}
        onClose={closeModal}
        onConfirm={modalConfig.action}
        isLoading={isCancelling}
      />

      <div className="mt-6 flex justify-center">
        <div
          className={`flex flex-col md:flex-row justify-center items-center p-2 gap-4 rounded-2xl border transition-colors duration-300 ${config.containerClass}`}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className={`mt-2 p-2 rounded-lg ${config.iconContainer}`}>
              {config.icon}
            </div>

            <div className="text-left pt-2">
              <h5
                className={`font-bold text-[12px] mb-1 uppercase tracking-wider flex items-center gap-2 ${config.titleClass}`}
              >
                {config.title}
                <span className="text-gray-500 font-medium font-thai">
                  / {config.titleTh}
                </span>
              </h5>

              <div className="text-[12px] leading-relaxed">
                {/* กดยกเลิกเอง หรือหมดเวลาชำระเงิน */}
                {["CANCELLED", "EXPIRED"].includes(initialBooking.status) && (
                  <p className="text-gray-600">
                    Your booking has been cancelled. You can now make a new
                    reservation.
                    <span className="block text-[11px] text-gray-500 italic font-thai">
                      รายการจองถูกยกเลิกแล้ว คุณสามารถเริ่มจองใหม่ได้ทันที
                    </span>
                  </p>
                )}

                {/* กำลังรอชำระเงินค่ามัดจำ */}
                {initialBooking.status === BookingStatus.PENDING && (
                  <p className="text-gray-700 font-semibold">
                    Note: Please pay the deposit before the deadline.
                    <span className="block text-[11px] text-gray-500 italic font-thai">
                      กรุณาชำระเงินค่ามัดจำ ก่อนจะหมดเวลาตามที่กำหนด
                    </span>
                  </p>
                )}

                {/* กำลังรอตรวจสอบ */}
                {initialBooking.status === BookingStatus.VERIFYING && (
                  <p className="text-gray-700 font-semibold">
                    Note: Deposit is non-refundable upon cancellation.
                    <span className="block text-[11px] text-gray-500 italic font-thai">
                      การยกเลิกตอนนี้จะทำให้ 'ไม่ได้รับเงินมัดจำคืน'
                    </span>
                  </p>
                )}

                {initialBooking.status === BookingStatus.COMPLETED &&
                  !initialBooking.hasCheckin && (
                    <p className="text-blue-700 font-semibold">
                      Please pick up your key by{" "}
                      <span className="underline">
                        {getDeadlineDate(initialBooking.createdAt)}
                      </span>
                      .
                      <span className="block text-[11px] text-blue-500 italic font-thai">
                        กรุณามาติดต่อรับกุญแจก่อนวันที่{" "}
                        {getDeadlineDate(initialBooking.createdAt)} (ภายใน 7
                        วัน) มิเช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ
                      </span>
                    </p>
                  )}

                {initialBooking.status === BookingStatus.COMPLETED &&
                  initialBooking.hasCheckin &&
                  !initialBooking.hasCheckout && (
                    <div className="text-gray-700">
                      <p className="font-semibold">
                        Enjoy your stay!
                        <span className="block text-[11px] text-indigo-500 italic font-thai">
                          ขอให้มีความสุขกับการเข้าพัก! หากต้องการแจ้งย้ายออก
                          (Checkout) หรือสอบถามเพิ่มเติม โปรดติดต่อเจ้าหน้าที่ ณ
                          เคาน์เตอร์ หรือผ่านช่องทาง LINE
                        </span>
                      </p>
                    </div>
                  )}

                {/* ถูกตีกลับมาให้แก้ไขอีกครั้ง */}
                {/* ถูกตีกลับมาให้แก้ไขอีกครั้ง */}
                {initialBooking.status === BookingStatus.PENDING_CORRECTION && (
                  <div className="mt-1 space-y-3">
                    {/* ส่วนของเหตุผลจาก Admin */}
                    <div className="p-3 bg-white/60 border border-orange-200 rounded-xl shadow-sm">
                      <p className="text-[11px] font-bold text-orange-800 uppercase mb-1">
                        Reason from Admin:
                      </p>
                      <p className="text-[13px] text-orange-900 font-thai italic">
                        "
                        {initialBooking.remark ||
                          "ข้อมูลไม่ถูกต้อง เนื่องจาก..."}
                        "
                      </p>
                    </div>

                    {/* ส่วนของวันที่กำหนดส่ง (Deadline) */}
                    <p className="text-orange-700 font-semibold">
                      Please resubmit by{" "}
                      <span className="underline">
                        {getDeadlineDate(initialBooking.createdAt)}
                      </span>
                      .
                      <span className="block text-[11px] text-orange-500 italic font-thai">
                        กรุณาแก้ไขและส่งข้อมูลใหม่ก่อนวันที่{" "}
                        {getDeadlineDate(initialBooking.createdAt)} (ภายใน 7
                        วัน) มิเช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ
                      </span>
                    </p>
                  </div>
                )}

                {/* ถูกปฏิเสธการจอง */}
                {initialBooking.status === BookingStatus.REJECTED && (
                  <div className="mt-1 p-3 bg-white/60 border border-red-200 rounded-xl shadow-sm">
                    <p className="text-[11px] font-bold text-red-800 uppercase mb-1">
                      Reason from Admin:
                    </p>
                    <p className="text-[13px] text-red-900 font-medium font-thai">
                      "
                      {initialBooking.remark || "ข้อมูลไม่ถูกต้อง เนื่องจาก..."}
                      "
                    </p>
                  </div>
                )}

                {isCheckedOut && (
                  <p className="text-gray-600">
                    You have checked out successfully. You can now make a new
                    reservation.
                    <span className="block text-[11px] text-gray-500 italic font-thai">
                      คุณได้ย้ายออกเรียบร้อยแล้ว สามารถเริ่มจองใหม่ได้ทันที
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* ปุ่มยกเลิก */}
            {initialBooking.status === BookingStatus.VERIFYING && (
              <button
                onClick={openCancelModal}
                disabled={isCancelling}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-2.5 text-white bg-red-500 hover:bg-red-50 border border-red-100 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50"
              >
                <MdClose size={18} />
                {isCancelling ? "Cancelling..." : "Cancel Booking / ยกเลิก?"}
              </button>
            )}

            {/* ปุ่มจ่ายเงิน */}
            {initialBooking.status === BookingStatus.PENDING && (
              <Link
                href={paymentHref}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-2.5 text-white bg-yellow-500 hover:opacity-[80%] rounded-xl text-sm font-black transition-all shadow-lg shadow-green-100"
              >
                <MdPayment size={18} />
                Pay Now / ชำระเงิน
              </Link>
            )}

            {/* ปุ่มจองใหม่ */}
            {(["CANCELLED", "EXPIRED", "REJECTED"].includes(
              initialBooking.status,
            ) ||
              isCheckedOut) && (
              <Link
                href={newBookingHref}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-3 bg-[#006633] hover:opacity-[80%] text-white rounded-xl text-sm font-black transition-all shadow-md"
              >
                <RiHomeSmileFill size={20} />
                Book Again / จองใหม่
              </Link>
            )}

            {/* ปุ่มแก้ไข */}
            {initialBooking.status === BookingStatus.PENDING_CORRECTION && (
              <Link
                href={editHref}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-100"
              >
                <MdEdit size={24} />
                Edit / แก้ไขข้อมูล
              </Link>
            )}
          </div>
        </div>
      </div>

      <LineLinkPrompt booking={initialBooking} />
    </>
  );
};

export default BookingActions;
