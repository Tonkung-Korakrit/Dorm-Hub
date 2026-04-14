// app/my-booking/BookingHistory.tsx
"use client";

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { MyBookingResponse } from '@/utils/types';

// hooks
import { useBookingActions } from "@/hooks/useBookingActions";

// components
import EmptyBooking from "@/components/History/EmptyBooking";
import BookingActions from "@/components/History/BookingActions";
import RoomInfo from "@/components/History/RoomInfo";
import ResidentInfo from "@/components/History/ResidentInfo";
import RoommatesInfo from '@/components/History/RoommatesInfo';
import ConfirmModal from "@/components/Loading/ConfirmModal";
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";
import Container from '@/components/Container';
import Header from '@/components/History/Header';
import { useSearchParams } from 'next/navigation';

interface BookingHistoryProps {
  initialBooking: MyBookingResponse;
}

const BookingHistory = ({ initialBooking }: BookingHistoryProps) => {
  const {
    modalConfig, isLogout, state, isCancelling,
    handleLogout, openCancelModal, closeModal
  } = useBookingActions(initialBooking?.id, initialBooking?.status);

  // const searchParams = useSearchParams();
  // const editId = searchParams.get("edit");

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message || "ทำรายการสำเร็จแล้ว", {
        id: "cancel-success",
        duration: 1000,
        style: {
          borderRadius: '10px',
          background: '#C0EDD0',
          color: '#000',
        },
      });
    } else {
      toast.error(state.message || "เกิดข้อผิดพลาด กรุณาลองใหม่", {
        id: "cancel-error",
        duration: 1000,
        style: {
          borderRadius: '10px',
          background: '#FFA9A9',
          color: '#000',
        },
      });
    }
  }, [state])

  // if (!initialBooking || !initialBooking.id) {
  //   return (
  //     <EmptyBooking
  //       newBookingHref="/new-booking"
  //       handleLogout={handleLogout}
  //       isLogout={isLogout}
  //     />
  //   );
  // }

  return (
    <Container
      title=""
      isEmptyPage={(!initialBooking.id) ? true : false}
    >
      {(isLogout || isCancelling) && <LoadingOverlay
        message={isLogout ? "Logging out...." : "Cancelling your booking...."}
      />}

      <ConfirmModal
        {...modalConfig}
        onClose={closeModal}
        onConfirm={modalConfig.action}
        isLoading={isCancelling || isLogout}
      />

      {/* <RejectedAlert editId={editId} /> */}

      <Header
        handleLogout={handleLogout}
        isLogout={isLogout}
      />

      {(!initialBooking.id) ? (
        <EmptyBooking
          newBookingHref="/new-booking"
        />
      ) : (
        <>
          <RoomInfo booking={initialBooking} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <ResidentInfo booking={initialBooking} />
            <RoommatesInfo booking={initialBooking} />
          </div>

          <div className="mt-8 flex justify-center">
            <BookingActions
              booking={initialBooking}
              openCancelModal={openCancelModal}
              isCancelling={isCancelling}
              newBookingHref="/new-booking"
              paymentHref={`/payment/${initialBooking?.id}`}
              editHref={`/new-booking?edit=${initialBooking?.id}`}
            />
          </div>
        </>
      )}
    </Container>
  )
}

export default BookingHistory