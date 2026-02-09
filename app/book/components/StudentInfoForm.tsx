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
import { MdSwapVert, MdCheck } from "react-icons/md"; // ต้องลง @heroicons/react เพิ่ม

// กำหนด Type สำหรับ Props ของ Component
interface StudentInfoFormProps {
  setStep: Dispatch<SetStateAction<number>>;
}

export function StudentInfoForm({ setStep }: StudentInfoFormProps) {
  const { formResident, setFormResident } = useBooking();
  const [query, setQuery] = useState('');

  const filteredFaculty = query === ''
    ? FACULTY_LIST
    : FACULTY_LIST.filter((faculty) =>
      faculty.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
    );

  // useEffect(() => {
  //   // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // }, []);

  // แก้ปัญหา Hydration 100%: เช็คว่า Component Mount หรือยัง
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const finalValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked  // ถ้าเป็น checkbox ให้ใช้ค่า checked (true/false)
      : value;

    // setFormResident((prev: any) => ({ ...prev, [name]: value }));
    setFormResident((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const prefixOptions = {
    MALE: ["Mr."],
    FEMALE: ["Ms.", "Mrs."],
    LGBTQ: ["Mr.", "Ms.", "Mrs."], // หรือตามที่คุณต้องการอนุญาต
    OTHER: ["Mr.", "Ms.", "Mrs."]
  };

  const handleNextStep = () => {
    // ตรวจสอบว่าเลือกประเภทบัตรหรือยัง
    if (!formResident.citizenType || !formResident.citizenNumber ||
      !formResident.studentId || !formResident.gender || !formResident.faculty_department ||
      !formResident.prefix || !formResident.name_th || !formResident.name_en ||
      !formResident.email
    ) {
      console.log("formResident: ", formResident);
      toast.error('กรุณากรอกข้อมูลนักศึกษาให้ครบถ้วน', {
        position: 'top-center', // บนมือถือจะเห็นชัดมาก
      });
      return;
    }
    setStep(2);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
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
              className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-white bg-[#006633]"
              value={formResident.citizenType || ""}
              name="citizenType"
              onChange={handleChange}
              suppressHydrationWarning
              required
            >
              <option value="" disabled hidden>-- เลือกประเภทบัตร --</option>
              <option value="CITIZEN_ID">เลขประจำตัวประชาชน</option>
              <option value="PASSPORT">Passport (Foreign Student)</option>
            </select>

            <input
              className="w-full sm:w-2/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-400"
              // เปลี่ยน Placeholder ตามประเภทที่เลือก
              placeholder={formResident.citizenType === "PASSPORT" ? "Passport Number" : "เลขบัตรประชาชน 13 หลัก"}
              name="citizenNumber"
              type="text"
              value={formResident.citizenNumber || ""}
              onChange={handleChange}
              // กรองข้อมูลเบื้องต้น: ถ้าเป็นบัตรประชาชน ให้ใส่ได้เฉพาะเลข 13 หลัก
              maxLength={formResident.citizenType === "PASSPORT" ? 20 : 13}
              onInput={(e) => {
                if (formResident.citizenType !== "PASSPORT") {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                }
              }}
              suppressHydrationWarning
              required
            />
          </div>
        </div>

        {/* Student ID */}
        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Student ID / เลขทะเบียนนักศึกษา <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none text-black ${formResident.studentId ? "bg-white cursor-not-allowed" : "focus:ring-2 focus:ring-red-500"
              }`}
            placeholder="เลขทะเบียนนักศึกษา"
            type="text"
            name="studentId"
            value={formResident.studentId || ""}
            onChange={handleChange}
            // แนะนำให้ใส่ readOnly ถ้าได้ค่ามาจากระบบ Login แล้ว
            // readOnly={!!formResident.studentId && formResident.studentId !== "0"}
            suppressHydrationWarning
            required
          />
          {/* <p className="text-[12px] text-gray-500 mt-1">* ข้อมูลอ้างอิงจากระบบสำนักทะเบียน</p> */}
        </div>

        {/* <div className="col-span-2 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4"> */}
        {/* Scholarship Checkbox เป็นนักศึกษาทุนมั้ย*/}
        <label className="flex items-center gap-3 p-2 cursor-pointer transition-colors group">
          <input
            type="checkbox"
            name="isScholarshipStudent" // ปรับให้ตรงกับชื่อใน Prisma
            checked={formResident.isScholarshipStudent || false}
            onChange={handleChange}
            // className="w-5 h-5 accent-[#126A31] cursor-pointer"
            className="w-5 h-5 accent-[#8ACCA1] cursor-pointer"
            suppressHydrationWarning
          />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-gray-800">Scholarship Student / นักศึกษาทุน</span>
          </div>
        </label>


        {/* </div> */}

        {/* Gender + Prefix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-1">
              Gender / เพศสภาวะ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-white bg-[#006633]"
              value={formResident.gender || ""}
              name="gender"
              onChange={(e) => {
                handleChange(e);
                // เมื่อเปลี่ยนเพศ ให้ล้างคำนำหน้าเก่าทิ้ง เพื่อป้องกัน "นาย" ในเพศ "หญิง"
                setFormResident(prev => ({ ...prev, prefix: "" }));
              }}
              suppressHydrationWarning
              required
            >
              <option value="" disabled hidden>-- เลือกเพศสภาวะ --</option>
              <option value={"MALE"}>Male</option>
              <option value={"FEMALE"}>Female</option>
              <option value={"LGBTQ"}>LGBTQ+</option>
            </select>
          </div>

          <div>
            <label className="block text-[16px] font-medium text-gray-700 mb-1">
              Prefix / คำนำหน้าชื่อ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-white bg-[#006633]"
              value={formResident.prefix || ""}
              name="prefix"
              onChange={handleChange}
              suppressHydrationWarning
              disabled={!formResident.gender}
              required
            >
              {/* <option value="" disabled hidden>-- คำนำหน้าชื่อ --</option>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option> */}
              <option value="" disabled hidden>-- คำนำหน้าชื่อ --</option>
              {formResident.gender &&
                prefixOptions[formResident.gender as keyof typeof prefixOptions]?.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Name TH */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Name - Surname (TH) / ชื่อ - สกุล (ภาษาไทย) <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            placeholder="ชื่อ-สกุล (ภาษาไทย)"
            type="text"
            name="name_th"
            value={formResident.name_th || ""}
            onChange={handleChange}
            suppressHydrationWarning
            required
          />
        </div>

        {/* Name EN */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Name - Surname (ENG) / ชื่อ - สกุล (ภาษาอังกฤษ) <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            placeholder="Name-Surname(English)"
            type="text"
            name="name_en"
            value={formResident.name_en || ""}
            onChange={handleChange}
            suppressHydrationWarning
            required
          />
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

              // กำหนดรูปแบบการแสดงผลในช่อง Input
              dateFormat="dd/MM/yyyy"
              locale={th}
              placeholderText="วัน/เดือน/ปี"

              // ปรับแต่งสไตล์ให้ Minimal (Tailwind) w-full
              className="w-[280px] sm:w-[336px] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black bg-white"

              // ตั้งค่าปีให้เลือกง่ายขึ้น (ไม่ต้องกดเลื่อนทีละเดือน)
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              required
            // suppressHydrationWarning
            />

            {/* ไอคอนปฏิทินแบบมินิมอลทางขวา (Optional) */}
            {/* <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div> */}
          </div>
        </div>

        {/* Phone */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Mobile No. / เบอร์โทรศัพท์มือถือ <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            placeholder="08X-XXX-XXXX"
            // เปลี่ยนจาก "text" เป็น "tel" ช่วยให้มือถือขึ้นแป้นพิมพ์ตัวเลข
            type="tel"
            name="phone"
            value={formResident.phone || ""}
            onChange={handleChange}
            // ป้องกันการกรอกตัวอักษรอื่นนอกจากตัวเลข (Optional)
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
            }}
            maxLength={10}
            suppressHydrationWarning
            required
          />
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            placeholder="Email"
            type="email"
            name="email"
            value={formResident.email || ""}
            onChange={handleChange}
            suppressHydrationWarning
            required
          />
        </div>

        {/* Disability Checkbox เป็นนักศึกษาพิการทางร่างกายมั้ย*/}
        <label className="flex items-center gap-3 p-2 cursor-pointer transition-colors group">
          <input
            type="checkbox"
            name="isDisabled" // ปรับให้ตรงกับชื่อ isDisabled ที่แนะนำไป
            checked={formResident.isDisabled || false}
            onChange={handleChange}
            className="w-5 h-5 accent-[#8ACCA1] cursor-pointer"
            suppressHydrationWarning
          />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-gray-800">People with disabilities / ทุพพลภาพ</span>
          </div>
        </label>

        <div className="col-span-2">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            Faculty and Department / คณะ และสาขา <span className="text-red-500">*</span>
          </label>

          {mounted ? (
            <Combobox
              value={formResident.faculty_department}
              onChange={(val) => setFormResident(prev => ({ ...prev, faculty_department: val }))}
            >
              <div className="relative mt-1">
                <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left focus-within:ring-2 focus-within:ring-[#006633] transition-all">
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
      <div className="flex justify-end mt-6 text-[16px]">
        <button
          type="button"
          onClick={handleNextStep}
          className="bg-[#006633] hover:bg-[#006699] text-white px-12 py-2 rounded-xl shadow transition flex items-center"
          suppressHydrationWarning
        >
          Next
          {/* → <span className="ml-2">→</span> */}
        </button>
      </div>
    </div>
  );
}

const FACULTY_LIST = [
  { id: "1", name: "การผังเมืองบัณฑิต" },
  { id: "2", name: "การออกแบบพัฒนาชุมชนเมืองบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "3", name: "การแพทย์แผนจีนบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "4", name: "การแพทย์แผนไทยประยุกต์บัณฑิต" },
  { id: "5", name: "ควบบริหารธุรกิจบัณฑิต สาขาวิชาการจัดการธุรกิจแบบบูรณาการ" },
  { id: "5-1", name: "ควบบัญชีบัณฑิต สาขาวิชาการบัญชีธุรกิจแบบบูรณาการ" }, // ปรับ ID เล็กน้อยกันซ้ำ
  { id: "6", name: "ทันตแพทยศาสตรบัณฑิต" },
  { id: "7", name: "ทันตแพทยศาสตรบัณฑิต (หลักสูตรทวิภาษา)" },
  { id: "8", name: "นิติศาสตรบัณฑิต สาขาวิชากฎหมายธุรกิจ (หลักสูตรนานาชาติ)" },
  { id: "9", name: "นิติศาสตร์บัณฑิต" },
  { id: "10", name: "บริหารธุรกิจบัณฑิต" },
  { id: "11", name: "บริหารธุรกิจบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "12", name: "บัญชีบัณฑิต" },
  { id: "13", name: "บัญชีบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "14", name: "พยาบาลศาสตรบัณฑิต" },
  { id: "15", name: "พยาบาลศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "16", name: "ภูมิสถาปัตยกรรมศาสตรบัณฑิต" },
  { id: "17", name: "รัฐศาสตรบัณฑิต" },
  { id: "18", name: "รัฐศาสตรบัณฑิต สาขาวิชาการเมืองและการระหว่างประเทศ (ภาคภาษาอังกฤษ)" },
  { id: "19", name: "วารสารศาสตรบัณฑิต" },
  { id: "20", name: "วารสารศาสตรบัณฑิต สาขาวิชาสื่อศึกษา (ภาคภาษาอังกฤษ)" },
  { id: "21", name: "วิทยาศาสตรบัณฑิต สาขาวิชากายภาพบำบัด" },
  { id: "22", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการจัดการวิศวกรรม (หลักสูตรนานาชาติ)" },
  { id: "23", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการจัดการออกแบบ ธุรกิจ และเทคโนโลยี (หลักสูตรภาษาอังกฤษ)" },
  { id: "24", name: "วิทยาศาสตรบัณฑิต สาขาวิชาการออกแบบเชิงนวัตกรรมดิจิทัล (หลักสูตรนานาชาติ)" },
  { id: "25", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์" },
  { id: "26", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ วิชาเอกคณิตศาสตร์การเงิน (ภาคพิเศษ)" },
  { id: "27", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ วิชาเอกวิทยาการจัดการเรียนรู้คณิตศาสตร์ (ภาคพิเศษ)" },
  { id: "28", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์การจัดการ (ภาคพิเศษ)" },
  { id: "29", name: "วิทยาศาสตรบัณฑิต สาขาวิชาคณิตศาสตร์ประยุกต์" },
  { id: "30", name: "วิทยาศาสตรบัณฑิต สาขาวิชาจิตวิทยา" },
  { id: "31", name: "วิทยาศาสตรบัณฑิต สาขาวิชาทันตสาธารณสุข (หลักสูตรต่อเนื่อง)" },
  { id: "32", name: "วิทยาศาสตรบัณฑิต สาขาวิชานวัตกรรมและการแปรรูปดิจิทัล" },
  { id: "33", name: "วิทยาศาสตรบัณฑิต สาขาวิชาฟิสิกส์" },
  { id: "34", name: "วิทยาศาสตรบัณฑิต สาขาวิชาฟิสิกส์อิเล็กทรอนิกส์" },
  { id: "35", name: "วิทยาศาสตรบัณฑิต สาขาวิชาภูมิศาสตร์และภูมิสารสนเทศ" },
  { id: "36", name: "วิทยาศาสตรบัณฑิต สาขาวิชารังสีเทคนิค" },
  { id: "37", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวัสดุศาสตร์" },
  { id: "38", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์" },
  { id: "39", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการประกันภัย (ภาคพิเศษ)" },
  { id: "40", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์การกีฬาและการออกกำลังกาย" },
  { id: "41", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์สิ่งแวดล้อม" },
  { id: "42", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์อุตสาหการและการจัดการ (หลักสูตรนานาชาติ)" },
  { id: "43", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และนวัตกรรมข้อมูล" },
  { id: "44", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และนวัตกรรมทางอาหาร" },
  { id: "45", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และเทคโนโลยีการอาหาร" },
  { id: "46", name: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาศาสตร์และเทคโนโลยีสิ่งทอ" },
  { id: "47", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถาปัตยกรรม" },
  { id: "48", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถาปัตยกรรมเพื่อการพัฒนาอสังหาริมทรัพย์" },
  { id: "49", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ" },
  { id: "50", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ วิชาเอกวิทยาการวิเคราะห์ข้อมูล (ภาคพิเศษ)" },
  { id: "51", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสถิติ วิชาเอกสถิติประยุกต์ (ภาคพิเศษ)" },
  { id: "52", name: "วิทยาศาสตรบัณฑิต สาขาวิชาสาธารณสุขศาสตร์" },
  { id: "53", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอนามัย สิ่งแวดล้อม" },
  { id: "54", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอนามัยชุมชน" },
  { id: "55", name: "วิทยาศาสตรบัณฑิต สาขาวิชาอาชีวอนามัยและความปลอดภัย" },
  { id: "56", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเคมี" },
  { id: "57", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคนิคการแพทย์" },
  { id: "58", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีการจัดการ (หลักสูตรนานาชาติ)" },
  { id: "59", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีการเกษตร" },
  { id: "60", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีชีวภาพ" },
  { id: "61", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีดิจิทัลแนวสร้างสรรค์ (หลักสูตรนานาชาติ)" },
  { id: "62", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีทางคลินิก (หลักสูตรนานาชาติ)" },
  { id: "63", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีพลังงานชีวภาพและการแปรรูปเคมีชีวภาพ" },
  { id: "64", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ (หลักสูตรนานาชาติ)" },
  { id: "65", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีหัวใจและทรวงอก (หลักสูตรนานาชาติ)" },
  { id: "66", name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีเพื่อการพัฒนายั่งยืน" },
  { id: "67", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์" },
  { id: "68", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์ (หลักสูตรนานาชาติ)" },
  { id: "69", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมซอฟต์แวร์" },
  { id: "70", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมยานยนต์ (หลักสูตรภาคภาษาอังกฤษ)" },
  { id: "71", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอิเล็กทรอนิคส์และการสื่อสาร (หลักสูตรนานาชาติ)" },
  { id: "72", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ" },
  { id: "73", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (ภาคภาษาอังกฤษ)" },
  { id: "74", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
  { id: "75", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมอุตสาหการ (หลักสูตรนานาชาติ)" },
  { id: "76", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี" },
  { id: "77", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (ภาคภาษาอังกฤษ)" },
  { id: "78", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
  { id: "79", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเคมี (หลักสูตรนานาชาติ)" },
  { id: "80", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล" },
  { id: "81", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (ภาคภาษาอังกฤษ)" },
  { id: "83", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
  { id: "84", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมเครื่องกล (หลักสูตรนานาชาติ)" },
  { id: "85", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา" },
  { id: "86", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา (ภาคภาษาอังกฤษ)" },
  { id: "87", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธา (หลักสูตรนานาชาติ)" },
  { id: "88", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมโยธาและการบริหารการก่อสร้าง (ตรีควบโท)" },
  { id: "89", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า" },
  { id: "90", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า (ภาคภาษาอังกฤษ)" },
  { id: "91", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้า (ภาคภาษาอังกฤษ) (สองสถาบัน)" },
  { id: "92", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้าอุตสาหการ (ตรีควบโท)" },
  { id: "93", name: "วิศวกรรมศาสตรบัณฑิต สาขาวิชาเทคโนโลยียานยนต์ (พัทยา)" },
  { id: "94", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาการละคอน" },
  { id: "95", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาศิลปะการออกแบบพัสตราภรณ์" },
  { id: "96", name: "ศิลปกรรมศาสตรบัณฑิต สาขาวิชาศิลปะการออกแบบหัตถอุตสาหกรรม" },
  { id: "97", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการจัดการกีฬา" },
  { id: "98", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการจัดการมรดกวัฒนธรรมและอุตสาหกรรมสร้างสรรค์" },
  { id: "99", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการฝึกสอนกีฬา" },
  { id: "100", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการพัฒนาเชิงสร้างสรรค์" },
  { id: "101", name: "ศิลปศาสตรบัณฑิต สาขาวิชาการสื่อสารภาษาอังกฤษเชิงธุรกิจ (หลักสูตรนานาชาติ)" },
  { id: "102", name: "ศิลปศาสตรบัณฑิต สาขาวิชาจีนศึกษา (หลักสูตรนานาชาติ)" },
  { id: "103", name: "ศิลปศาสตรบัณฑิต สาขาวิชานวัตกรรมการบริการ (หลักสูตรนานาชาติ)" },
  { id: "104", name: "ศิลปศาสตรบัณฑิต สาขาวิชานโยบายสังคมและการพัฒนา (หลักสูตรนานาชาติ)" },
  { id: "105", name: "ศิลปศาสตรบัณฑิต สาขาวิชาบรรณารักษศาสตร์และสารสนเทศศาสตร์" },
  { id: "106", name: "ศิลปศาสตรบัณฑิต สาขาวิชาประวัติศาสตร์" },
  { id: "107", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา" },
  { id: "108", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา การเมือง และเศรษฐศาสตร์ (หลักสูตรนานาชาติ)" },
  { id: "109", name: "ศิลปศาสตรบัณฑิต สาขาวิชาปรัชญา การเมืองและเศรษฐศาสตร์" },
  { id: "110", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาญี่ปุ่น" },
  { id: "111", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาฝรั่งเศส" },
  { id: "112", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษารัสเซีย" },
  { id: "113", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาศาสตร์" },
  { id: "114", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาอังกฤษ" },
  { id: "115", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาเยอรมัน" },
  { id: "116", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาและวรรณคดีอังกฤษ" },
  { id: "117", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาและวัฒนธรรมจีน" },
  { id: "118", name: "ศิลปศาสตรบัณฑิต สาขาวิชาภาษาไทย" },
  { id: "119", name: "ศิลปศาสตรบัณฑิต สาขาวิชารัสเซียศึกษา" },
  { id: "120", name: "ศิลปศาสตรบัณฑิต สาขาวิชาวิทยาการเรียนรู้" },
  { id: "121", name: "ศิลปศาสตรบัณฑิต สาขาวิชาวิเทศคดีศึกษา (อาเซียน - จีน) (หลักสูตรนานาชาติ)" },
  { id: "122", name: "ศิลปศาสตรบัณฑิต สาขาวิชาสหวิทยาการสังคมศาสตร์" },
  { id: "123", name: "ศิลปศาสตรบัณฑิต สาขาวิชาอังกฤษ–อเมริกันศึกษา (หลักสูตรนานาชาติ)" },
  { id: "124", name: "ศิลปศาสตรบัณฑิต สาขาวิชา인เดียศึกษา (หลักสูตรนานาชาติ)" },
  { id: "125", name: "ศิลปศาสตรบัณฑิต สาขาวิชาเอเชียตะวันออกเฉียงใต้ศึกษา" },
  { id: "126", name: "ศิลปศาสตรบัณฑิต สาขาวิชาโลกคดีศึกษาและการประกอบการสังคม (ปริญญาตรี-หลักสูตรนานาชาติ)" },
  { id: "127", name: "ศิลปศาสตรบัณฑิต สาขาวิชาไทยศึกษา (หลักสูตรนานาชาติ)" },
  { id: "128", name: "สถาปัตยกรรมภายในบัณฑิต" },
  { id: "129", name: "สังคมวิทยาและมานุษยวิทยาบัณฑิต สาขาวิชาการวิจัยทางสังคม" },
  { id: "131", name: "สังคมวิทยาและมานุษยวิทยาบัณฑิต สาขาวิชาสังคมวิทยาและมานุษยวิทยา" },
  { id: "132", name: "สังคมสงเคราะห์ศาสตรบัณฑิต" },
  { id: "133", name: "เศรษฐศาสตรบัณฑิต" },
  { id: "134", name: "เศรษฐศาสตรบัณฑิต (หลักสูตรนานาชาติ)" },
  { id: "135", name: "แพทยศาสตรบัณฑิต" },
  { id: "136", name: "แพทยศาสตรบัณฑิต (หลักสูตรภาคภาษาอังกฤษ)" }
];