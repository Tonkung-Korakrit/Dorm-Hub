import NextAuthProvider from "@/components/NextAuthProvider"; // ตรวจสอบ Path ให้ถูกต้อง

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}