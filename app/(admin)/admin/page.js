"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return <div className="p-6">Welcome Admin: {session.user.name}</div>;
}
