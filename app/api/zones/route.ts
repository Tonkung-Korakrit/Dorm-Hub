// /api/zones/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. ดึง Query Parameter จาก URL
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");

    // 2. Validation: ตรวจสอบว่ามี campus ส่งมาหรือไม่
    if (!campus) {
      return NextResponse.json(
        { error: "Campus is required" },
        { status: 400 }
      );
    }

    // 3. Query: ดึงข้อมูลโซนที่สังกัดวิทยาเขต (Dorm) นั้นๆ
    // เราใช้การกรองแบบ Nested (Dorm -> Zone)
    const zones = await prisma.zone.findMany({
      where: {
        dorm: {
          name: {
            equals: campus,
            // mode: 'insensitive' // หาเจอแม้พิมพ์ตัวเล็ก/ใหญ่ไม่ตรงกัน เช่น Rangsit vs rangsit
          }
        }
      },
      select: {
        id: true,
        name: true,
        gender: true,
        mapUrl: true,    // เผื่อต้องใช้แสดงรูปแผนที่ของโซนนั้นๆ
        maxCols: true,
        maxRows: true
      },
      orderBy: {
        name: 'asc'      // เรียงลำดับตามชื่อโซนจาก A-Z
      }
    });

    // 4. Return: ส่งข้อมูลโซนกลับไปในรูปแบบ JSON
    return NextResponse.json(zones, { status: 200 });

  } catch (error) {
    console.error("❌ Error fetching zones:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}