// api/upload/vehicle/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { writeFile, mkdir } from "fs/promises";
// import path from "path";
// import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file found" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());

    const uploadDir = path.join(process.cwd(), "public", "uploads", "vehicles", year, month, day);

    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.name);
    const filename = `${uniqueSuffix}${extension}`;
    // const filepath = path.join(uploadDir, filename);
    // await writeFile(filepath, buffer);
    // const dbPath = `/uploads/vehicles/${year}/${month}/${day}/${filename}`;

    // จัด Path ให้ไปอยู่ในโฟลเดอร์ vehicles แทน
    const s3Key = `vehicles/${year}/${month}/${day}/${filename}`;

    // 4. สั่งอัปโหลดขึ้น R2
    await S3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type, // จำเป็นมาก เพื่อให้เบราว์เซอร์รู้ว่าเป็นรูปภาพ
      })
    );

    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL; 
    const baseUrl = publicUrl?.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const dbPath = `${baseUrl}/${s3Key}`;

    return NextResponse.json({ success: true, path: dbPath });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
