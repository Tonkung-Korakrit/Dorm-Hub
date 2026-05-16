// app/new-booing/components/Vehicle.tsx
"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { BookingStatus } from "@/utils/types";
import toast from "react-hot-toast"; // อย่าลืมเช็คว่ามี import toast ไว้ด้านบนสุดหรือยังนะครับ

// context
import { useBooking } from "@/app/contexts/BookingContext";

// component
import Container from "@/components/Container";

// hook
import { useScrollTop } from "@/hooks/useScrollTop";

// icons
import { MdSwapVert, MdCheck, MdClose, MdCloudUpload } from "react-icons/md";
import { PROVINCE_LIST } from "@/utils/constants";

export function VehicleStep({ setStep }: { setStep: (s: number) => void }) {
  const {
    formResident,
    setFormResident,
    // vehicle,
    // setVehicle,
    currentBooking,
    setCurrentBooking,
    isEditMode,
    setIsEditMode,
  } = useBooking();
  // const [mounted, setMounted] = useState(false);
  const editId = new URLSearchParams(window.location.search).get("edit");

  const [provinceQuery, setProvinceQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProvinces =
    provinceQuery === ""
      ? PROVINCE_LIST
      : PROVINCE_LIST.filter(
          (p) =>
            p.name_th.includes(provinceQuery) ||
            p.name_en.toLowerCase().includes(provinceQuery.toLowerCase()),
        );

  useScrollTop();

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const script = document.createElement("script");
  //     script.src = "https://cdn.jsdelivr.net/npm/eruda";
  //     document.body.appendChild(script);
  //     script.onload = () => {
  //       (window as any).eruda.init();
  //     };
  //   }
  // }, []);

  useEffect(() => {
    // 1. สร้างตัวแปรเช็คว่า "ผู้ใช้มีข้อมูลในฟอร์มแล้วหรือยัง?" (ถ้ามีทะเบียนรถแปลว่าโหลดมาแล้ว หรือกำลังกรอกอยู่)
    const isAlreadyLoaded = Boolean(
      formResident?.vehicleInfo?.licensePlate ||
      formResident?.vehicleInfo?.ownerName,
    );

    if (
      currentBooking?.status === BookingStatus.PENDING_CORRECTION &&
      currentBooking?.cus_users?.vehicleInfo &&
      !isEditMode &&
      !isAlreadyLoaded // 2. เพิ่มเงื่อนไขนี้: ถ้าโหลดแล้ว ห้ามดึงของเก่ามาทับอีก!
    ) {
      console.log(
        "2. Setting FormResident with:",
        currentBooking?.cus_users?.vehicleInfo,
      );
      setFormResident((prev) => ({
        ...prev,
        vehicleInfo: currentBooking?.cus_users?.vehicleInfo,
      }));

      // ❌ ลบโค้ด setPreviewImage(currentBooking...) ตรงนี้ทิ้งไปเลยครับ!
      // เพราะเดี๋ยว useEffect ตัวที่ 2 มันจะตรวจจับ formResident ที่เปลี่ยนไป แล้วไปสร้าง Preview ให้เองอย่างถูกต้องครับ
    }
  }, [
    currentBooking,
    setFormResident,
    isEditMode,
    formResident?.vehicleInfo?.licensePlate,
  ]);

  useEffect(() => {
    let objectUrl: string | null = null;

    // 1. เช็คไฟล์ใหม่ก่อน
    if (formResident?.vehicleInfo?.registrationFile instanceof File) {
      objectUrl = URL.createObjectURL(
        formResident.vehicleInfo.registrationFile,
      );
      setPreviewImage(objectUrl);
    } else if (formResident?.vehicleInfo?.path) {
      setPreviewImage(formResident.vehicleInfo.path);
    } else if (formResident?.vehicleInfo?.file_info?.path) {
      setPreviewImage(formResident.vehicleInfo.file_info.path);
    }
    // 3. ถ้าไม่มีทั้งคู่ ก็คือเป็นค่าว่าง
    else {
      setPreviewImage(null);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    formResident?.vehicleInfo?.registrationFile,
    formResident?.vehicleInfo?.path,
    formResident?.vehicleInfo?.file_info?.path,
  ]);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ลบช่องว่าง และอนุญาตเฉพาะ ก-ฮ, สระ, A-Z, 0-9
    const cleanValue = e.target.value.replace(/[^ก-๙a-zA-Z0-9]/g, "");

    // setVehicle((prev) => ({
    //   ...prev,
    //   licensePlate: cleanValue,
    // }));
    setFormResident((prev) => ({
      ...prev,
      vehicleInfo: {
        ...(prev.vehicleInfo || {}), // ดึงข้อมูลรถเดิมมาใส่ก่อน (กัน null)
        licensePlate: cleanValue, // อัปเดตฟิลด์ที่ต้องการ
      },
    }));
  };

  // ฟังก์ชันจัดการไฟล์
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // เซตไฟล์ลง Context อย่างเดียว เดี๋ยว useEffect ข้างบนจะสร้าง Preview ให้เอง
      // setVehicle((prev) => ({ ...prev, registrationFile: file }));
      //   setFormResident((prev) => ({
      //   ...prev,
      //   vehicleInfo: {
      //     ...(prev.vehicleInfo || {}),
      //     file_info: file,
      //     path: undefined,
      //   },
      // }));
      try {
        // โคลนนิ่งไฟล์ทันที! ดูดข้อมูลรูปเข้ามาเก็บใน RAM ของเว็บเรา (ป้องกันมือถือลบทิ้ง)
        const arrayBuffer = await file.arrayBuffer();
        const persistentFile = new File([arrayBuffer], file.name, {
          type: file.type,
        });
        setFormResident((prev) => ({
          ...prev,
          vehicleInfo: {
            ...(prev.vehicleInfo || {}),
            registrationFile: persistentFile, // เก็บเป็นไฟล์เพียวๆ ไว้ที่ตัวแปรนี้
            file_info: undefined, // เคลียร์รูปเก่าจาก DB ทิ้ง (เพราะผู้ใช้อัปโหลดรูปใหม่แล้ว)
          },
        }));
      } catch (err) {
        console.error("สร้างไฟล์โคลนไม่สำเร็จ:", err);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาลองเลือกรูปใหม่อีกครั้ง");
      }
    }
  };

  // const handleNextStep = () => {
  //   // ตรวจสอบความถูกต้องเบื้องต้น (ถ้ามีทะเบียน ต้องมีจังหวัดและรูป)
  //   // if (vehicle.licensePlate && (!vehicle.province || !previewImage)) {
  //   //   toast.error("กรุณาระบุข้อมูลรถให้ครบถ้วน หรือลบข้อมูลทะเบียนออกหากไม่ใช้รถ");
  //   //   return;
  //   // }

  //   if (editId || isEditMode) {
  //     // ถ้าเป็นโหมดแก้ไข ให้ข้ามไปหน้าสรุป (Step 7) เลย!
  //     setStep(7);
  //   } else {
  //     // โหมดจองปกติ ไปเลือกวิทยาเขตต่อ (Step 4)
  //     setStep(4);
  //   }
  // };

  const handleNextStep = () => {
    // const hasLicensePlate = Boolean(formResident.vehicleInfo?.licensePlate);
    // const hasProvince = Boolean(formResident.vehicleInfo?.province);
    const hasImage = Boolean(previewImage); // เช็คจาก previewImage ง่ายสุด เพราะมันคลุมทั้งไฟล์ใหม่และรูปเก่าแล้ว

    // ป้องกันบั๊ก: ถ้ามีทะเบียนรถ ต้องบังคับกรอกจังหวัดและอัปโหลดรูป!
    if (!hasImage) {
      toast.error(
        "กรุณาระบุจังหวัดและอัปโหลดรูปรายการจดทะเบียนรถให้ครบถ้วน หรือลบข้อมูลทะเบียนออกหากไม่ต้องการใช้รถ",
      );
      return; // เตะกลับ ไม่ให้ไปหน้าถัดไป
    }

    if (editId || isEditMode) {
      // ถ้าเป็นโหมดแก้ไข ให้ข้ามไปหน้าสรุป (Step 7) เลย!
      setStep(7);
    } else {
      // โหมดจองปกติ ไปเลือกวิทยาเขตต่อ (Step 4)
      setStep(4);
    }
  };

  const handleBackStep = () => {
    setStep(2);
  };

  console.log("formResident in vehicle: ", formResident);

  return (
    <Container
      title="Vehicle / ยานพาหนะ"
      pending_correction={
        currentBooking?.status === BookingStatus.PENDING_CORRECTION
      }
      handleNextStep={handleNextStep}
      handleBackStep={handleBackStep}
      isEditMode={isEditMode}
    >
      {/* คำเตือนสีแดง */}
      <div className="text-center text-red-500 text-[14px] font-bold space-y-1 mb-10 italic">
        <p>เฉพาะรถของนักศึกษาหรือผู้ปกครอง</p>
        <p>สำหรับการผ่านเข้าเขตที่พักอาศัยเท่านั้น</p>
        <p>มิใช่การอนุญาตให้จอดรถยนต์ค้างคืน</p>
      </div>

      <div className="space-y-4">
        {/* ทะเบียนรถ */}
        <div>
          <label className="block text-[16px] font-bold text-gray-700 mb-2">
            License Plate ID / ทะเบียนรถยนต์
          </label>
          <p className="text-[14px] text-gray-400 mb-3 uppercase tracking-tighter">
            ระบุหมวดอักษร และเลขทะเบียนโดยไม่ต้องเว้นวรรค หรือมีเครื่องหมายขีด
            เช่น 1กภ2345
          </p>
          <input
            type="text"
            value={formResident.vehicleInfo?.licensePlate || ""}
            onChange={handlePlateChange}
            // onBlur={(e) => {
            //   const value = e.target.value;
            //   let isInvalid = false;

            //   // เช็คเบื้องต้นว่าต้องไม่ว่าง และมีความยาวที่สมเหตุสมผล (เช่น 2-8 หลัก)
            //   if (value && (value.length < 2 || value.length > 8)) {
            //     isInvalid = true;
            //   }

            //   if (isInvalid) {
            //     if (!errors.includes("licensePlate")) setErrors([...errors, "licensePlate"]);
            //   } else {
            //     setErrors(errors.filter(item => item !== "licensePlate"));
            //   }
            // }}
            placeholder="เช่น 1กภ2345"
            className="w-full border-b-2 border-gray-200 py-2.5 focus:border-[#006432] outline-none transition-all font-bold text-lg placeholder:text-gray-300 placeholder:font-normal"
          />
          <p className="text-[10px] text-gray-400 font-medium">
            ระบุหมวดอักษรและเลขทะเบียนโดยไม่ต้องเว้นวรรค
          </p>
        </div>

        <div>
          <label className="block text-[16px] font-bold text-gray-700 mb-2">
            Vehicle Owner Name / ชื่อ-นามสกุลเจ้าของรถ
          </label>
          <input
            type="text"
            value={formResident.vehicleInfo?.ownerName || ""}
            onChange={(e) =>
              // setVehicle((prev) => ({ ...prev, ownerName: e.target.value }))
              setFormResident((prev) => ({
                ...prev,
                vehicleInfo: {
                  ...(prev.vehicleInfo || {}),
                  ownerName: e.target.value,
                },
              }))
            }
            placeholder="name-last name / ชื่อ-นามสกุล"
            className="w-full border-b-2 border-gray-200 py-2.5 focus:border-[#006432] outline-none transition-all font-bold text-lg placeholder:text-gray-300 placeholder:font-normal"
          />
          <p className="text-[10px] text-gray-400 font-medium">
            ระบุชื่อ-นามสกุลของผู้ครอบครองรถตามเล่มทะเบียน
          </p>
        </div>

        {/* อัปโหลดรายการจดทะเบียน */}
        <div>
          <label className="block text-[16px] font-bold text-gray-700 mb-4">
            Upload Vehicle Registration Photo / อัพโหลดภาพถ่ายรายการจดทะเบียนรถ
          </label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            onError={() => {
              // ถ้ารูปโหลดไม่ขึ้น (ติด 404) ให้เคลียร์ preview ทิ้งซะ
              setPreviewImage(null);
              setFormResident((prev) => ({
                ...prev,
                vehicleInfo: {
                  ...(prev.vehicleInfo || {}),
                  file_info: {
                    ...(prev.vehicleInfo?.file_info || {}),
                    path: undefined,
                  } as any,
                  path: undefined,
                  registrationFile: undefined,
                },
              }));
            }}
          />

          <div
            onClick={() => !previewImage && fileInputRef.current?.click()}
            className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${
              previewImage
                ? "border-transparent"
                : errors.includes("registrationImage")
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
            }`}
          >
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="Registration Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(null);
                    // setVehicle((prev) => ({
                    //   ...prev,
                    //   registrationFile: null, //undefined
                    //   path: null, //undefined
                    //   fileImages: "",
                    // }));
                    setFormResident((prev) => ({
                      ...prev,
                      vehicleInfo: {
                        ...(prev.vehicleInfo || {}),
                        registrationFile: undefined,
                        file_info: undefined,
                        path: undefined,
                      },
                    }));

                    // ล้างค่า input file เพื่อให้ผู้ใช้สามารถคลิกเลือก "ไฟล์เดิม" ซ้ำได้
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <MdClose size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <MdCloudUpload
                  size={48}
                  className={`mx-auto mb-2 ${errors.includes("registrationImage") ? "text-red-300" : "text-gray-300"}`}
                />
                <p
                  className={`${errors.includes("registrationImage") ? "text-red-500" : "text-gray-400"} text-sm font-bold`}
                >
                  คลิกเพื่ออัปโหลดรูปรายการจดทะเบียน
                </p>
              </div>
            )}
          </div>
        </div>

        {/* จังหวัด */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-bold text-gray-700 mb-2">
            License Plate Province / จังหวัดที่จดทะเบียนรถ
          </label>

          <span className="text-[12px] text-red-500">
            *สามารถพิมพ์เพื่อค้นหาได้ ไม่ต้องเลื่อนหาเองให้ปวดตา
          </span>

          {/* {mounted ? ( */}
          <Combobox
            value={formResident?.vehicleInfo?.province || ""}
            onChange={(val) =>
              // setVehicle((prev) => ({ ...prev, province: val }))
              setFormResident((prev) => ({
                ...prev,
                vehicleInfo: {
                  ...(prev.vehicleInfo || {}),
                  province: val,
                },
              }))
            }
          >
            <div className="relative mt-1">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-[#006633] text-white focus-within:ring-2 focus-within:ring-green-400 transition-all">
                <Combobox.Input
                  id="province-combobox-input"
                  className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-white bg-transparent focus:ring-0 outline-none placeholder:text-white/60"
                  displayValue={(val: string) => val}
                  onChange={(event) => setProvinceQuery(event.target.value)}
                  placeholder="พิมพ์ชื่อจังหวัด (ไทย/Eng)..."
                  autoComplete="off"
                />
                <Combobox.Button
                  id="province-combobox-button"
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-white/80"
                >
                  <MdSwapVert size={20} />
                </Combobox.Button>
              </div>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setProvinceQuery("")}
              >
                <Combobox.Options className="custom-scrollbar absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                  {filteredProvinces.length === 0 && provinceQuery !== "" ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
                      ไม่พบข้อมูล "{provinceQuery}"
                    </div>
                  ) : (
                    filteredProvinces.map((p) => (
                      <Combobox.Option
                        key={p.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                            active ? "bg-[#006633] text-white" : "text-gray-900"
                          }`
                        }
                        value={p.name_th}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-bold" : "font-normal"}`}
                            >
                              {p.name_th}{" "}
                              <span
                                className={`text-[10px] ml-1 ${active ? "text-white/70" : "text-gray-400"}`}
                              >
                                ({p.name_en})
                              </span>
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-white" : "text-[#006633]"}`}
                              >
                                <MdCheck size={18} />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      </div>
    </Container>
  );
}
