import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// 1. กำหนดโครงสร้าง Type สำหรับ User/Session เพิ่มเติม
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      token?: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    provider: string;
    myToken?: string;
  }
}

// 2. ตั้งค่า authOptions พร้อมระบุ Type
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.email = user.email as string;
        token.role = user.role || "STUDENT";
        token.provider = account.provider;

        // สร้าง Custom JWT
        token.myToken = jwt.sign(
          {
            email: user.email,
            provider: account.provider,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
      }
      return token;
    },

    // async session({ session, token }) {
    //   if (session.user) {
    //     // ดึงข้อมูล Role ล่าสุดจาก Database (ถ้าจำเป็น)
    //     const dbUser = await prisma.user.findUnique({
    //       where: { id: token.id },
    //     });

    //     session.user.id = token.id;
    //     session.user.email = token.email;
    //     session.user.role = dbUser?.role || token.role;
    //     session.user.token = token.myToken;
    //     session.user.provider = token.provider;
    //   }
    //   return session;
    // },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };