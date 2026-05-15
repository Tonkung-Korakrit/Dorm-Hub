// new-booking/page.tsx
// server components
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getResidentProfile } from "@/services/profile";

// components
import Form from "./components/Form";
import { FormBookSkeleton } from "@/components/Loading/book/FormBookSkeleton";
import { getBookingById } from "@/action/booking-actions";

interface NewBookingProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewBookingPage({
  searchParams,
}: NewBookingProps) {
  const resident = await getResidentProfile();
   // ถ้าไม่มี User (ไม่ได้ Login หรือ Token ปลอม) ให้เด้งกลับหน้าแรก
  if (!resident) redirect("/login");

  // console.log("resident: " ,resident)

  const sParams = await searchParams;
  const editIdRaw = sParams.edit as string | undefined;
  const editId = editIdRaw ? Number(editIdRaw) : undefined;

  let initialBooking = null;
  try {
    if (editId) {
      // กรณีแก้ไข: ดึงข้อมูลตาม editId
      initialBooking = await getBookingById(editId);
    } else {
      // กรณีเข้าหน้าใหม่: เช็คว่ามีรายการที่จองค้างไว้ไหม (My Booking)
      // initialBooking = await getMyLatestBooking(resident.id);
      initialBooking = null;
    }
  } catch (error) {
    console.error("Server Fetch Error:", error);
  }

  console.log("initialBooking in server component: ", initialBooking)

  return (
    <Suspense fallback={<FormBookSkeleton />}>
      <Form
        resident={resident}
        editId={editId}
        initialBooking={initialBooking}
      />
    </Suspense>
  );
}
