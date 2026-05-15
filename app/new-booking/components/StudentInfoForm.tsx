// app/new-booking/components/StudentInfoForm.tsx
"use client";

import React, { useEffect, ChangeEvent, Dispatch, SetStateAction } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import {
  BookingStatus,
  CitizenType,
  AddressType,
  Address,
} from "@/utils/types";

// alert
import toast from "react-hot-toast";

// components
import Container from "@/components/Container";
import FormInput from "@/components/Personal_Info/Input";
import FormSelect from "@/components/Personal_Info/Select";
import FormCheckbox from "@/components/Personal_Info/Checkbox";
import BirthDateInput from "@/components/Personal_Info/BirthDateInput";
import FacultyCombobox from "@/components/Personal_Info/FacultyCombobox";

// hooks
import useStudentForm from "@/hooks/useStudentForm";
import { useScrollTop } from "@/hooks/useScrollTop";
import { COUNTRY_OPTIONS } from "@/utils/constants";

interface StudentInfoFormProps {
  setStep: Dispatch<SetStateAction<number>>;
}

export const StudentInfoForm = ({ setStep }: StudentInfoFormProps) => {
  const { formResident, setFormResident, isEditMode, currentBooking } =
    useBooking();

  const {
    errors,
    setErrors,
    errorValidate,
    isLocked,
    handleChange,
    handleFieldBlur,
  } = useStudentForm();

  useScrollTop();

  // console.log("formResident: " ,formResident)
  // console.log("currentBooking: " ,currentBooking)

  // แก้ปัญหา Hydration 100%: เช็คว่า Component Mount หรือยัง
  // const [mounted, setMounted] = useState(false);

  // กรณีการจองโดนปฏิเสธมาให้ แก้ไขเฉพาะข้อมูลส่วนตัวของ user
  useEffect(() => {
    if (currentBooking && currentBooking?.status === BookingStatus.REJECTED) {
      // นำข้อมูลจาก DB มาใส่ในฟอร์มเพื่อให้ User แก้ไขเฉพาะจุด
      setFormResident((prev) => ({
        ...prev,
        ...currentBooking.cus_users,
      }));
    }
  }, [currentBooking, setFormResident]);

  const handleAddressChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === "postalCode" ? value.replace(/\D/g, "").slice(0, 5) : value;

    if (errors.includes(name)) {
      setErrors((prevErrors) => prevErrors.filter((item) => item !== name));
    }

    setFormResident((prev) => {
      const nextAddress =
        prev.address && prev.address.length > 0
          ? [...prev.address]
          : [
              {
                id: 0,
                type: AddressType.CURRENT,
                addressDetail: "",
                subDistrict: "",
                district: "",
                province: "",
                postalCode: "",
                country: "Thailand",
              },
            ];

      nextAddress[0] = {
        ...nextAddress[0],
        [name]: normalizedValue,
      };

      return {
        ...prev,
        address: nextAddress,
      };
    });
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    // รายการฟีลด์ที่ต้องตรวจสอบก่อนอนุญาตให้ไปขั้นตอนถัดไป
    e?.preventDefault();
    const requiredFields = [
      "citizenType",
      "citizenNumber",
      "studentId",
      "gender",
      "faculty_department",
      "titleName",
      "name_th",
      "name_en",
      "email",
      "birthDate",
      "mobilePhone",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formResident[field],
    );
    const addressRequiredFields = [
      "type",
      "addressDetail",
      "subDistrict",
      "district",
      "province",
      "postalCode",
      "country",
    ];

    const missingAddressFields = addressRequiredFields.filter((field) => {
      // !formResident.address[0]?.[field as keyof Address]);
      const address0 = formResident.address?.[0];
      if (!address0) return true;
      return !address0[field as keyof Address];
    });

    if (missingFields.length > 0) {
      setErrors(missingFields);
      toast.error(
        "Please fill in all the student information highlighted in red.",
        {
          position: "top-center",
          duration: 2000,
          id: "validation-error",
        },
      );
      return;
    }

    if (missingAddressFields.length > 0) {
      setErrors((prevErrors) =>
        Array.from(new Set([...prevErrors, ...missingAddressFields])),
      );
      toast.error("Please fill in all the address fields highlighted in red.", {
        position: "top-center",
        duration: 2000,
        id: "address-validation-error",
      });
      return;
    }

    // เช็คว่าใน errors array มีฟิลด์ที่เกี่ยวกับความซ้ำ (ที่เราเซ็ตไว้ตอน onBlur) หรือไม่
    const hasUniqueErrors = errors.some((err) =>
      ["citizenNumber", "studentId", "email"].includes(err),
    );

    if (hasUniqueErrors) {
      toast.error(
        "ข้อมูลบางอย่างไม่ถูกต้อง หรือถูกใช้งานไปแล้ว โปรดแก้ไขในไฮไลต์สีแดง",
        {
          position: "top-center",
          duration: 2000,
          id: "unique-data-error",
        },
      );
      return;
    }

    const passportLength = [7, 8, 9];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (
      formResident.citizenType === CitizenType.CITIZEN_ID &&
      formResident.citizenNumber.length !== 13
    ) {
      toast.error("เลขบัตรประชาชนต้องมี 13 หลัก", {
        position: "top-center",
        duration: 2000,
        id: "citizen-id-error",
      });
      return;
    }

    if (
      formResident.citizenType === CitizenType.PASSPORT &&
      !passportLength.includes(formResident.citizenNumber.length)
    ) {
      toast.error("A passport must contain 7-9 digits.", {
        position: "top-center",
        duration: 2000,
        id: "passport-error",
      });
      return;
    }

    if (formResident.name_th && !formResident.name_th.trim().includes(" ")) {
      toast.error(
        "กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย 1 (เว้นวรรคระหว่างชื่อ และนามสกุล)",
        {
          id: "name-th-error",
        },
      );
      return;
    }

    // เช็คชื่อภาษาอังกฤษด้วย (ถ้าต้องการ)
    if (formResident.name_en && !formResident.name_en.trim().includes(" ")) {
      toast.error("Please enter both First name and Surname (English)", {
        id: "name-en-error",
      });
      return;
    }

    if (!emailRegex.test(formResident.email)) {
      toast.error("Invalid email format.", {
        position: "top-center",
        duration: 2000,
        id: "email-error",
      });
      return;
    }

    if (!phoneRegex.test(formResident.mobilePhone)) {
      toast.error("Phone number must be 10 digits.", {
        position: "top-center",
        duration: 2000,
        id: "phone-error",
      });
      return;
    }

    setErrors([]);
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

  // console.log("currentBooking in student: ", currentBooking)

  return (
    <Container
      title="Student Information / ข้อมูลนักศึกษา"
      pending_correction={
        currentBooking?.status === BookingStatus.PENDING_CORRECTION
      }
      href={"/my-booking"}
      handleNextStep={handleNextStep}
      isEditMode={isEditMode}
    >
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
      <div className="col-span-2">
        <div className="flex flex-col sm:flex-row sm:gap-4">
          {/* Citizen Type */}
          <FormSelect
            label="Identification / ข้อมูลระบุตัวตน"
            error={errors.includes("citizenType")}
            value={formResident.citizenType || ""}
            name="citizenType"
            onChange={handleChange}
            className=""
            required={true}
            suppressHydrationWarning
          >
            <option value="" disabled hidden>
              -- Select card type --
            </option>
            <option value={CitizenType.CITIZEN_ID}>เลขประจำตัวประชาชน</option>
            <option value={CitizenType.PASSPORT}>
              Passport (Foreign Student)
            </option>
          </FormSelect>

          {/* Citizen Number */}
          <FormInput
            label=""
            error={errors.includes("citizenNumber")}
            className="sm:mt-[22px]"
            name="citizenNumber"
            type="text"
            value={formResident.citizenNumber || ""}
            placeholder={
              formResident.citizenType === CitizenType.PASSPORT
                ? "Passport Number"
                : "เลขบัตรประชาชน 13 หลัก"
            }
            onChange={handleChange}
            onBlur={(e) => handleFieldBlur("citizenNumber", e.target.value)}
            onInput={(e) => {
              e.currentTarget.value =
                formResident.citizenType === CitizenType.PASSPORT
                  ? e.currentTarget.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .toUpperCase()
                  : e.currentTarget.value.replace(/[^0-9]/g, "");
            }}
            validateMessage={errorValidate.citizenNumber}
            disabled={!formResident.citizenType}
            minLength={
              formResident.citizenType === CitizenType.PASSPORT ? 8 : 13
            }
            maxLength={
              formResident.citizenType === CitizenType.PASSPORT ? 15 : 13
            }
            suppressHydrationWarning
          />

          {/* {errors.includes("citizenNumber") && (
            <p className="text-red-500 text-xs mb-2 animate-pulse">
              * {errorValidate.citizenNumber || "กรุณากรอกเลขบัตรประจำตัวประชาชน หรือ Passport number ให้ถูกต้อง"}
            </p>
          )} */}
        </div>
      </div>

      {/* Student ID */}
      <div className="col-span-2">
        <FormInput
          label="Student ID / เลขทะเบียนนักศึกษา"
          error={errors.includes("studentId")}
          className=""
          name="studentId"
          type="text"
          value={formResident.studentId || ""}
          placeholder={"68xxxxxxxx"}
          onChange={handleChange}
          onBlur={(e) => handleFieldBlur("studentId", e.target.value)}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(
              /[^0-9]/g,
              "",
            );
          }}
          minLength={10}
          maxLength={10}
          validateMessage={errorValidate.studentId}
          // disabled={!formResident.studentId}
          required={true}
          suppressHydrationWarning
        />

        {/* {errors.includes("studentId") && (
          <p className="text-red-500 text-xs mb-2 animate-pulse">
            * {errorValidate.studentId || "กรุณากรอกเลขทะเบียนนักศึกษาให้ถูกต้อง (10 หลัก)"}
          </p>
        )} */}
      </div>

      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2">
        {/* Scholarship Checkbox เป็นนักศึกษาทุนมั้ย*/}
        <FormCheckbox
          label="Scholarship / เป็นนักศึกษาทุน หรือไม่"
          description={"Scholarship / เป็นนักศึกษาทุน"}
          className=""
          name="isScholarshipStudent"
          checked={formResident.isScholarshipStudent || false}
          onChange={handleChange}
          // disabled={!formResident.isScholarshipStudent}
          suppressHydrationWarning
        />

        {/* Disability Checkbox เป็นนักศึกษาพิการทางร่างกายมั้ย*/}
        <FormCheckbox
          label="Disability / เป็นนักศึกษาพิการทางร่างกาย หรือไม่"
          description={"Disability / เป็นนักศึกษาพิการทางร่างกาย"}
          className=""
          name="isDisabled"
          checked={formResident.isDisabled || false}
          onChange={handleChange}
          // disabled={!formResident.isDisabled}
          suppressHydrationWarning
        />
      </div>

      {/* Gender + Prefix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 col-span-2 gap-x-4">
        <div>
          <FormSelect
            label="Gender / เพศสภาวะ"
            error={errors.includes("gender")}
            className={`${isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-[#006633]"}`}
            name="gender"
            value={formResident.gender || ""}
            onChange={handleChange}
            disabled={isLocked}
            required={true}
            suppressHydrationWarning
          >
            <option value="" disabled hidden>
              -- Select your gender --
            </option>
            <option value={"MALE"}>Male - ชาย</option>
            <option value={"FEMALE"}>Female - หญิง</option>
            <option value={"LGBTQ"}>LGBTQ+ - เพศทางเลือก</option>
          </FormSelect>
          {/* {errors.includes("gender") && (
            <p className="text-red-500 text-xs mb-2 animate-pulse">
              * "กรุณาเลือกเพศสภาวะของคุณด้วย"
            </p>
          )} */}
        </div>

        <div>
          <FormSelect
            label="Title Name / คำนำหน้าชื่อ"
            key={formResident.gender}
            error={errors.includes("titleName")}
            className={`${isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-[#006633]"}`}
            name="titleName"
            value={formResident.titleName || ""}
            onChange={handleChange}
            disabled={isLocked || !formResident.gender}
            required={true}
            suppressHydrationWarning
          >
            <option value="" disabled hidden>
              -- Prefix --
            </option>
            {formResident.gender === "MALE" && (
              <option value="Mr.">Mr. - นาย</option>
            )}

            {formResident.gender === "FEMALE" && (
              <>
                <option value="Ms.">Ms. - นางสาว</option>
                <option value="Mrs.">Mrs. - นาง</option>
              </>
            )}

            {(formResident.gender === "LGBTQ" ||
              formResident.gender === "OTHER") && (
              <>
                <option value="Mr.">Mr. - นาย</option>
                <option value="Ms.">Ms. - นางสาว</option>
                <option value="Mrs.">Mrs. - นาง</option>
              </>
            )}
          </FormSelect>
          {/* {errors.includes("titleName") && (
            <p className="text-red-500 text-xs mb-2 animate-pulse">
              * "กรุณาเลือกคำนำหน้าชื่อของคุณด้วย"
            </p>
          )} */}
        </div>
      </div>

      {/* Name TH */}
      <div className="col-span-2 md:col-span-1">
        <FormInput
          label="Name - Surname (TH) / ชื่อ - สกุล (ภาษาไทย)"
          error={errors.includes("name_th")}
          className=""
          name="name_th"
          type="text"
          value={formResident.name_th || ""}
          placeholder="ชื่อ-สกุล (ภาษาไทย)"
          onChange={handleChange}
          onBlur={(e) => handleFieldBlur("name_th", e.target.value)}
          onInput={(e) => {
            let value = (e.currentTarget.value = e.currentTarget.value.replace(
              /[^ก-๙\s]/g,
              "",
            ));
            value = value.replace(/^\s+/, "");
            value = value.replace(/\s\s+/g, " ");
            e.currentTarget.value = value;
          }}
          // disabled={!formResident.name_th}
          minLength={2}
          maxLength={100}
          required={true}
          suppressHydrationWarning
        />

        {/* {errors.includes("name_th") && (
          <p className="text-red-500 text-xs mb-2 animate-pulse">
            * กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย (และเว้นวรรคให้ถูกต้อง)
          </p>
        )} */}
      </div>

      {/* Name EN */}
      <div className="col-span-2 md:col-span-1">
        <FormInput
          label="Name - Surname (ENG) / ชื่อ - สกุล (ภาษาอังกฤษ)"
          error={errors.includes("name_en")}
          className=""
          name="name_en"
          type="text"
          value={formResident.name_en || ""}
          placeholder="Name-Surname(English)"
          onChange={handleChange}
          onBlur={(e) => handleFieldBlur("name_en", e.target.value)}
          onInput={(e) => {
            let value = e.currentTarget.value.replace(/[^a-zA-Z\s]/g, "");
            value = value.replace(/^\s+/, "");
            value = value.replace(/\s\s+/g, " ");

            // แยกคำด้วยช่องว่าง เพื่อทำตัวพิมพ์ใหญ่ตัวแรกของทุกคำ
            const words = value.split(" ");
            const capitalizedWords = words.map((word) => {
              if (word.length === 0) return "";
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            });

            e.currentTarget.value = capitalizedWords.join(" ");
          }}
          // disabled={!formResident.name_en}
          minLength={2}
          maxLength={100}
          required={true}
          suppressHydrationWarning
        />
        {/* {errors.includes("name_en") && (
          <p className="text-red-500 text-xs mb-2 animate-pulse">
            * กรุณากรอกทั้งชื่อ และนามสกุลภาษาอังกฤษ (และเว้นวรรคให้ถูกต้อง)
          </p>
        )} */}
      </div>

      {/* Birth Date */}
      <BirthDateInput
        value={formResident.birthDate ? new Date(formResident.birthDate) : null}
        onChange={(date) =>
          setFormResident((prev) => ({ ...prev, birthDate: date }))
        }
        onBlur={() => handleFieldBlur("birthDate", formResident.birthDate)}
        error={errors.includes("birthDate")}
      />

      {/* Phone */}
      <div className="col-span-2 md:col-span-1">
        <FormInput
          label="Mobile No. / เบอร์โทรศัพท์มือถือ"
          error={errors.includes("mobilePhone")}
          className=""
          name="mobilePhone"
          type="tel"
          value={formResident.mobilePhone || ""}
          placeholder="08X-XXX-XXXX"
          onChange={handleChange}
          onBlur={(e) => handleFieldBlur("mobilePhone", e.target.value)}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(
              /[^0-9]/g,
              "",
            );
          }}
          // disabled={!formResident.mobilePhone}
          minLength={10}
          maxLength={10}
          required={true}
          suppressHydrationWarning
        />
        {/* {errors.includes("mobilePhone") && (
          <p className="text-red-500 text-xs animate-pulse">
            * กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องมี 10 หลัก)
          </p>
        )} */}
      </div>

      {/* Email */}
      <div className="col-span-2">
        <FormInput
          label="Email / อีเมล"
          error={errors.includes("email")}
          className=""
          name="email"
          type="email"
          value={formResident.email || ""}
          placeholder="example@email.com"
          onChange={handleChange}
          onBlur={(e) => handleFieldBlur("email", e.target.value)}
          onInput={(e) =>
            (e.currentTarget.value = e.currentTarget.value
              .replace(/[^a-zA-Z0-9._%+-@]/g, "")
              .toLowerCase())
          }
          validateMessage={errorValidate.email}
          disabled={!!formResident.email}
          minLength={2}
          maxLength={50}
          required={true}
          suppressHydrationWarning
        />
        {/* {errors.includes("email") && (
          <p className="text-red-500 text-xs mt-1 animate-pulse">
            * {errorValidate.email || "รูปแบบอีเมลไม่ถูกต้อง (เช่น example@email.com)"}
          </p>
        )} */}
      </div>

      <FacultyCombobox
        value={formResident.faculty_department || ""}
        onChange={(val) =>
          setFormResident((prev) => ({ ...prev, faculty_department: val }))
        }
        error={errors.includes("faculty_department")}
      />

      <div className="col-span-2 mt-2">
        <label className="block text-[16px] font-medium text-gray-700 mb-1">
          Address / ที่อยู่ <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Address Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color ${errors.includes("type") ? "border-red-500 border-2" : "border-gray-300"}`}
              name="type"
              value={formResident.address?.[0]?.type || AddressType.CURRENT}
              onChange={handleAddressChange}
              required
            >
              <option value={AddressType.REGISTERED}>
                Registered / ตามทะเบียนบ้าน
              </option>
              <option value={AddressType.CURRENT}>
                Current / ที่อยู่ปัจจุบัน
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color placeholder:text-gray-400 ${errors.includes("postalCode") ? "border-red-500 border-2" : "border-gray-300"}`}
              placeholder="10110"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              name="postalCode"
              value={formResident.address?.[0]?.postalCode || ""}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Address Detail <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color placeholder:text-gray-400 ${errors.includes("addressDetail") ? "border-red-500 border-2" : "border-gray-300"}`}
              placeholder="บ้านเลขที่,ซอย,หมู่,ถนน"
              type="text"
              name="addressDetail"
              value={formResident.address?.[0]?.addressDetail || ""}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Sub-district <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color placeholder:text-gray-400 ${errors.includes("subDistrict") ? "border-red-500 border-2" : "border-gray-300"}`}
              placeholder="แขวง / ตำบล"
              type="text"
              name="subDistrict"
              value={formResident.address?.[0]?.subDistrict || ""}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color placeholder:text-gray-400 ${errors.includes("district") ? "border-red-500 border-2" : "border-gray-300"}`}
              placeholder="เขต / อำเภอ"
              type="text"
              name="district"
              value={formResident.address?.[0]?.district || ""}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Province <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color placeholder:text-gray-400 ${errors.includes("province") ? "border-red-500 border-2" : "border-gray-300"}`}
              placeholder="กรุงเทพมหานคร"
              type="text"
              name="province"
              value={formResident.address?.[0]?.province || ""}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006633] text-black transition-color ${errors.includes("country") ? "border-red-500 border-2" : "border-gray-300"}`}
              name="country"
              value={formResident.address?.[0]?.country || "Thailand"}
              onChange={handleAddressChange}
              suppressHydrationWarning
              required
            >
              <option value="" disabled>
                Select country
              </option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
              {formResident.address?.[0]?.country &&
                !COUNTRY_OPTIONS.includes(
                  formResident.address?.[0]?.country,
                ) && (
                  <option value={formResident.address?.[0]?.country}>
                    {formResident.address?.[0]?.country}
                  </option>
                )}
            </select>
          </div>
        </div>
      </div>
    </Container>
  );
};
