// app/my-booking/page.tsx
// "use server"

import { getMyBooking } from "@/services/booking";

// components
import Container from "@/components/Container";
import LogoutButton from "@/components/History/LogoutButton";
import EmptyBooking from "@/components/History/EmptyBooking";
import RoomInfo from "@/components/History/RoomInfo";
import ResidentInfo from "@/components/History/ResidentInfo";
import RoommatesInfo from "@/components/History/RoommatesInfo";
import BookingActions from "@/components/History/BookingActions";

export const metadata = {
  title: "My booking | DormHub",
  description: "ตรวจสอบสถานะการจองหอพักของคุณ",
};

const MyBookingPage = async () => {
  const initialBooking = await getMyBooking(); // ดึงข้อมูลจาก Backend (Server action)

  // console.log("initialBooking on my-booking: ", initialBooking)

  // 1. ถ้าไม่เคยมีการจองเลย แสดงหน้าเริ่มต้นการจองทันที
  if (!initialBooking || !initialBooking.id) {
    return (
      <Container title="" isEmptyPage={true}>
        <div className="flex justify-between items-center mb-2 border-b border-gray-100">
          <div className="flex flex-col">
            <h1 className="text-[24px] font-black text-gray-900 tracking-tight">
              Booking <span className="text-[#006633]">Status</span>
            </h1>
            <p className="text-gray-500 text-[12px] font-medium ml-2 mt-1">
              จัดการข้อมูลการจองได้ที่นี่
            </p>
          </div>
          <LogoutButton initialBooking={initialBooking} />
        </div>
        <EmptyBooking newBookingHref="/new-booking" />
      </Container>
    );
  }

  return (
    <Container title="" isEmptyPage={false}>
      <div className="flex justify-between items-center mb-2 border-b border-gray-100">
        <div className="flex flex-col">
          <h1 className="text-[24px] font-black text-gray-900 tracking-tight">
            Booking <span className="text-[#006633]">Status</span>
          </h1>
          <p className="text-gray-500 text-[12px] font-medium ml-2 mt-1">
            จัดการข้อมูลการจองได้ที่นี่
          </p>
        </div>
        <LogoutButton initialBooking={initialBooking} /> {/* client component */}
      </div>

      <RoomInfo initialBooking={initialBooking} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <ResidentInfo initialBooking={initialBooking} />
        <RoommatesInfo initialBooking={initialBooking} />
      </div>

      <BookingActions initialBooking={initialBooking} /> {/* client component */}
    </Container>
  );
};

export default MyBookingPage;
