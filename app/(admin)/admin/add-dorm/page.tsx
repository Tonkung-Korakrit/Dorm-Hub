"use client";
import { useState } from "react";

export default function AddDorm() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleAddDorm = async () => {
    if (!name || !location) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    await fetch("/api/dorms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });
    alert("เพิ่มหอพักสำเร็จ!");
    setName("");
    setLocation("");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">🏢 เพิ่มหอพัก</h1>
      <input
        className="border p-2 w-full mb-3"
        placeholder="ชื่อหอพัก"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-4"
        placeholder="ที่ตั้ง"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button
        onClick={handleAddDorm}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        เพิ่มหอพัก
      </button>
    </div>
  );
}
