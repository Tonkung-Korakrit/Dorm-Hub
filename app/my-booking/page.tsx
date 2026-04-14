// app/my-booking/page.tsx
// "use server"

import React from 'react'
import BookingHistory from './BookingHistory'
import { getMyBooking } from '@/services/booking';

export const metadata = {
  title: "My booking | DormHub",
  description: "ตรวจสอบสถานะการจองหอพักของคุณ",
};

const MyBookingPage = async() => {
  const initialData = await getMyBooking(); // ดึงข้อมูลระดับ Server
  
  return <BookingHistory initialBooking={initialData} />;
}

export default MyBookingPage
