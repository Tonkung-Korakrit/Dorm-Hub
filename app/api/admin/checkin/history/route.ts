import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

type ApiError = Error & { status?: number };

function createHttpError(message: string, status: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

async function getAdminIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) {
    throw createHttpError("Unauthorized", 401);
  }

  try {
    const secretAdmin = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const { payload } = await jwtVerify(token, secretAdmin);

    const adminId = Number(payload.id);
    if (!Number.isInteger(adminId) || payload.role !== "ADMIN") {
      throw createHttpError("Unauthorized", 401);
    }

    const staff = await prisma.staff_users.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, isEnabled: true },
    });

    if (!staff || staff.role !== "ADMIN" || !staff.isEnabled) {
      throw createHttpError("Unauthorized", 401);
    }

    return adminId;
  } catch (error: any) {
    if (error?.status) {
      throw error;
    }
    throw createHttpError("Unauthorized", 401);
  }
}

export async function GET(request: NextRequest) {
  try {
    await getAdminIdFromToken();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;
    const q = (searchParams.get("q") || "").trim();

    const where = q
      ? {
          OR: [
            { booking: { cus_users: { name_th: { contains: q } } } },
            { booking: { cus_users: { studentId: { contains: q } } } },
            { booking: { room: { roomId: { contains: q } } } },
            { booking: { room: { dorm: { name: { contains: q } } } } },
            { staff: { name: { contains: q } } },
            { staff: { email: { contains: q } } },
          ],
        }
      : {};

    const [history, total] = await Promise.all([
      prisma.checkin.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              type: true,
              cus_users: {
                select: {
                  name_th: true,
                  studentId: true,
                },
              },
              room: {
                select: {
                  roomId: true,
                  dorm: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where }),
    ]);

    return NextResponse.json({
      data: history,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || "ไม่สามารถดึงประวัติย้ายเข้า/ออกได้";
    return NextResponse.json({ message }, { status });
  }
}
