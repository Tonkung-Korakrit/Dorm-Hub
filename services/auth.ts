import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// --- A. การประกาศ Type ---
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: string;
      token?: string;
      provider?: string;
      studentId: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role?: string;
    studentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: string;
    studentId: string;
    provider: string;
    myToken?: string;
  }
}

const baseAdapter = PrismaAdapter(prisma);

// --- B. การตั้งค่า authOptions แบบ Custom Adapter ---
export const authOptions: NextAuthOptions = {
  adapter: {
    ...baseAdapter,
    getUserByEmail: async (email) => {
      return prisma.cus_users.findUnique({
        where: { email },
      });
    },
    // 1. แก้ให้ไปหาที่ Google_login แทน Account
    getUserByAccount: async ({ provider, providerAccountId }) => {
      const account = await prisma.google_login.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        select: { cus_users: true },
      });
      return (account?.cus_users as any) ?? null;
    },

    // 2. แก้ให้บันทึกลง Google_login เมื่อเชื่อมต่อครั้งแรก
    // linkAccount: async (data) => {
    //   return prisma.google_login.create({ data: data as any }) as any;
    // },
    linkAccount: async (account) => {
      const user = await prisma.cus_users.findUnique({
        where: { id: account.userId }
      });

      return prisma.google_login.create({
        data: {
          ...account,
          email: user?.email // ส่งอีเมลเข้าไปด้วยมือ
        } as any
      }) as any;
    },

    // 3. แก้ให้สร้าง User ใหม่ลงใน Cus_users
    createUser: async (data) => {
      return prisma.cus_users.create({
        data: {
          email: data.email,
          name_en: data.name,
          // profileImage: (data as any).image,
          role: "STUDENT", // Default Role สำหรับคนจองใหม่
        }
      }) as any;
    },

    // 4. ดึง User (สำหรับ Session)
    getUser: async (id) => {
      const numericId = parseInt(id, 10);
      return prisma.cus_users.findUnique({ where: { id: numericId } });
    },

    // 5. ดึง Session
    getSessionAndUser: async (sessionToken) => {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { cus_users: true },
      });
      if (!userAndSession) return null;
      return { user: userAndSession.cus_users, session: userAndSession };
    },
  } as any,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // session: { strategy: "jwt" },
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60, // ตัวอย่าง: 1 hour
    // maxAge: 60, // test 1 min
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user && account) {
        token.id = Number(user.id);
        token.email = user.email as string;
        token.role = (user as any).role || "STUDENT";
        token.provider = account.provider;
        token.studentId = (user as any).studentId || "";

        token.myToken = jwt.sign(
          {
            email: user.email,
            provider: account.provider,
            role: token.role,
            studentId: token.studentId,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );
      }

      //   if (trigger === "update" && session) {
      //     // เอาค่าใหม่ที่ส่งมาจากหน้าบ้าน (ผ่าน session object) มาแปะทับ
      //     if (session.studentId) token.studentId = session.studentId;
      //     if (session.role) token.role = session.role;

      //     // สำคัญ: ต้องสร้าง myToken ใหม่ด้วยเพื่อให้ Middleware ได้ค่าล่าสุดไปใช้
      //     token.myToken = jwt.sign(
      //       {
      //         email: token.email,
      //         provider: token.provider,
      //         role: token.role,
      //         studentId: token.studentId,
      //       },
      //       process.env.JWT_SECRET as string,
      //       { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      //     );
      //   }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.token = token.myToken;
        session.user.provider = token.provider;
        session.user.studentId = token.studentId;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/my-booking`;
      }
      return url;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};