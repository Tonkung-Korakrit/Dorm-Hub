import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  const dorms = await prisma.dorm.findMany();
  return Response.json(dorms);
}

export async function POST(req) {
  const data = await req.json();
  const dorm = await prisma.dorm.create({ data });
  return Response.json(dorm);
}
