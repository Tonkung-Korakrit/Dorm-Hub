// /api/rooms/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus"); 
    const zoneName = searchParams.get("zone"); // ✅ รับค่ามาเก็บใน zoneName

    if (!campus || !zoneName) {
      return NextResponse.json(
        { error: "จำเป็นต้องระบุ campus และ zone" }, 
        { status: 400 }
      );
    }

    // 1. ดึงข้อมูลดิบจาก Database
    const rooms = await prisma.room.findMany({
      where: {
        zone: {
          name: zoneName, // ใช้ชื่อตัวแปรให้ตรงกัน
          dorm: {
            name: campus
          }
        }
      },
      include: {
        zone: {
          include: { dorm: true }
        }
      }
    });

    // 2. ✨ แปลงข้อมูล (Flattening) ให้ zone กลายเป็นแค่ String
    const simplifiedRooms = rooms.map(room => ({
      ...room,
      zone: room.zone.name,   // เปลี่ยนจาก Object เป็นแค่ String ชื่อโซน
      campus: room.zone.dorm.name, // แถมส่งชื่อวิทยาเขตกลับไปเป็น String ด้วยเลย
    }));

    return NextResponse.json(simplifiedRooms, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก" }, 
      { status: 500 }
    );
  }
}