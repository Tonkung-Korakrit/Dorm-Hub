import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        citizenType: true,
        citizenNumber: true,
        studentId: true,
        gender: true,
        titleName: true,
        name: true,
        name_en: true,
        name_th: true,
        email: true,
        image: true,
        faculty: true,
        role: true,
        bookings: { select: { id: true, status: true } },
      },
    });

    // return new Response(JSON.stringify(users), { status: 200 });
    return NextResponse.json(users);

  } catch (error) {
    console.error(error);
    // return new Response('Error fetching users', { status: 500 });
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // console.log("Request body:", body);

    // ลบ key ว่าง
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([key, value]) => key.trim() !== "")
    );

    // เลือก key ที่จะใช้ใน where
    let whereClause = {};
    let data = {};

    if (filteredBody.studentId) {
      const existingUser = await prisma.user.findUnique({
        where: { studentId: filteredBody.studentId },
      });

      if (existingUser) {
        // ถ้ามีใน DB ใช้ studentId
        whereClause = { studentId: filteredBody.studentId };
        // แยก field studentId ออกแล้วเอาไป update
        const { studentId, ...rest } = filteredBody;
        data = rest;
      } else if (filteredBody.id) {
        // ถ้าไม่มี studentId แต่มี id ใช้ id
        whereClause = { id: filteredBody.id };
        const { id, ...rest } = filteredBody;
        data = rest;
      } else {
        throw new Error("Either studentId or id is required for upsert");
      }
    } else if (filteredBody.id) {
      whereClause = { id: filteredBody.id };
      const { id, ...rest } = filteredBody;
      data = rest;
    } else {
      throw new Error("Either studentId or id is required for upsert");
    }

    // ทำ upsert
    const user = await prisma.user.upsert({
      where: whereClause,
      update: data,
      create: filteredBody,
    });

    console.log("Saved user:", user);
    return NextResponse.json(user);

  } catch (error) {
    console.error("Prisma error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// กรณีไม่เชื่อมกับ DB
// export async function GET(request) {
//   const user = [
//     { id: 1, name: "tonkung" },
//     { id: 2, name: "tete" },
//   ];

//   return Response.json(user);
// }