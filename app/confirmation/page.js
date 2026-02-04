"use client";
import { useBooking } from "@/app/contexts/BookingContext";
import { useRouter } from "next/navigation";

export default function BookingConfirmationPage() {
  const { formRoom } = useBooking();
  const router = useRouter();

  if (!formRoom.roomId) {
    return <p>ไม่มีข้อมูลการจอง</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">ยืนยันการจองห้อง</h1>
      <p>คุณได้ทำการจองห้องเรียบร้อยแล้ว</p>

      <div className="mt-6 space-y-2">
        <p>ห้อง: {formRoom.roomId}</p>
        <p>โซน: {formRoom.zone}</p>
        <p>ชั้น: {formRoom.floor}</p>
        <p>ภูมิภาค: {formRoom.region}</p>
        <p>ราคา: {formRoom.price} บาท/เดือน</p>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          กลับไปหน้าหลัก
        </button>
      </div>
    </div>
  );
}
