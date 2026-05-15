// api/upload/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { mkdir, writeFile } from "fs/promises";
// import path from "path";
// import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ALLOWED_UPLOAD_TYPES = {
  face: "face",
  "citizen-card": "citizen-card",
} as const;

// 1. ตั้งค่า S3 Client ให้ชี้ไปที่ Cloudflare R2
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
    const uploadType = formData.get("type");

    if (!file) {
      return NextResponse.json({ success: false, message: "No file found" }, { status: 400 });
    }

    if (typeof uploadType !== "string" || !(uploadType in ALLOWED_UPLOAD_TYPES)) {
      return NextResponse.json({ success: false, message: "Invalid upload type" }, { status: 400 });
    }

    // 2. แปลง File เป็น Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. จัดการเรื่องชื่อไฟล์และโฟลเดอร์
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());

    const folderName = ALLOWED_UPLOAD_TYPES[uploadType as keyof typeof ALLOWED_UPLOAD_TYPES];
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles", folderName, year, month, day);

    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.name);
    const filename = `${uniqueSuffix}${extension}`;
    // const filepath = path.join(uploadDir, filename);
    // await writeFile(filepath, buffer);
    // const dbPath = `/uploads/profiles/${folderName}/${year}/${month}/${day}/${filename}`;

    const s3Key = `profiles/${folderName}/${year}/${month}/${day}/${filename}`;
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
    console.error("Profile Upload Error:", error);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
