// app/my-booking/BookingHistoryButton.tsx
"use client";

import { useBookingActions } from "@/hooks/useBookingActions";
import { Booking } from "@/utils/types";

// components
import ConfirmModal from "../Loading/ConfirmModal";
import { LoadingOverlay } from "../Loading/LoadingOverlay";

// icons
import { MdLogout } from "react-icons/md";

interface LogoutButtonProp {
  initialBooking: Booking;
}

const LogoutButton = ({ initialBooking }: LogoutButtonProp) => {
  const { modalConfig, isLogout, handleLogout, closeModal } = useBookingActions(
    { bookingId: initialBooking?.id, currentStatus: initialBooking?.status },
  );

  return (
    <>
      {isLogout && <LoadingOverlay message={"Logging out...."} />}

      <ConfirmModal
        {...modalConfig}
        onClose={closeModal}
        onConfirm={modalConfig.action}
        isLoading={isLogout}
      />

      <button
        onClick={handleLogout}
        disabled={isLogout}
        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        title="ออกจากระบบ"
      >
        <MdLogout size={22} />
      </button>
    </>
  );
};

export default LogoutButton;
