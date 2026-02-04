"use client";

import { useState } from "react";

export default function AddRoomForm() {
  const [formRoom, setFormRoom] = useState({
    roomId: "",
    floor: "",
    zone: "",
    price: "",
    capacity: "",
    currentOccupancy: "",
    dormId: "",
    available: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormRoom((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("../api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRoom),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`✅ เพิ่มห้องสำเร็จ: ID ${data.id}`);
        setFormRoom({ roomId: "", floor: "", zone: "", price: "", capacity: "", currentOccupancy: "", dormId: "", available: false });
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to save room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white shadow-lg p-6 rounded-2xl space-y-4">
      <h2 className="text-xl font-bold">➕ เพิ่มห้องใหม่</h2>

      <div>
        <label className="block mb-1">Room Number</label>
        <input
          type="text"
          name="roomId"
          value={formRoom.roomId || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Floor</label>
        <input
          type="number"
          name="floor"
          value={formRoom.floor || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Zone</label>
        <input
          type="text"
          name="zone"
          value={formRoom.zone || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Price</label>
        <input
          type="number"
          name="price"
          value={formRoom.price || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Dorm ID</label>
        <input
          type="number"
          name="dormId"
          value={formRoom.dormId || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="isBooked"
          checked={formRoom.available || ""}
          onChange={handleChange}
        />
        <label>Booked?</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Saving..." : "Save Room"}
      </button>

      {message && <p className="mt-2 text-center">{message}</p>}
    </form>
  );
}
