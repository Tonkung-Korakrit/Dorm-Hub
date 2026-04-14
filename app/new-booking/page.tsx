// new-booking/page.tsx
// server components
import { redirect } from "next/navigation";

// component
import Form from "./components/Form";
import { getResidentProfile } from "@/services/identify";
// import { FormBookSkeleton } from "@/components/Loading/book/FormBookSkeleton";

export default async function NewBookingPage() {
  const resident = await getResidentProfile();

  // ถ้าไม่มี User (ไม่ได้ Login หรือ Token ปลอม) ให้เด้งกลับหน้าแรก
  if (!resident) redirect("/login");

  // <Suspense fallback={<FormBookSkeleton />}> 
  // <Form resident={resident} /> 
  {/* </Suspense>; */ }

  return <Form resident={resident} />
}