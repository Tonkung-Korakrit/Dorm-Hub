// /api/rooms/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");
    const dorm = searchParams.get("dorm"); // รับค่ามาเก็บใน zoneName
    // const floor = searchParams.get("floor");

    if (!campus || !dorm) {
      return NextResponse.json(
        { error: "จำเป็นต้องระบุ campus และ zone" },
        { status: 400 }
      );
    }

    // 1. ดึงข้อมูลดิบจาก Database
    const rooms = await prisma.room.findMany({
      where: {
        dorm: {
          name: dorm, // ใช้ชื่อตัวแปรให้ตรงกัน
          campus: {
            name: campus,
          }
        },
        parentId: null,
        // ...(floor ? { floor: parseInt(floor) } : {}),
      },
      include: {
        dorm: {
          include: { campus: true }
        },
        subRooms: true
      },
      orderBy: { roomId: 'asc' }
    });

    // 2. แปลงข้อมูล (Flattening) ให้ zone กลายเป็นแค่ String
    const simplifiedRooms = rooms.map(room => ({
      ...room,
      dorm: room.dorm.name,   // เปลี่ยนจาก Object เป็นแค่ String ชื่อโซน
      campus: room.dorm.campus.name, // แถมส่งชื่อวิทยาเขตกลับไปเป็น String ด้วยเลย
      subRooms: room.subRooms?.map(sub => ({
        ...sub,
        dorm: room.dorm.name,
        campus: room.dorm.campus.name
      })) || []
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