"use client";
import { Fragment, useEffect, useState } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { Combobox, Transition } from '@headlessui/react';
import { MdSwapVert, MdCheck } from "react-icons/md";

export function VehicleStep({ setStep }: { setStep: (s: number) => void }) {
  const { formResident, setFormResident, vehicle, setVehicle } = useBooking();
  const [mounted, setMounted] = useState(false);

  const [provinceQuery, setProvinceQuery] = useState('');

  const filteredProvinces = provinceQuery === ''
    ? PROVINCE_LIST
    : PROVINCE_LIST.filter((p) =>
      p.name_th.includes(provinceQuery) ||
      p.name_en.toLowerCase().includes(provinceQuery.toLowerCase())
    );

  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">Vehicle Registration / ข้อมูลรถยนต์</h2>

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
          <p className="text-[14px] text-gray-400 mb-3 uppercase tracking-tighter">ระบุหมวดอักษร และเลขทะเบียนโดยไม่ต้องเว้นวรรค หรือมีเครื่องหมายขีด เช่น 1กภ2345</p>
          <input
            type="text"
            placeholder="เช่น 1กภ2345"
            className="w-full border-b-2 border-gray-300 py-2 focus:border-[#006432] outline-none transition-colors font-medium"
          />
        </div>

        {/* อัปโหลดรายการจดทะเบียน */}
        <div>
          <p className="text-[14px] font-bold text-gray-700 mb-4 italic">Upload a photo of the vehicle registration file. / อัพโหลดภาพถ่ายรายการจดทะเบียนรถหน้าล่าสุด</p>
          <div className="flex items-center mb-4">
            <label className="bg-[#4CAF50] text-white px-6 py-2 rounded-l-lg cursor-pointer font-bold shrink-0">
              Choose File
              <input type="file" className="hidden" />
            </label>
            <div className="bg-gray-100 flex-grow py-2 px-4 rounded-r-lg text-gray-400 text-sm overflow-hidden whitespace-nowrap">
              Ads ... .png
            </div>
          </div>
          <div className="w-full h-40 bg-gray-200 rounded-3xl"></div>
        </div>

        {/* จังหวัด */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[16px] font-medium text-gray-700 mb-1">
            License Plate Province / จังหวัดที่จดทะเบียนรถ <span className="text-red-500">*</span>
          </label>

          {mounted ? (
            <Combobox
              value={vehicle?.province || ""}
              onChange={(val) => setVehicle(prev => ({ ...prev, province: val }))}
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
                  <Combobox.Button id="province-combobox-button" className="absolute inset-y-0 right-0 flex items-center pr-2 text-white/80">
                    <MdSwapVert size={20} />
                  </Combobox.Button>
                </div>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setProvinceQuery('')}
                >
                  <Combobox.Options className="custom-scrollbar absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                    {filteredProvinces.length === 0 && provinceQuery !== '' ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
                        ไม่พบข้อมูล "{provinceQuery}"
                      </div>
                    ) : (
                      filteredProvinces.map((p) => (
                        <Combobox.Option
                          key={p.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${active ? 'bg-[#006633] text-white' : 'text-gray-900'
                            }`
                          }
                          value={p.name_th}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-bold' : 'font-normal'}`}>
                                {p.name_th} <span className={`text-[10px] ml-1 ${active ? 'text-white/70' : 'text-gray-400'}`}>({p.name_en})</span>
                              </span>
                              {selected && (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-[#006633]'}`}>
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
          ) : (
            <div className="w-full h-[42px] bg-green-900/10 border border-gray-300 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* ปุ่มควบคุม */}
      <div className="flex gap-2 mt-12 text-[16px]">
        <button onClick={() => setStep(2)} className="flex-1 bg-[#7D856C] text-white px-6 py-2 rounded-xl shadow-lg">Back</button>
        <button onClick={() => setStep(4)} className="flex-1 bg-[#006633] text-white px-6 py-2 rounded-xl shadow-lg">Next</button>
      </div>
    </div>
  );
}

const PROVINCE_LIST = [
  { id: "1", name_th: "กรุงเทพมหานคร", name_en: "Bangkok" },
  { id: "2", name_th: "สมุทรปราการ", name_en: "Samut Prakan" },
  { id: "3", name_th: "นนทบุรี", name_en: "Nonthaburi" },
  { id: "4", name_th: "ปทุมธานี", name_en: "Pathum Thani" },
  { id: "5", name_th: "พระนครศรีอยุธยา", name_en: "Phra Nakhon Si Ayutthaya" },
  { id: "6", name_th: "อ่างทอง", name_en: "Ang Thong" },
  { id: "7", name_th: "ลพบุรี", name_en: "Lop Buri" },
  { id: "8", name_th: "สิงห์บุรี", name_en: "Sing Buri" },
  { id: "9", name_th: "ชัยนาท", name_en: "Chai Nat" },
  { id: "10", name_th: "สระบุรี", name_en: "Saraburi" },
  { id: "11", name_th: "ชลบุรี", name_en: "Chon Buri" },
  { id: "12", name_th: "ระยอง", name_en: "Rayong" },
  { id: "13", name_th: "จันทบุรี", name_en: "Chanthaburi" },
  { id: "14", name_th: "ตราด", name_en: "Trat" },
  { id: "15", name_th: "ฉะเชิงเทรา", name_en: "Chachoengsao" },
  { id: "16", name_th: "ปราจีนบุรี", name_en: "Prachin Buri" },
  { id: "17", name_th: "นครนายก", name_en: "Nakhon Nayok" },
  { id: "18", name_th: "สระแก้ว", name_en: "Sa Kaeo" },
  { id: "19", name_th: "นครราชสีมา", name_en: "Nakhon Ratchasima" },
  { id: "20", name_th: "บุรีรัมย์", name_en: "Buri Ram" },
  { id: "21", name_th: "สุรินทร์", name_en: "Surin" },
  { id: "22", name_th: "ศรีสะเกษ", name_en: "Si Sa Ket" },
  { id: "23", name_th: "อุบลราชธานี", name_en: "Ubon Ratchathani" },
  { id: "24", name_th: "ยโสธร", name_en: "Yasothon" },
  { id: "25", name_th: "ชัยภูมิ", name_en: "Chaiyaphum" },
  { id: "26", name_th: "อำนาจเจริญ", name_en: "Amnat Charoen" },
  { id: "27", name_th: "หนองบัวลำภู", name_en: "Nong Bua Lam Phu" },
  { id: "28", name_th: "ขอนแก่น", name_en: "Khon Kaen" },
  { id: "29", name_th: "อุดรธานี", name_en: "Udon Thani" },
  { id: "30", name_th: "เลย", name_en: "Loei" },
  { id: "31", name_th: "หนองคาย", name_en: "Nong Khai" },
  { id: "32", name_th: "มหาสารคาม", name_en: "Maha Sarakham" },
  { id: "33", name_th: "ร้อยเอ็ด", name_en: "Roi Et" },
  { id: "34", name_th: "กาฬสินธุ์", name_en: "Kalasin" },
  { id: "35", name_th: "สกลนคร", name_en: "Sakon Nakhon" },
  { id: "36", name_th: "นครพนม", name_en: "Nakhon Phanom" },
  { id: "37", name_th: "มุกดาหาร", name_en: "Mukdahan" },
  { id: "38", name_th: "เชียงใหม่", name_en: "Chiang Mai" },
  { id: "39", name_th: "ลำพูน", name_en: "Lamphun" },
  { id: "40", name_th: "ลำปาง", name_en: "Lampang" },
  { id: "41", name_th: "อุตรดิตถ์", name_en: "Uttaradit" },
  { id: "42", name_th: "แพร่", name_en: "Phrae" },
  { id: "43", name_th: "น่าน", name_en: "Nan" },
  { id: "44", name_th: "พะเยา", name_en: "Phayao" },
  { id: "45", name_th: "เชียงราย", name_en: "Chiang Rai" },
  { id: "46", name_th: "แม่ฮ่องสอน", name_en: "Mae Hong Son" },
  { id: "47", name_th: "นครสวรรค์", name_en: "Nakhon Sawan" },
  { id: "48", name_th: "อุทัยธานี", name_en: "Uthai Thani" },
  { id: "49", name_th: "กำแพงเพชร", name_en: "Kamphaeng Phet" },
  { id: "50", name_th: "ตาก", name_en: "Tak" },
  { id: "51", name_th: "สุโขทัย", name_en: "Sukhothai" },
  { id: "52", name_th: "พิษณุโลก", name_en: "Phitsanulok" },
  { id: "53", name_th: "พิจิตร", name_en: "Phichit" },
  { id: "54", name_th: "เพชรบูรณ์", name_en: "Phetchabun" },
  { id: "55", name_th: "ราชบุรี", name_en: "Ratchaburi" },
  { id: "56", name_th: "กาญจนบุรี", name_en: "Kanchanaburi" },
  { id: "57", name_th: "สุพรรณบุรี", name_en: "Suphan Buri" },
  { id: "58", name_th: "นครปฐม", name_en: "Nakhon Pathom" },
  { id: "59", name_th: "สมุทรสาคร", name_en: "Samut Sakhon" },
  { id: "60", name_th: "สมุทรสงคราม", name_en: "Samut Songkhram" },
  { id: "61", name_th: "เพชรบุรี", name_en: "Phetchaburi" },
  { id: "62", name_th: "ประจวบคีรีขันธ์", name_en: "Prachuap Khiri Khan" },
  { id: "63", name_th: "นครศรีธรรมราช", name_en: "Nakhon Si Thammarat" },
  { id: "64", name_th: "กระบี่", name_en: "Krabi" },
  { id: "65", name_th: "พังงา", name_en: "Phangnga" },
  { id: "66", name_th: "ภูเก็ต", name_en: "Phuket" },
  { id: "67", name_th: "สุราษฎร์ธานี", name_en: "Surat Thani" },
  { id: "68", name_th: "ระนอง", name_en: "Ranong" },
  { id: "69", name_th: "ชุมพร", name_en: "Chumphon" },
  { id: "70", name_th: "สงขลา", name_en: "Songkhla" },
  { id: "71", name_th: "สตูล", name_en: "Satun" },
  { id: "72", name_th: "ตรัง", name_en: "Trang" },
  { id: "73", name_th: "พัทลุง", name_en: "Phatthalung" },
  { id: "74", name_th: "ปัตตานี", name_en: "Pattani" },
  { id: "75", name_th: "ยะลา", name_en: "Yala" },
  { id: "76", name_th: "นราธิวาส", name_en: "Narathiwat" },
  { id: "77", name_th: "บึงกาฬ", name_en: "Bueng Kan" }
];