import React from 'react'
import FormSelect from './Select';

interface FormProps {
  title: string;
  CitizenType: any;
  formResident: any;
  errors: string[];
  errorValidate: any;
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
  handleChange: (e: React.ChangeEvent<any>) => void;
  checkUniqueValue: (name: string, value: string) => void;
}

const Form = ({title, errors, setErrors, CitizenType, formResident, handleChange, checkUniqueValue, errorValidate}: FormProps) => {
  console.log("errors: ", errors);
  console.log("CitizenType: ", CitizenType);
  console.log("formResident: ", formResident);
  // console.log("handleChange: ", handleChange);
  // console.log("checkUniqueValue: ", checkUniqueValue);
  console.log("errorValidate: ", errorValidate);
  return (
    <div className="col-span-2" >
      <label className="block text-[16px] font-medium text-gray-700 mb-1">
        {title} <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {/* <select
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
        </select> */}
        {/* <FormSelect /> */}

        <input
          className={`w-full sm:w-2/3 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none 
                  transition-color focus:ring-2 focus:ring-[#006633] text-black placeholder:text-gray-400 
                  ${errors.includes("citizenNumber") ? "border-red-500 border-2" : ""}`}
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
            }
            // else {
            //   setErrors(errors.filter((item) => item !== "citizenNumber"));
            // }
            else {
              // ถ้า Format ผ่าน ค่อยไปเช็ค Unique ที่ Database (Server-side validation)
              checkUniqueValue("citizenNumber", value);
            }
          }}
          title={formResident.citizenType === CitizenType.PASSPORT ? "Please enter your passport number correctly (7-9 digits)." : "กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง (13 หลัก)"} // เพิ่ม title เพื่อช่วยแนะนำผู้ใช้
          suppressHydrationWarning
          required
        />
        {errors.includes("citizenNumber") && (
          <p className="text-red-500 text-xs mt-1 animate-pulse">
            * {errorValidate.citizenNumber || "กรุณากรอกเลขบัตรประจำตัวประชาชน หรือ Passport numberให้ถูกต้อง"}
          </p>
        )}
      </div>
    </div>
  )
}

export default Form
