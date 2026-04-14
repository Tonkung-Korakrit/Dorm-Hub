// components/Personal_Info/Verify

import React from 'react'

interface VerifyProps {
  name: string;
  validateMessage?: string;
}

const Verify = ({ name, validateMessage }: VerifyProps) => {
  if (!validateMessage) {
    switch (name) {
      case "citizenType":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณาเลือกประเภทบัตรที่ใช่ในการระบุตัวตน</p>
      case "citizenNumber":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกเลขบัตรประจำตัวประชาชน หรือ Passport number ให้ถูกต้อง</p>
      case "studentId":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกเลขทะเบียนนักศึกษาให้ถูกต้อง (10 หลัก)"</p>
      case "gender":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณาเลือกเพศสภาวะของคุณด้วย</p>
      case "titleName":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณาเลือกคำนำหน้าชื่อของคุณด้วย</p>
      case "name_th":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกทั้งชื่อ และนามสกุลภาษาไทย (และเว้นวรรคให้ถูกต้อง)</p>
      case "name_en":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกทั้งชื่อ และนามสกุลภาษาอังกฤษ (และเว้นวรรคให้ถูกต้อง)</p>
      case "birthDate":
        return <p className="text-red-500 text-xs my-2 animate-pulse">* กรุณาเลือกวันเกิดให้ถูกต้อง (ผู้เข้าพักต้องมีอายุ 18 ปีขึ้นไป)</p>
      case "mobilePhone":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องมี 10 หลัก)</p>
      case "email":
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น example@email.com)</p>
      case "faculty_department":
        return <p className="text-red-500 text-xs my-2 animate-pulse">* กรุณาเลือกคณะ และสาขาของคุณด้วย</p>
      case "bookingType":
        return <p className="text-red-500 text-xs my-2 animate-pulse">* กรุณาเลือกประเภทผู้พักที่คุณต้องการ</p>
      default:
        return <p className="text-red-500 text-xs mb-2 animate-pulse">* กรุณากรอก หรือเลือกช่องนี้ด้วย</p>
    }
  } else {
    // 1. ดึงข้อความออกมาแสดง
    const messageText = typeof validateMessage === 'object'
      ? (validateMessage as any).message
      : validateMessage;

    // 2. เช็คสถานะ isDuplicate จากตัวแปรต้นฉบับ (validateMessage)
    // ถ้าเป็น object ให้ดูค่า isDuplicate ถ้าไม่ใช่อ็อบเจกต์ (เป็น string ปกติ) ให้ถือว่าเป็น Error (สีแดง)
    const isDup = typeof validateMessage === 'object' ? (validateMessage as any).isDuplicate : false;

    // 3. กำหนดเงื่อนไขสี: 
    // - ถ้าเป็น Error ปกติ (String) -> สีแดง
    // - ถ้าเป็น Object และ isDuplicate เป็น true -> สีแดง
    // - ถ้าเป็น Object และ isDuplicate เป็น false -> สีเขียว (ผ่าน)
    const textColor = (typeof validateMessage === 'string' || isDup)
      ? 'text-red-500'
      : 'text-green-500';

    return (
      <p className={`text-sm font-medium mb-2 ${textColor}`}>
        {messageText}
      </p>
    );
  }
}

export default Verify
