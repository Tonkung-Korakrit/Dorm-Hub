import { useBooking } from '@/app/contexts/BookingContext';
import React from 'react'

interface StudentDetailProps {
  handleEdit: (step: number) => void;
}

const StudentDetail = (props: StudentDetailProps) => {
  const { handleEdit } = props;
  const { formResident } = useBooking();

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-[#006432]">1. Student Information</h3>
        <button
          onClick={() => handleEdit(1)}
          className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
        >
          Edit
        </button>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-gray-100 p-4 rounded-[1.5rem] text-[15px]"> */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-inner">
        <p><span className="text-gray-500">Name:</span> <span className="text-gray-800 font-medium">{formResident.name_th}</span></p>
        <p><span className="text-gray-500">Student ID:</span> <span className="text-gray-800 font-medium">{formResident.studentId.toString()}</span></p>
        <p><span className="text-gray-500">Faculty & Department:</span> <span className="text-gray-800 font-medium">{formResident.faculty_department}</span></p>
        <p><span className="text-gray-500">Email:</span> <span className="text-gray-800 font-medium">{formResident.email}</span></p>
        <p><span className="text-gray-500">Phone:</span> <span className="text-gray-800 font-medium">{formResident.mobilePhone}</span></p>
      </div>
    </section>
  )
}

export default StudentDetail
