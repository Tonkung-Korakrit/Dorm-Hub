// api/validate-user

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/services/identify";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const value = searchParams.get("value");

    if (!type || !value) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // ตรวจสอบเฉพาะฟิลด์ที่อนุญาต เพื่อความปลอดภัย
    if (!["citizenNumber", "studentId", "email"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // 1. ตรวจสอบผ่าน Session (Next-Auth / Google Login)
    // const session = await getServerSession(authOptions);
    // const emailFromSession = session?.user?.email;

    // // 2. ตรวจสอบผ่าน Custom Token (TU Login)
    // const cookieStore = await cookies();
    // const token = cookieStore.get("token")?.value;
    // let studentIdFromToken = null;

    // if (token) {
    //   try {
    //     const { payload } = await jwtVerify(token, SECRET_USER);
    //     studentIdFromToken = payload.studentId as string;
    //   } catch (err) { /* token invalid */ }
    // }

    // 3. สร้างเงื่อนไขการยกเว้น (Exclude) เฉพาะที่มีค่าจริงๆ
    // const excludeConditions = [];
    // if (email) excludeConditions.push({ email: email });
    // if (studentId) excludeConditions.push({ studentId: studentId });

    const { excludeConditions, isAuthenticated } = await getAuthSession();

    // ใช้ findFirst แทน findUnique เพื่อให้ใช้คำสั่ง NOT ได้
    const user = await prisma.cus_users.findFirst({
      where: {
        [type]: value,
        // ถ้ามีเงื่อนไขการยกเว้น ให้ใส่เข้าไปใน NOT
        ...(isAuthenticated && {
          NOT: {
            OR: excludeConditions
          }
        })
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      isDuplicate: !!user, // ถ้าเจอ user จะคืนค่า true
      message: user ? `พบ ${type} นี้มีซ้ำในระบบแล้ว` : `${type} สามารถใช้ได้`,
    });

  } catch (error) {
    console.error("Validation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}