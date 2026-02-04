import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { id, number, floor, zone, price, isBooked, dormId } = await req.json();

    // ถ้ามี id ให้ update ถ้าไม่มีก็ create
    const room = await prisma.room.upsert({
      where: { id: id || 0 }, // ถ้า id ไม่มี จะเป็น 0 (ไม่เจอแน่นอน → create)
      update: {
        number,
        floor,
        zone,
        price,
        // capacity,
        // currentOccupancy,
        isBooked,
        dormId,
      },
      create: {
        number,
        floor,
        zone,
        price,
        isBooked: isBooked ?? false, // ถ้าไม่ส่งมากำหนด default = false
        dormId,
      },
    });

    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    console.error("Error saving room:", error);
    return NextResponse.json({ error: "Failed to save room" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
