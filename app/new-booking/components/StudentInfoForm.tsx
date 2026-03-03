// book/components/StudentInfoForm.tsx
"use client";

import React, { useEffect, ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import toast from 'react-hot-toast';
// import { GenderType } from "@prisma/client";
import DatePicker from "./DatePickerWrapper";
import "react-datepicker/dist/react-datepicker.css";
import { th } from "date-fns/locale"; // สำหรับภาษาไทยในปฏิทิน
import { Combobox, Transition } from '@headlessui/react';
import { MdSwapVert, MdCheck, MdInfoOutline } from "react-icons/md"; // ต้องลง @heroicons/react เพิ่ม
// import { set } from "react-datepicker/dist/date_utils";
import { BookingStatus, CitizenType } from "@/types/booking";

// กำหนด Type สำหรับ Props ของ Component
interface StudentInfoFormProps {
  setStep: Dispatch<SetStateAction<number>>;
}

export function StudentInfoForm({ setStep }: StudentInfoFormProps) {
  const { formResident, setFormResident, isEditMode, setIsEditMode, currentBooking, setCurrentBooking } = useBooking();
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState([]);
  const isLocked = currentBooking?.status === BookingStatus.REJECTED;

  const filteredFaculty = query === ''
    ? FACULTY_LIST
    : FACULTY_LIST.filter((faculty) =>
      faculty.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
    );

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // แก้ปัญหา Hydration 100%: เช็คว่า Component Mount หรือยัง
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (currentBooking && currentBooking.status === BookingStatus.REJECTED) {
      // นำข้อมูลจาก DB มาใส่ในฟอร์มเพื่อให้ User แก้ไขเฉพาะจุด
      setFormResident((prev) => ({
        ...prev,
        ...currentBooking.cus_users, // สมมติว่าใน currentBooking มีข้อมูล user แนบมา
        // หรือดึง field อื่นๆ ที่จำเป็น
      }));
    }
  }, [currentBooking, setFormResident]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const finalValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked  // ถ้าเป็น checkbox ให้ใช้ค่า checked (true/false)
      : value;

    if (errors.includes(name)) {
      setErrors((prevErrors) => prevErrors.filter((item) => item !== name));
    }

    // setFormResident((prev: any) => ({ ...prev, [name]: value }));
    setFormResident((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleNextStep = () => {
    // รายการฟีลด์ที่ต้องตรวจสอบก่อนอนุญาตให้ไปขั้นตอนถัดไป
    const requiredFields = [
      "citizenType", "citizenNumber", "studentId", "gender", "faculty_department",
      "titleName", "name_th", "name_en", "email", "birthDate", "mobilePhone",
    ];

    const passportLength = [7, 8, 9];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    const missingFields = requiredFields.filter(field => !formResident[field]);
    if (missingFields.length > 0) {
      setErrors(missingFields);
      toast.error('Please fill in all the student information highlighted in red.', {
        position: 'top-center',
        duration: 2000,
        id: 'validation-error',
      });
      return;
    }

    if (formResident.citizenType === CitizenType.CITIZEN_ID && formResident.citizenNumber.length !== 13) {
      toast.error('เลขบัตรประชาชนต้องมี 13 หลัก', {
        position: 'top-center',
        duration: 2000,
        id: 'citizen-id-error',
      });
      return;
    }

    if (formResident.citizenType === CitizenType.PASSPORT && !passportLength.includes(formResident.citizenNumber.length)) {
      toast.error('A passport must contain 7-9 digits.', {
        position: 'top-center',
        duration: 2000,
        id: 'passport-error',
      });
      return;
    }

    if (formResident.name_th && !formResident.name_th.trim().includes(' ')) {
      toast.error('กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย (เว้นวรรคระหว่างชื่อ และนามสกุล)', {
        id: 'name-th-error'
      });
      return;
    }

    // เช็คชื่อภาษาอังกฤษด้วย (ถ้าต้องการ)
    if (formResident.name_en && !formResident.name_en.trim().includes(' ')) {
      toast.error('Please enter both First name and Surname (English)', {
        id: 'name-en-error'
      });
      return;
    }

    if (!emailRegex.test(formResident.email)) {
      toast.error('Invalid email format.', {
        position: 'top-center',
        duration: 2000,
        id: 'email-error',
      });
      return;
    }

    if (!phoneRegex.test(formResident.mobilePhone)) {
      toast.error('Phone number must be 10 digits.', {
        position: 'top-center',
        duration: 2000,
        id: 'phone-error',
      });
      return;
    }

    setErrors([]);
    // const isEditingFromRejected = currentBooking?.status === BookingStatus.REJECTED;
    
    setStep(2);
    // if (isEditMode) {
    //   // 2. ถ้ามาจากหน้า Summary ให้เด้งกลับทันทีหลังจากเลือกเตียงเสร็จ
    //   setIsEditMode(false);
    //   setStep(7); // กลับหน้า Summary
    // } else {
    //   // 3. ถ้าเป็นการจองปกติ ให้ไปหน้าถัดไป (เช่น หน้าสรุป)
    //   setStep(2);
    // }
  };

  // คำนวณวันที่ถอยหลังจากวันนี้ไป 18 ปี
  const today = new Date();
  const maxAllowedDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  console.log("currentBooking in StudenInfoForm: ", currentBooking);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {currentBooking?.status === BookingStatus.REJECTED && currentBooking.remark && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
          <p className="text-amber-800 font-bold text-sm uppercase flex items-center gap-2">
            <MdInfoOutline size={18} /> Feedback from Staff:
          </p>
          <p className="text-amber-900 text-sm mt-1 font-thai">"{currentBooking.remark}"</p>
        </div>
      )}

      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">
        Student Information / ข้อมูลนักศึกษา
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citizen Type + Citizen Number */}
        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Identification / ข้อมูลระบุตัวตน <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <select
              className={`w-full sm:w-1/3 border rounded-lg px-3 py-2 focus:outline-none transition-color text-white bg-[#006633] 
                ${errors.includes("citizenType") ? "border-red-500 border-2" : "border-gray-300 focus:ring-2 focus:ring-[#006633]"}`}
              value={formResident.citizenType || ""}
              name="citizenType"
              onChange={handleChange}
              suppressHydrationWarning
              required
            >
              <option value="" disabled hidden>-- Select card type --</option>
              <option value={CitizenType.CITIZEN_ID}>เลขประจำตัวประชาชน</option>
              <option value={CitizenType.PASSPORT}>Passport (Foreign Student)</option>
            </select>

            <input
              className={`w-full sm:w-2/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none 
              transition-color focus:ring-2 focus:ring-[#006633] text-black placeholder:text-gray-400 
              ${errors.includes("citizenNumber") ? "border-red-500 border-2" : ""}`}
              // เปลี่ยน Placeholder ตามประเภทที่เลือก
              placeholder={formResident.citizenType === CitizenType.PASSPORT ? "Passport Number (7-9 characters)" : "เลขบัตรประชาชน 13 หลัก"}
              name="citizenNumber"
              type="text"
              disabled={!formResident.citizenType}
              value={formResident.citizenNumber || ""}
              onChange={handleChange}
              minLength={formResident.citizenType === CitizenType.PASSPORT ? 7 : 13}
              maxLength={formResident.citizenType === CitizenType.PASSPORT ? 9 : 13}
              onInput={(e) => {
                if (formResident.citizenType === CitizenType.CITIZEN_ID) {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                } else if (formResident.citizenType === CitizenType.PASSPORT) {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                let isInvalid = false;

                if (value) {
                  if (formResident.citizenType === CitizenType.CITIZEN_ID) {
                    if (value.length !== 13) isInvalid = true;
                  } else if (formResident.citizenType === CitizenType.PASSPORT) {
                    const passportRegex = /^[a-zA-Z0-9]{7,9}$/;
                    if (!passportRegex.test(value)) isInvalid = true;
                  }
                }

                if (isInvalid) {
                  if (!errors.includes("citizenNumber")) {
                    setErrors([...errors, "citizenNumber"]);
                  }
                } else {
                  setErrors(errors.filter((item) => item !== "citizenNumber"));
                }
              }}
              title={formResident.citizenType === CitizenType.PASSPORT ? "Please enter your passport number correctly (7-9 digits)." : "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)"} // เพิ่ม title เพื่อช่วยแนะนำผู้ใช้
              suppressHydrationWarning
              required
            />
            {errors.includes("citizenNumber") && (
              <p className="text-red-500 text-xs mt-1 animate-pulse">
                * กรุณากรอกเลขบัตรประจำตัวประชาชน หรือ Passport numberให้ถูกต้อง
              </p>
            )}
          </div>
        </div>

        {/* Student ID */}
        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Student ID / เลขทะเบียนนักศึกษา <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 
              focus:outline-none text-black ${formResident.studentId ? "bg-white cursor-not-allowed" : "focus:ring-2 focus:ring-[#006633]"} 
              transition-color placeholder:text-gray-400 ${errors.includes("studentId") ? "border-red-500 border-2" : ""}`}
            placeholder="StudentId - เลขทะเบียนนักศึกษา"
            type="text"
            name="studentId"
            value={formResident.studentId || ""}
            onChange={handleChange}
            minLength={10}
            maxLength={10}
            // readOnly={!!formResident.studentId && formResident.studentId !== "0"}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
            }}
            onBlur={(e) => {
              const value = e.target.value;
              let isInvalid = false;
              if (value && value.length !== 10) isInvalid = true;
              if (isInvalid) {
                if (!errors.includes("studentId")) {
                  setErrors([...errors, "studentId"]);
                }
              } else {
                setErrors(errors.filter((item) => item !== "studentId"));
              }
            }}
            suppressHydrationWarning
            required
          />
          {errors.includes("studentId") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * กรุณากรอกเลขทะเบียนนักศึกษาให้ถูกต้อง (10 หลัก)
            </p>
          )}
        </div>

        <div className="col-span-2 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scholarship Checkbox เป็นนักศึกษาทุนมั้ย*/}
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Scholarship / เป็นนักศึกษาทุน หรือไม่
          </label>
          <label className="flex items-center gap-3 p-2 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              name="isScholarshipStudent"
              checked={formResident.isScholarshipStudent || false}
              onChange={handleChange}
              className="w-5 h-5 accent-[#006633] cursor-pointer"
              required
              suppressHydrationWarning
            />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800">Scholarship Student / นักศึกษาทุน</span>
            </div>
          </label>

          {/* Disability Checkbox เป็นนักศึกษาพิการทางร่างกายมั้ย*/}
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Disability / เป็นนักศึกษาพิการทางร่างกาย หรือไม่
          </label>
          <label className="flex items-center gap-3 p-2 cursor-pointer transition-colors group">
            <input
              type="checkbox"
              name="isDisabled" // ปรับให้ตรงกับชื่อ isDisabled ที่แนะนำไป
              checked={formResident.isDisabled || false}
              onChange={handleChange}
              className="w-5 h-5 accent-[#006633] cursor-pointer"
              suppressHydrationWarning
            />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800">People with disabilities / ทุพพลภาพ</span>
            </div>
          </label>
        </div>

        {/* Gender + Prefix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-1">
              Gender / เพศสภาวะ <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-[#006633] text-white bg-[#006633]
              transition-color placeholder:text-gray-400 
              ${isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-[#006633]"}
              ${errors.includes("gender") ? "border-red-500 border-2" : ""}`}
              value={formResident.gender || ""}
              name="gender"
              disabled={isLocked}
              onChange={(e) => {
                handleChange(e);
                // เมื่อเปลี่ยนเพศ ให้ล้างคำนำหน้าเก่าทิ้ง เพื่อป้องกัน "นาย" ในเพศ "หญิง"
                setFormResident(prev => ({ ...prev, titleName: "" }));
              }}
              suppressHydrationWarning
              required
            >
              <option value="" disabled hidden>-- Select your gender --</option>
              <option value={"MALE"}>Male - ชาย</option>
              <option value={"FEMALE"}>Female - หญิง</option>
              <option value={"LGBTQ"}>LGBTQ+ - เพศทางเลือก</option>
            </select>
          </div>

          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-1">
              Title Name / คำนำหน้าชื่อ <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-[#006633] text-white bg-[#006633]
                transition-color placeholder:text-gray-400 
                ${isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-[#006633]"}
                ${errors.includes("titleName") ? "border-red-500 border-2" : ""}`}
              value={formResident.titleName || ""}
              name="titleName"
              onChange={handleChange}
              suppressHydrationWarning
              disabled={isLocked || !formResident.gender}
              required
            >
              <option value="" disabled hidden>-- Prefix --</option>
              {formResident.gender === "MALE" && (
                <option value="Mr.">Mr. - นาย</option>
              )}

              {formResident.gender === "FEMALE" && (
                <>
                  <option value="Ms.">Ms. - นางสาว</option>
                  <option value="Mrs.">Mrs. - นาง</option>
                </>
              )}

              {(formResident.gender === "LGBTQ" || formResident.gender === "OTHER") && (
                <>
                  <option value="Mr.">Mr. - นาย</option>
                  <option value="Ms.">Ms. - นางสาว</option>
                  <option value="Mrs.">Mrs. - นาง</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Name TH */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Name - Surname (TH) / ชื่อ - สกุล (ภาษาไทย) <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-[#006633] text-black
            transition-color placeholder:text-gray-400 ${errors.includes("name_th") ? "border-red-500 border-2" : ""}`}
            placeholder="ชื่อ-สกุล (ภาษาไทย)"
            type="text"
            name="name_th"
            value={formResident.name_th || ""}
            onChange={handleChange}
            // ให้พิมพ์แต่ภาษาไทย ก-๙ และป้องกันการพิมพ์ช่องว่างซ้ำกันมากกว่า 1 ครั้ง (\s+)
            onInput={(e) => {
              let value = e.currentTarget.value = e.currentTarget.value.replace(/[^ก-๙\s]/g, '');
              value = value.replace(/^\s+/, '');
              value = value.replace(/\s\s+/g, ' ');
              e.currentTarget.value = value;
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              let isInvalid = false;

              // ถ้ามีข้อมูล แต่ไม่มีช่องว่างข้างใน
              if (value && !value.includes(' ')) {
                isInvalid = true;
              }

              if (isInvalid) {
                if (!errors.includes("name_th")) {
                  setErrors([...errors, "name_th"]);
                }
              } else {
                setErrors(errors.filter((item) => item !== "name_th"));
              }
            }}
            suppressHydrationWarning
            required
          />
          {errors.includes("name_th") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย (และเว้นวรรคให้ถูกต้อง)
            </p>
          )}
        </div>

        {/* Name EN */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Name - Surname (ENG) / ชื่อ - สกุล (ภาษาอังกฤษ) <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-[#006633] text-black
            transition-color placeholder:text-gray-400 ${errors.includes("name_en") ? "border-red-500 border-2" : ""}`}
            placeholder="Name-Surname(English)"
            type="text"
            name="name_en"
            value={formResident.name_en || ""}
            onChange={handleChange}
            onInput={(e) => {
              let value = e.currentTarget.value.replace(/[^a-zA-Z\s]/g, '');
              value = value.replace(/^\s+/, '');
              value = value.replace(/\s\s+/g, ' ');

              // แยกคำด้วยช่องว่าง เพื่อทำตัวพิมพ์ใหญ่ตัวแรกของทุกคำ
              const words = value.split(' ');
              const capitalizedWords = words.map(word => {
                if (word.length === 0) return '';
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              });

              e.currentTarget.value = capitalizedWords.join(' ');
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              let isInvalid = false;

              if (value && !value.includes(' ')) {
                isInvalid = true;
              }

              if (isInvalid) {
                if (!errors.includes("name_en")) {
                  setErrors([...errors, "name_en"]);
                }
              } else {
                setErrors(errors.filter((item) => item !== "name_en"));
              }
            }}
            suppressHydrationWarning
            required
          />
          {errors.includes("name_en") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * กรุณากรอกทั้งชื่อ และนามสกุลภาษาอังกฤษ (และเว้นวรรคให้ถูกต้อง)
            </p>
          )}
        </div>

        {/* Birth Date */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Birth Date / วันเกิด <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <DatePicker
              // กำหนดค่าวันที่ (ต้องแปลงจาก string ใน state เป็น Date object)
              selected={formResident.birthDate ? new Date(formResident.birthDate) : null}

              // เมื่อเลือกวันที่ ให้บันทึกกลับเป็น ISO string หรือ Date ตามที่ Prisma ต้องการ
              onChange={(date) => {
                setFormResident(prev => ({ ...prev, birthDate: date }));
              }}
              onBlur={() => {
                if (!formResident.birthDate) {
                  if (!errors.includes("birthDate")) {
                    setErrors([...errors, "birthDate"]);
                  }
                }
              }}

              // กำหนดรูปแบบการแสดงผลในช่อง Input
              dateFormat="dd/MM/yyyy"
              locale={th}
              placeholderText="วัน/เดือน/ปี"

              // ปรับแต่งสไตล์ให้ Minimal (Tailwind) w-full
              className={`w-[286px] sm:w-[536px] md:w-[266px] lg:w-[336px] border border-gray-300 rounded-lg px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-[#006633] text-black bg-white
              transition-color placeholder:text-gray-400 ${errors.includes("birthDate") ? "border-red-500 border-2" : ""}`}

              // ตั้งค่าปีให้เลือกง่ายขึ้น (ไม่ต้องกดเลื่อนทีละเดือน)
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              maxDate={maxAllowedDate}
              openToDate={maxAllowedDate}
              yearDropdownItemNumber={30}
              scrollableYearDropdown={true}
              required
            // suppressHydrationWarning
            />
            {errors.includes("birthDate") && (
              <p className="text-red-500 text-xs mt-1 animate-pulse">
                * กรุณาเลือกวันเกิดให้ถูกต้อง (ผู้เข้าพักต้องมีอายุ 18 ปีขึ้นไป)
              </p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Mobile No. / เบอร์โทรศัพท์มือถือ <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-[#006633] text-black
            transition-color placeholder:text-gray-400 ${errors.includes("mobilePhone") ? "border-red-500 border-2" : ""}`}
            placeholder="08X-XXX-XXXX"
            type="tel"
            name="mobilePhone"
            value={formResident.mobilePhone || ""}
            onChange={handleChange}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
            }}
            onBlur={(e) => {
              const value = e.target.value.trim();
              let isInvalid = false;

              if (value && (value.length !== 10 || value[0] !== '0')) {
                isInvalid = true;
              }

              if (isInvalid) {
                if (!errors.includes("mobilePhone")) {
                  setErrors([...errors, "mobilePhone"]);
                }
              } else {
                setErrors(errors.filter((item) => item !== "mobilePhone"));
              }
            }}
            minLength={10}
            maxLength={10}
            suppressHydrationWarning
            required
          />
          {errors.includes("mobilePhone") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องมี 10 หลัก)
            </p>
          )}
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-[#006633] text-black
            transition-color placeholder:text-gray-400 ${errors.includes("email") ? "border-red-500 border-2" : ""}`}
            placeholder="example@email.com"
            type="email"
            name="email"
            value={formResident.email || ""}
            onChange={handleChange}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9._%+-@]/g, '').toLowerCase();
            }}
            // เมื่อเลิกโฟกัส: เช็ครูปแบบว่ามี @ และ . หรือไม่
            onBlur={(e) => {
              const value = e.target.value;
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

              let isInvalid = false;
              if (value && !emailRegex.test(value)) {
                isInvalid = true;
              }

              if (isInvalid) {
                if (!errors.includes("email")) setErrors([...errors, "email"]);
              } else {
                setErrors(errors.filter((item) => item !== "email"));
              }
            }}
            suppressHydrationWarning
            required
          />
          {errors.includes("email") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * รูปแบบอีเมลไม่ถูกต้อง (เช่น example@email.com)
            </p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Faculty and Department / คณะ และสาขา <span className="text-red-500">*</span>
          </label>
          <span className="text-[12px] text-red-500">*สามารถพิมพ์เพื่อค้นหาได้ ไม่ต้องเลื่อนหาเองให้ปวดตา</span>

          {mounted ? (
            <Combobox
              value={formResident.faculty_department}
              onChange={(val) => setFormResident(prev => ({ ...prev, faculty_department: val }))}
            >
              <div className="relative mt-1">
                <div className={`relative w-full cursor-default overflow-hidden rounded-lg 
                border border-gray-300 bg-white text-left 
                focus-within:ring-2 focus-within:ring-[#006633] transition-all 
                ${errors.includes("faculty_department") ? "border-red-500 border-2" : ""}`}>
                  <Combobox.Input
                    id="faculty-combobox-input"
                    className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
                    displayValue={(val: string) => val}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="พิมพ์เพื่อค้นหาคณะ..."
                  />
                  <Combobox.Button
                    id="faculty-combobox-button"
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <MdSwapVert className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                </div>

                <Transition
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setQuery('')}
                >
                  <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                    {filteredFaculty.length === 0 && query !== '' ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        ไม่พบข้อมูล " {query} " สามารถพิมพ์ชื่อคณะใหม่ได้เลย
                      </div>
                    ) : (
                      filteredFaculty.map((faculty) => (
                        <Combobox.Option
                          key={faculty.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-[#006633] text-white' : 'text-gray-900'
                            }`
                          }
                          value={faculty.name}
                        >
                          {({ selected, active }) => (
                            <>
                              {/* <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}> */}
                              <span className={`block whitespace-normal leading-tight ${selected ? 'font-bold' : 'font-normal'}`}>
                                {faculty.name}
                              </span>
                              {selected ? (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-[#006633]'}`}>
                                  <MdCheck className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          ) : (
            // แสดง Placeholder สวยๆ ระหว่างรอ Hydrate เพื่อไม่ให้ Layout กระโดด
            <div className="w-full h-[42px] bg-gray-50 border border-gray-300 rounded-lg animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Button */}
      <div className={`flex justify-end w-[1/2] mt-6 font-bold ${isEditMode ? "text-[12px]" : "text-[16px]"}`}>
        <button
          type="button"
          onClick={handleNextStep}
          className="bg-[#006633] hover:bg-[#006699] text-white font-bold px-[52px] py-3 rounded-xl shadow transition flex items-center"
          suppressHydrationWarning
        >
          {/* {isEditMode ? "Save & Return to Summary" : "Next"} */}
          Next
        </button>
      </div>
    </div>
  );
}

// web อ้างอิง: https://tu.ac.th/academic/programs/?group=undergrad
const FACULTY_LIST = [
  { id: "1", name: "คณะทันตแพทยศาสตร์ สาขาทันตแพทยศาสตรบัณฑิต" },
  { id: "2", name: "คณะทันตแพทยศาสตร์ สาขาทันตแพทยศาสตรบัณฑิต (ทวิภาษา)" },
  { id: "3", name: "คณะทันตแพทยศาสตร์ สาขาวิทยาศาสตรบัณฑิต สาขาวิชาทันต สาธารณสุข (ต่อเนื่อง)" },
  { id: "4", name: "คณะนิติศาสตร์ สาขาวิชากฎหมายธุรกิจ (หลักสูตรนานาชาติ)" },
  { id: "5", name: "คณะนิติศาสตร์ สาขานิติศาสตร์บัณฑิต" },
  { id: "6", name: "คณะพยาบาลศาสตร์ สาขาพยาบาลศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "7", name: "คณะพยาบาลศาสตร์ สาขาพยาบาลศาสตรบัณฑิต" },
  { id: "8", name: "คณะพาณิชยศาสตร์ และการบัญชี สาขาบัญชีบัณฑิต" },
  { id: "9", name: "คณะพาณิชยศาสตร์ และการบัญชี สาขาบัญชีบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "10", name: "คณะพาณิชยศาสตร์ และการบัญชี สาขาบริหารธุรกิจบัณฑิต" },
  { id: "11", name: "คณะพาณิชยศาสตร์ และการบัญชี สาขาบริหารธุรกิจบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "12", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต วิชาการบัญชีธุรกิจแบบบูรณาการ" },
  { id: "13", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาควบบริหารธุรกิจบัณฑิต สาขาวิชาการจัดการธุรกิจแบบบูรณาการ" },
  { id: "14", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกการเงิน" },
  { id: "15", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกการตลาด" },
  { id: "16", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกการบริหารองค์การ การประกอบการและทรัพยากรมนุษย์" },
  { id: "17", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกบริหารการปฏิบัติการ" },
  { id: "18", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกบริหารธุรกิจระหว่างประเทศ โลจิสติกส์และการขนส่ง" },
  { id: "19", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกระบบสารสนเทศเพื่อการจัดการ" },
  { id: "20", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกธุรกิจอสังหาริมทรัพย์" },
  { id: "21", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบบัญชีบัณฑิต สาขาบริหารธุรกิจบัณฑิต วิชาเอกธุรกิจอสังหาริมทรัพย์ (หลักสูตรนานาชาติ)" },
  { id: "22", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบวิทยาศาสตรมหาบัณฑิต" },
  { id: "23", name: "คณะพาณิชยศาสตร์ และการบัญชี ควบวิทยาศาสตรมหาบัณฑิต สาขาวิชาการบัญชีและการบริหาร การเงิน" },
  { id: "24", name: "คณะรัฐศาสตร์ สาขารัฐศาสตรบัณฑิต" },
  { id: "25", name: "คณะรัฐศาสตร์ สาขาวิชาการเมืองและการระหว่างประเทศ (นานาชาติ)" },
  { id: "26", name: "คณะรัฐศาสตร์ สาขาวิชาเอกการเมืองการปกครอง" },
  { id: "27", name: "คณะรัฐศาสตร์ สาขาวิชาเอกบริหารรัฐกิจ" },
  { id: "28", name: "คณะรัฐศาสตร์ สาขาวิชาเอกการระหว่างประเทศ" },
  { id: "29", name: "คณะรัฐศาสตร์ สาขาวิชาบริหารรัฐกิจ และกิจการสาธารณะ สําหรับนักบริหาร" },
  { id: "30", name: "คณะวารสารศาสตร์และสื่อสารมวลชน สาขาวารสารศาสตรบัณฑิต" },
  { id: "31", name: "คณะวารสารศาสตร์และสื่อสารมวลชน สาขาวิชา สื่อศึกษา (นานาชาติ)" },
  { id: "32", name: "คณะวิทยาการเรียนรู้และศึกษาศาสตร์ สาฃาวิชาวิทยาการเรียนรู้" },
  { id: "33", name: "คณะวิทยาการเรียนรู้และศึกษาศาสตร์ สาขาวิชาศักยภาพ มนุษย์และสุขภาวะ(พหุวิทยาการ)" },
  { id: "34", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาศาสตร์สิ่งแวดล้อม" },
  { id: "35", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเทคโนโลยีเพื่อการพัฒนายั่งยืน" },
  { id: "36", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเทคโนโลยีการเกษตร" },
  { id: "37", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาการ คอมพิวเตอร์" },
  { id: "38", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาคณิตศาสตร์ประยุกต์" },
  { id: "39", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาคณิตศาสตร์" },
  { id: "40", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาสถิติ" },
  { id: "41", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาศาสตร์และเทคโนโลยีการอาหาร" },
  { id: "42", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเคมี" },
  { id: "43", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเทคโนโลยีชีวภาพ" },
  { id: "44", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาฟิสิกส์ อิเล็กทรอนิกส์" },
  { id: "45", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาฟิสิกส์" },
  { id: "46", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวัสดุศาสตร์" },
  { id: "47", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาศาสตร์และเทคโนโลยีสิ่งทอ" },
  { id: "48", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาคณิตศาสตร์การจัดการ" },
  { id: "49", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาการประกันภัย" },
  { id: "50", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเทคโนโลยีพลังงานชีวภาพและการแปรรูป เคมีชีวภาพ" },
  { id: "51", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาศาสตร์และนวัตกรรมทางอาหาร" },
  { id: "52", name: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาเทคโนโลยีและนวัตกรรมดิจิทัล" },
  { id: "53", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมไฟฟ้า" },
  { id: "54", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมอุตสาหการ" },
  { id: "55", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมโยธา" },
  { id: "56", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมเครื่องกล" },
  { id: "57", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมคอมพิวเตอร์" },
  { id: "58", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมซอฟต์แวร์" },
  { id: "59", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมโยธาและการบริหารการก่อสร้าง" },
  { id: "60", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมไฟฟ้า และการจัดการอุตสาหกรรม" },
  { id: "61", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมยานยนต์และระบบอัตโนมัติ" },
  { id: "62", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมไฟฟ้าและข้อมูล (นานาชาติ)" },
  { id: "63", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมอุตสาหการ (นานาชาติ)" },
  { id: "64", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมโยธาและการพัฒนาอสังหาริมทรัพย์ (นานาชาติ)" },
  { id: "65", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมเคมีและการจัดการ (นานาชาติ)" },
  { id: "66", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมเครื่องกลและการจัดการอุตสาหกรรม (นานาชาติ)" },
  { id: "67", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมไฟฟ้า (นานาชาติ) (สองสถาบัน)" },
  { id: "68", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมอุตสาหการ (นานาชาติ) (สองสถาบัน)" },
  { id: "69", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมโยธา (นานาชาติ) (สองสถาบัน)" },
  { id: "70", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมเคมี (นานาชาติ) (สองสถาบัน)" },
  { id: "71", name: "คณะวิศวกรรมศาสตร์ สาขาวิชา วิศวกรรมเครื่องกล (นานาชาติ) (สองสถาบัน)" },
  { id: "72", name: "คณะศิลปกรรมศาสตร์ สาขาวิชาการละคอน" },
  { id: "73", name: "คณะศิลปกรรมศาสตร์ สาขาวิชาศิลปะการออกแบบพัสตราภรณ์" },
  { id: "74", name: "คณะศิลปกรรมศาสตร์ สาขาวิชาออกแบบหัตถอุตสาหกรรม" },
  { id: "75", name: "คณะศิลปศาสตร์ สาขาวิชาจิตวิทยา" },
  { id: "76", name: "คณะศิลปศาสตร์ สาขาศิลปศาสตรบัณฑิต" },
  { id: "77", name: "คณะศิลปศาสตร์ สาขาวิชาภาษาอังกฤษ" },
  { id: "78", name: "คณะศิลปศาสตร์ สาขาวิชาภูมิศาสตร์และภูมิสารสนเทศ" },
  { id: "79", name: "คณะศิลปศาสตร์ สาขาวิชาอาณาบริเวณศึกษา" },
  { id: "80", name: "คณะศิลปศาสตร์ สาขาวิชาอังกฤษ-อเมริกันศึกษา (นานาชาติ)" },
  { id: "81", name: "คณะศิลปศาสตร์ สาขาวิชาการสื่อสารเชิงธุรกิจ (นานาขาติ)" },
  { id: "82", name: "คณะศิลปศาสตร์ สาขาวิชาการแปลและล่ามในยุคดิจิทัล" },
  { id: "83", name: "คณะศิลปศาสตร์ สาขาวิชาภาษาไทย" },
  { id: "84", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาวิชา สถาปัตยกรรม" },
  { id: "85", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาวิชา สถาปัตยกรรม เพื่อการพัฒนาอสังหาริมทรัพย์" },
  { id: "86", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาการผังเมืองบัณฑิต" },
  { id: "87", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาภูมิสถาปัตยกรรมศาสตรบัณฑิต" },
  { id: "88", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาสถาปัตยกรรมภายในบัณฑิต" },
  { id: "89", name: "คณะสถาปัตยกรรมศาสตร์และการผังเมือง สาขาวิชาการ จัดการออกแบบ ธุรกิจและเทคโนโลยี (นานาชาติ)" },
  { id: "90", name: "คณะสหเวชศาสตร์ สาขาเทคนิคการแพทยบัณฑิต" },
  { id: "91", name: "คณะสหเวชศาสตร์ สาขาวิชา กายภาพบําบัด" },
  { id: "92", name: "คณะสหเวชศาสตร์ สาขาวิชา วิทยาศาสตร์การกีฬาและการออก กําลังกาย" },
  { id: "93", name: "คณะสหเวชศาสตร์ สาขาวิชาการฝึกสอนกีฬา" },
  { id: "94", name: "คณะสหเวชศาสตร์ สาขาวิชาจัดการกีฬา" },
  { id: "95", name: "คณะสหเวชศาสตร์ สาขาวิชารังสีเทคนิค" },
  { id: "96", name: "คณะสังคมวิทยาและมานุษยวิทยา สาขาวิชาสังคมวิทยาและมานุษยวิทยา" },
  { id: "97", name: "คณะสังคมวิทยาและมานุษยวิทยา สาขาวิชาการวิจัยทางสังคม" },
  // { id: "98", name: "คณะสังคมวิทยาและมานุษยวิทยา สาขาวิชาสังคมวิทยาและมานุษยวิทยา" },
  // { id: "99", name: "คณะสังคมวิทยาและมานุษยวิทยา สาขาวิชาการวิจัยทางสังคม" },
  { id: "100", name: "คณะสังคมสงเคราะห์ศาสตร์ สาขาสังคมสงเคราะห์ศาสตรบัณฑิต" },
  { id: "101", name: "คณะสังคมสงเคราะห์ศาสตร์ สาขาวิชานโยบายสังคมและการพัฒนา (นานาชาติ)" },
  { id: "102", name: "คณะสังคมสงเคราะห์ศาสตร์ สาขาวิชานโยบายสังคมและการพัฒนา" },
  { id: "103", name: "คณะสังคมสงเคราะห์ศาสตร์ สาขาสังคมสงเคราะห์ศาสตรมหาบัณฑิต" },
  { id: "104", name: "คณะสาธารณสุขศาสตร์ สาขาวิชาการสร้างเสริมสุขภาพเชิงนวัตกรรม" },
  { id: "105", name: "คณะสาธารณสุขศาสตร์ สาขาวิชาอาชีวอนามัยและความปลอดภัย" },
  { id: "106", name: "คณะสาธารณสุขศาสตร์ สาขาวิชาอนามัยสิ่งแวดล้อม" },
  { id: "107", name: "คณะสาธารณสุขศาสตร์ สาขาวิชาอนามัยชุมชน" },
  { id: "108", name: "คณะเภสัชศาสตร์ สาขาเภสัชศาสตรบัณฑิต" },
  { id: "109", name: "คณะเศรษฐศาสตร์ สาขาเศรษฐศาสตรบัณฑิต" },
  { id: "110", name: "คณะเศรษฐศาสตร์ สาขาเศรษฐศาสตรบัณฑิต (นานาชาติ)" },
  { id: "111", name: "คณะแพทยศาสตร์ สาขาแพทยศาสตรบัณฑิต" },
  { id: "112", name: "คณะแพทยศาสตร์ สาขาแพทยศาสตรบัณฑิต (ภาษาอังกฤษ)" },
  { id: "113", name: "คณะแพทยศาสตร์ สาขาการแพทย์แผนไทยประยุกต์บัณฑิต" },
  { id: "114", name: "คณะวิทยาลัยนวัตกรรม สาขาวิชานวัตกรรมการบริการ (นานาชาติ)" },
  { id: "115", name: "คณะวิทยาลัยนวัตกรรม สาขาวิชาการจัดการ มรดกวัฒนธรรมและอุตสาหกรรมสร้างสรรค์ (พหุวิทยาการ)" },
  { id: "116", name: "คณะวิทยาลัยนวัตกรรม สาขาวิชานวัตกรรมและการแปรรูปทางดิจิทัล" },
  { id: "117", name: "คณะวิทยาลัยนวัตกรรม สาขาวิชาการจัดการ มรดกวัฒนธรรมและอุตสาหกรรมสร้างสรรค์" },
  { id: "118", name: "คณะวิทยาลัยพัฒนศาสตร์ ป๋วย อึ๊งภากรณ์ สาขาวิชานวัตกรรม การพัฒนามนุษย์และสังคม " },
  { id: "119", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชาสหวิทยาการ (พหุวิทยาการ)" },
  { id: "120", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชา ปรัชญา การเมือง และเศรษฐศาสตร์" },
  { id: "121", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชาวิทยาศาสตร์และนวัตกรรมข้อมูล (พหุวิทยาการ)" },
  { id: "122", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชา ปรัชญา การเมือง และเศรษฐศาสตร์ (นานาชาติ)" },
  { id: "123", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชาการจัดการ เพื่อความยั่งยืน (พหุวิทยาการ)" },
  { id: "124", name: "คณะวิทยาลัยสหวิทยาการ สาขาวิชา สตรี เพศสถานะและเพศวิถีศึกษา" },
]

// const FACULTY_LIST = [
//   { id: "1", name: "การผังเมืองบัณฑิต" },
//   { id: "2", name: "การออกแบบพัฒนาชุมชนเมืองบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "3", name: "การแพทย์แผนจีนบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "4", name: "การแพทย์แผนไทยประยุกต์บัณฑิต" },
//   { id: "5", name: "ควบบริหารธุรกิจบัณฑิต สาขาวิชาการจัดการธุรกิจแบบบูรณาการ" },
//   { id: "5-1", name: "ควบบัญชีบัณฑิต สาขาวิชาการบัญชีธุรกิจแบบบูรณาการ" }, // ปรับ ID เล็กน้อยกันซ้ำ
//   { id: "6", name: "ทันตแพทยศาสตรบัณฑิต" },
//   { id: "7", name: "ทันตแพทยศาสตรบัณฑิต (หลักสูตรทวิภาษา)" },
//   { id: "8", name: "นิติศาสตรบัณฑิต สาขาวิชากฎหมายธุรกิจ (หลักสูตรนานาชาติ)" },
//   { id: "9", name: "นิติศาสตร์บัณฑิต" },
//   { id: "10", name: "บริหารธุรกิจบัณฑิต" },
//   { id: "11", name: "บริหารธุรกิจบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "12", name: "บัญชีบัณฑิต" },
//   { id: "13", name: "บัญชีบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "14", name: "พยาบาลศาสตรบัณฑิต" },
//   { id: "15", name: "พยาบาลศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "16", name: "ภูมิสถาปัตยกรรมศาสตรบัณฑิต" },
//   { id: "17", name: "รัฐศาสตรบัณฑิต" },
//   { id: "18", name: "รัฐศาสตรบัณฑิต สาขาวิชาการเมืองและการระหว่างประเทศ (ภาคภาษาอังกฤษ)" },
//   { id: "19", name: "วารสารศาสตรบัณฑิต" },
//   { id: "20", name: "วารสารศาสตรบัณฑิต สาขาวิชาสื่อศึกษา (ภาคภาษาอังกฤษ)" },
//   { id: "21", name: "วิทยาศาสตรบัณฑิต สาขาวิชากายภาพบำบัด" },
//   { id: "22", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการจัดการวิศวกรรม (หลักสูตรนานาชาติ)" },
//   { id: "23", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการจัดการออกแบบ ธุรกิจ และเทคโนโลยี (หลักสูตรภาษาอังกฤษ)" },
//   { id: "24", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการออกแบบเชิงนวัตกรรมดิจิทัล (หลักสูตรนานาชาติ)" },
//   { id: "25", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์" },
//   { id: "26", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ วิชาเอกคณิตศาสตร์การเงิน (ภาคพิเศษ)" },
//   { id: "27", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ วิชาเอกวิทยาการจัดการเรียนรู้คณิตศาสตร์ (ภาคพิเศษ)" },
//   { id: "28", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์การจัดการ (ภาคพิเศษ)" },
//   { id: "29", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ประยุกต์" },
//   { id: "30", name: "วิทยาศาสตรบัณฑิต สาขาวิชาจิตวิทยา" },
//   { id: "31", name: "วิทยาศาสตรบัณฑิต สาขาวิชาทันตสาธารณสุข (หลักสูตรต่อเนื่อง)" },
//   { id: "32", name: "วิทยาศาสตรบัณฑิต สาขาวิชานวัตกรรมและการแปรรูปดิจิทัล" },
//   { id: "33", name: "วิทยาศาสตรบัณฑิต สาขาวิชาฟิสิกส์" },
//   { id: "34", name: "วิทยาศาสตรบัณฑิต สาขาวิชาฟิสิกส์อิเล็กทรอนิกส์" },
//   { id: "35", name: "วิทยาศาสตรบัณฑิต สาขาวิชาภูมิศาสตร์และภูมิสารสนเทศ" },
//   { id: "36", name: "วิทยาศาสตรบัณฑิต สาขาวิชารังสีเทคนิค" },
//   { id: "37", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวัสดุศาสตร์" },
//   { id: "38", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์" },
//   { id: "39", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการประกันภัย (ภาคพิเศษ)" },
//   { id: "40", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์การกีฬาและการออกกำลังกาย" },
//   { id: "41", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์สิ่งแวดล้อม" },
//   { id: "42", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์อุตสาหการและการจัดการ (หลักสูตรนานาชาติ)" },
//   { id: "43", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และนวัตกรรมข้อมูล" },
//   { id: "44", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และนวัตกรรมทางอาหาร" },
//   { id: "45", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และเทคโนโลยีการอาหาร" },
//   { id: "46", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และเทคโนโลยีสิ่งทอ" },
//   { id: "47", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถาปัตยกรรม" },
//   { id: "48", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถาปัตยกรรมเพื่อการพัฒนาอสังหาริมทรัพย์" },
//   { id: "49", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ" },
//   { id: "50", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ วิชาเอกวิทยาการวิเคราะห์ข้อมูล (ภาคพิเศษ)" },
//   { id: "51", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ วิชาเอกสถิติประยุกต์ (ภาคพิเศษ)" },
//   { id: "52", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสาธารณสุขศาสตร์" },
//   { id: "53", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอนามัย สิ่งแวดล้อม" },
//   { id: "54", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอนามัยชุมชน" },
//   { id: "55", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอาชีวอนามัยและความปลอดภัย" },
//   { id: "56", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเคมี" },
//   { id: "57", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคนิคการแพทย์" },
//   { id: "58", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีการจัดการ (หลักสูตรนานาชาติ)" },
//   { id: "59", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีการเกษตร" },
//   { id: "60", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีชีวภาพ" },
//   { id: "61", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีดิจิทัลแนวสร้างสรรค์ (หลักสูตรนานาชาติ)" },
//   { id: "62", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีทางคลินิก (หลักสูตรนานาชาติ)" },
//   { id: "63", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีพลังงานชีวภาพและการแปรรูปเคมีชีวภาพ" },
//   { id: "64", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ (หลักสูตรนานาชาติ)" },
//   { id: "65", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีหัวใจและทรวงอก (หลักสูตรนานาชาติ)" },
//   { id: "66", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีเพื่อการพัฒนายั่งยืน" },
//   { id: "67", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์" },
//   { id: "68", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์ (หลักสูตรนานาชาติ)" },
//   { id: "69", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์" },
//   { id: "70", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมยานยนต์ (หลักสูตรภาคภาษาอังกฤษ)" },
//   { id: "71", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอิเล็กทรอนิคส์และการสื่อสาร (หลักสูตรนานาชาติ)" },
//   { id: "72", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ" },
//   { id: "73", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (ภาคภาษาอังกฤษ)" },
//   { id: "74", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
//   { id: "75", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (หลักสูตรนานาชาติ)" },
//   { id: "76", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี" },
//   { id: "77", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (ภาคภาษาอังกฤษ)" },
//   { id: "78", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
//   { id: "79", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (หลักสูตรนานาชาติ)" },
//   { id: "80", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล" },
//   { id: "81", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (ภาคภาษาอังกฤษ)" },
//   { id: "83", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
//   { id: "84", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (หลักสูตรนานาชาติ)" },
//   { id: "85", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา" },
//   { id: "86", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา (ภาคภาษาอังกฤษ)" },
//   { id: "87", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา (หลักสูตรนานาชาติ)" },
//   { id: "88", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธาและการบริหารการก่อสร้าง (ตรีควบโท)" },
//   { id: "89", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า" },
//   { id: "90", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า (ภาคภาษาอังกฤษ)" },
//   { id: "91", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
//   { id: "92", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้าอุตสาหการ (ตรีควบโท)" },
//   { id: "93", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาเทคโนโลยียานยนต์ (พัทยา)" },
//   { id: "94", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาการละคอน" },
//   { id: "95", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาศิลปะการออกแบบพัสตราภรณ์" },
//   { id: "96", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาศิลปะการออกแบบหัตถอุตสาหกรรม" },
//   { id: "97", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการจัดการกีฬา" },
//   { id: "98", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการจัดการมรดกวัฒนธรรมและอุตสาหกรรมสร้างสรรค์" },
//   { id: "99", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการฝึกสอนกีฬา" },
//   { id: "100", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการพัฒนาเชิงสร้างสรรค์" },
//   { id: "101", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการสื่อสารภาษาอังกฤษเชิงธุรกิจ (หลักสูตรนานาชาติ)" },
//   { id: "102", name: "ศิลปศาสตรบัณฑิต สาขาวิชาจีนศึกษา (หลักสูตรนานาชาติ)" },
//   { id: "103", name: "ศิลปศาสตรบัณฑิต สาขาวิชานวัตกรรมการบริการ (หลักสูตรนานาชาติ)" },
//   { id: "104", name: "ศิลปศาสตรบัณฑิต สาขาวิชานโยบายสังคมและการพัฒนา (หลักสูตรนานาชาติ)" },
//   { id: "105", name: "ศิลปศาสตรบัณฑิต สาขาวิชาบรรณารักษศาสตร์และสารสนเทศศาสตร์" },
//   { id: "106", name: "ศิลปศาสตรบัณฑิต สาขาวิชาประวัติศาสตร์" },
//   { id: "107", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา" },
//   { id: "108", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา การเมือง และเศรษฐศาสตร์ (หลักสูตรนานาชาติ)" },
//   { id: "109", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา การเมืองและเศรษฐศาสตร์" },
//   { id: "110", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาญี่ปุ่น" },
//   { id: "111", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาฝรั่งเศส" },
//   { id: "112", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษารัสเซีย" },
//   { id: "113", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาศาสตร์" },
//   { id: "114", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาอังกฤษ" },
//   { id: "115", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาเยอรมัน" },
//   { id: "116", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาและวรรณคดีอังกฤษ" },
//   { id: "117", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาและวัฒนธรรมจีน" },
//   { id: "118", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาไทย" },
//   { id: "119", name: "ศิลปศาสตรบัณฑิต สาขาวิชารัสเซียศึกษา" },
//   { id: "120", name: "ศิลปศาสตรบัณฑิต สาขาวิชาวิทยาการเรียนรู้" },
//   { id: "121", name: "ศิลปศาสตรบัณฑิต สาขาวิชาวิเทศคดีศึกษา (อาเซียน - จีน) (หลักสูตรนานาชาติ)" },
//   { id: "122", name: "ศิลปศาสตรบัณฑิต สาขาวิชาสหวิทยาการสังคมศาสตร์" },
//   { id: "123", name: "ศิลปศาสตรบัณฑิต สาขาวิชาอังกฤษ–อเมริกันศึกษา (หลักสูตรนานาชาติ)" },
//   { id: "124", name: "ศิลปศาสตรบัณฑิต สาขาวิชา인เดียศึกษา (หลักสูตรนานาชาติ)" },
//   { id: "125", name: "ศิลปศาสตรบัณฑิต สาขาวิชาเอเชียตะวันออกเฉียงใต้ศึกษา" },
//   { id: "126", name: "ศิลปศาสตรบัณฑิต สาขาวิชาโลกคดีศึกษาและการประกอบการสังคม (ปริญญาตรี-หลักสูตรนานาชาติ)" },
//   { id: "127", name: "ศิลปศาสตรบัณฑิต สาขาวิชาไทยศึกษา (หลักสูตรนานาชาติ)" },
//   { id: "128", name: "สถาปัตยกรรมภายในบัณฑิต" },
//   { id: "129", name: "สังคมวิทยาและมานุษยวิทยาบัณฑิต สาขาวิชาการวิจัยทางสังคม" },
//   { id: "131", name: "สังคมวิทยาและมานุษยวิทยาบัณฑิต สาขาวิชาสังคมวิทยาและมานุษยวิทยา" },
//   { id: "132", name: "สังคมสงเคราะห์ศาสตรบัณฑิต" },
//   { id: "133", name: "เศรษฐศาสตรบัณฑิต" },
//   { id: "134", name: "เศรษฐศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
//   { id: "135", name: "แพทยศาสตรบัณฑิต" },
//   { id: "136", name: "แพทยศาสตรบัณฑิต (หลักสูตรภาคภาษาอังกฤษ)" }
// ];