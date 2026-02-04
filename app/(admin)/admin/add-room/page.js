"use client";
import { useState, useEffect } from "react";

export default function AddRoom() {
  const [dorms, setDorms] = useState([]);
  const [dormId, setDormId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    fetch("/api/dorms").then((res) => res.json()).then(setDorms);
  }, []);

  const handleAddRoom = async () => {
    if (!dormId || !roomNumber || !capacity) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dormId: Number(dormId), roomNumber, capacity: Number(capacity) }),
    });
    alert("เพิ่มห้องสำเร็จ!");
    setRoomNumber("");
    setCapacity("");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">🚪 เพิ่มห้องพัก</h1>
      <label className="block mb-2">เลือกหอพัก</label>
      <select
        className="border p-2 w-full mb-3"
        value={dormId}
        onChange={(e) => setDormId(e.target.value)}
      >
        <option value="">-- เลือกหอพัก --</option>
        {dorms.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <input
        className="border p-2 w-full mb-3"
        placeholder="หมายเลขห้อง"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-4"
        type="number"
        placeholder="จำนวนคนพักได้"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />
      <button
        onClick={handleAddRoom}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        เพิ่มห้องพัก
      </button>
    </div>
  );
}
