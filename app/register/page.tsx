"use client";
import { useState } from "react";

export default function RegisterUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
  if (!name || !email || !password) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }
  // https://web.reg.tu.ac.th/registrar/validate-direct.asp

  const res = await fetch("/api/users", {
  // const res = await fetch("/registrar/validate-direct.asp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "เกิดข้อผิดพลาด");
    return;
  }

  alert("สมัครสมาชิกสำเร็จ!");
  window.location.href = "/login"; // ไปหน้า login
};

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">📝 สมัครสมาชิก</h1>
      <input
        className="border p-2 w-full mb-3"
        placeholder="ชื่อ"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-3"
        placeholder="อีเมล"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-4"
        placeholder="รหัสผ่าน"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        สมัครสมาชิก
      </button>
    </div>
  );
}
