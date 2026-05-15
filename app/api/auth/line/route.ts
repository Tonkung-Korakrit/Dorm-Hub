// api/auth/line/route.ts
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req) {
  try{
    const { userId, line_user_id, name_en } = await req.json();

    const create_link = await prisma.line_login.upsert({
      where: { userId: userId },
      update: {
        lineUserId: line_user_id,
        username: name_en
      },
      create: {
        userId,
        lineUserId: line_user_id,
        username: name_en
      }
    })

    if(create_link) {
      const res = NextResponse.json({ message: "Create line link Success", ok: true });
      return res;
    } else {
      const res = NextResponse.json({ message: "Create line link failed", ok: false });
      return res
    }
  } catch(err) {
    console.error("Failed to link account with Line: ", err.response?.data || err.message);
    return NextResponse.json({ error: "Link error"}, { status: 500 });
  }
}
