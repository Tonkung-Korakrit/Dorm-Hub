// app/api/set-token/route.js
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]/route"; // ปรับ path ถ้าไม่ตรง
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.token) {
    cookies().set("token", session.user.token, {
      httpOnly: true,
    //   secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 ชม.
    });
  }

  return Response.json({ ok: true });
}
