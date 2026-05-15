import React, { ChangeEvent, useState } from "react";
import { useBooking } from "../app/contexts/BookingContext";
import { BookingStatus, CitizenType, GenderType } from "@/utils/types";
import { FACULTY_LIST } from "@/utils/constants";
import { customFetch } from "@/utils/custom-api";
import toast from "react-hot-toast";

const useStudentForm = () => {
  const { formResident, setFormResident, isEditMode, currentBooking } =
    useBooking();
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState([]);
  const isLocked = currentBooking?.status === BookingStatus.PENDING_CORRECTION;
  const [isChecking, setIsChecking] = useState(false);
  const [errorValidate, setErrorValidate] = useState({
    citizenNumber: "",
    studentId: "",
    email: "",
    isDuplicate: false,
  });

  // const {
  //   modalConfig, isLogout, state, isCancelling,
  //   handleLogout, openCancelModal, closeModal
  // } = useBookingActions(initialBooking?.id, initialBooking?.status);

  const filteredFaculty =
    query === ""
      ? FACULTY_LIST
      : FACULTY_LIST.filter((faculty) =>
          faculty.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, "")),
        );

  // คำนวณวันที่ถอยหลังจากวันนี้ไป 18 ปี
  const today = new Date();
  const maxAllowedDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  // useEffect(() => {
  //   // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // }, []);

  // แก้ปัญหา Hydration 100%: เช็คว่า Component Mount หรือยัง
  // const [mounted, setMounted] = useState(false);
  // useEffect(() => {
  //   setMounted(true);
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // }, []);

  // กรณีการจองโดนปฏิเสธมาให้ แก้ไขเฉพาะข้อมูลส่วนตัวของ user
  // useEffect(() => {
  //   if (currentBooking && currentBooking.status === BookingStatus.REJECTED) {
  //     // นำข้อมูลจาก DB มาใส่ในฟอร์มเพื่อให้ User แก้ไขเฉพาะจุด
  //     setFormResident((prev) => ({
  //       ...prev,
  //       ...currentBooking.cus_users,
  //     }));
  //   }
  // }, [currentBooking, setFormResident]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    const finalValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked // ถ้าเป็น checkbox ให้ใช้ค่า checked (true/false)
        : value;

    if (errors.includes(name)) {
      setErrors((prevErrors) => prevErrors.filter((item) => item !== name));
    }

    if (name === "gender") {
      setFormResident((prev) => ({
        ...prev,
        gender: finalValue as GenderType,
        titleName: "",
      }));
    } else {
      // setFormResident((prev: any) => ({ ...prev, [name]: value }));
      setFormResident((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    }
  };

  const checkUniqueValue = async (fieldName, value) => {
    if (!value) return;

    setIsChecking(true);
    try {
      const res = await customFetch(
        `/api/validate?type=${fieldName}&value=${value}`,
      );
      const data = await res.json();

      if (data.isDuplicate) {
        if (!errors.includes(fieldName)) {
          setErrors((prev) => [...prev, fieldName]);
        }
        setErrorValidate(prev => ({ ...prev, [fieldName]: { message: data.message, isDuplicate: data.isDuplicate } }));
      } else {
        setErrors(prev => prev.filter(item => item !== fieldName));
        setErrorValidate(prev => ({ ...prev, [fieldName]: { message: data.message, isDuplicate: data.isDuplicate } }));
      }
    } catch (err) {
      console.error("Check unique error", err);
    } finally {
      setIsChecking(false);
    }
  };

  // const handleNextStep = (setStep: (React.Dispatch<React.SetStateAction<number>>)) => {
  const handleNextStep = (setStep: (step: number) => void) => {
    // รายการฟีลด์ที่ต้องตรวจสอบก่อนอนุญาตให้ไปขั้นตอนถัดไป
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

    const nameTh = formResident.name_th?.trim() || "";
    const nameParts = nameTh.split(/\s+/); // แยกด้วยช่องว่าง (กี่ช่องก็ได้)
    if (nameTh && nameParts.length < 2) {
      // if (formResident.name_th && !formResident.name_th.trim().includes(' ')) {
      toast.error(
        "กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย (เว้นวรรคระหว่างชื่อ และนามสกุล)",
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

  // console.log("currentBooking in StudenInfoForm: ", currentBooking);

  const handleFieldBlur = (name, value) => {
    let isInvalid = false;

    switch (name) {
      case "citizenNumber":
        if (value) {
          if (formResident.citizenType === CitizenType.CITIZEN_ID) {
            if (value.length !== 13) isInvalid = true;
          } else if (formResident.citizenType === CitizenType.PASSPORT) {
            const passportRegex = /^[a-zA-Z0-9]{7,9}$/;
            if (!passportRegex.test(value)) isInvalid = true;
          }
        }
        break;

      case "studentId":
        if (value && value.length !== 10) isInvalid = true;
        break;

      case "name_th":
        // const thaiRegex = /^[ก-๙\s]+$/;
        // if (value && !thaiRegex.test(value)) isInvalid = true;
        // break;
        if (value) {
          const thaiCharRegex = /^[ก-๙\s]+$/;
          const trimmedValue = value.trim();

          // เช็ค 2 เงื่อนไข:
          // 1. ต้องเป็นภาษาไทย/ช่องว่างเท่านั้น
          // 2. ต้องมีช่องว่างอย่างน้อย 1 ที่ (เพื่อแยกชื่อ-นามสกุล)
          const isThai = thaiCharRegex.test(trimmedValue);
          const hasSpace = trimmedValue.includes(" ");

          if (!isThai || !hasSpace) {
            isInvalid = true;
          }
        }
        break;

      case "name_en":
        // const engRegex = /^[a-zA-Z\s]+$/;
        // if (value && !engRegex.test(value)) isInvalid = true;
        // break;
        if (value) {
          // 1. Regex เช็คเฉพาะ A-Z, a-z และช่องว่าง
          const engCharRegex = /^[a-zA-Z\s]+$/;
          const trimmedValue = value.trim();

          // 2. เช็คว่าเป็นภาษาอังกฤษทั้งหมดหรือไม่
          const isEnglish = engCharRegex.test(trimmedValue);

          // 3. เช็คว่ามีช่องว่างอย่างน้อย 1 ที่หรือไม่ (เพื่อแยก First name - Surname)
          const hasSpace = trimmedValue.includes(" ");

          if (!isEnglish || !hasSpace) {
            isInvalid = true;
          }
        }
        break;

      case "mobilePhone":
        const phoneRegex = /^0[0-9]{9}$/;
        if (value && !phoneRegex.test(value)) isInvalid = true;
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) isInvalid = true;
        break;

      case "birthDate":
        if (!value) isInvalid = true;
        break;

      case "faculty_department":
        if (!value || value.trim() === "") isInvalid = true;
        break;

      default:
        break;
    }

    if (isInvalid) {
      if (!errors.includes(name)) {
        setErrors([...errors, name]);
      }
    } else {
      // ถ้าข้อมูลถูกต้อง ให้ลบชื่อ Field ออกจาก Array Errors
      setErrors(errors.filter((item) => item !== name));

      const uniqueFields = ["citizenNumber", "studentId", "email"];
      if (value && uniqueFields.includes(name)) {
        checkUniqueValue(name, value);
      }
    }
  };

  return {
    query,
    setQuery,
    errors,
    setErrors,
    errorValidate,
    isLocked,
    isChecking,
    filteredFaculty,
    handleChange,
    handleFieldBlur,
  };
};

export default useStudentForm;
