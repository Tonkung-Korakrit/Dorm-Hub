import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Import มาจากไฟล์ด้านบน

const handler = NextAuth(authOptions);

// ใน App Router ต้อง export เป็น GET และ POST เท่านั้น
export { handler as GET, handler as POST };