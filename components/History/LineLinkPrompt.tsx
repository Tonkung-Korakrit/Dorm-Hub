// components/History/LineLinkPrompt.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";
import ConfirmModal from "@/components/Loading/ConfirmModal";
import { StatusPopup } from "@/components/Loading/StatusPopup";
import { Booking } from "@/utils/types";

interface LineLinkPromptProps {
  booking: Booking;
}

type PopupStatus = { type: "success" | "error"; message: string } | null;

const LineLinkPrompt = ({ booking }: LineLinkPromptProps) => {
  const router = useRouter();
  const didOpenLineLinkModal = useRef(false);

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAutoLinkChecking, setIsAutoLinkChecking] = useState(false);
  const [popupStatus, setPopupStatus] = useState<PopupStatus>(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info" as const,
    title: "",
    message: "",
    confirmText: "",
    action: () => {},
  });

  const userId = booking?.cus_users?.id;
  const nameEn = booking?.cus_users?.name_en;
  const hasLineLogin = booking?.cus_users?.hasLineLogin;
  const canLink = typeof userId === "number" && Boolean(nameEn);

  // const liffId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL; // ตัวเต็ม: "200977xxx-jaQExxxx"
  // const channelId = liffId?.split("-")[0]; // เฉพาะตัวเลข: "200977xxxx"

  const lineLink = useCallback(async () => {
    if (!canLink) {
      setPopupStatus({
        type: "error",
        message: "ไม่พบข้อมูลผู้ใช้สำหรับเชื่อมต่อ LINE",
      });
      return;
    }

    setIsRedirecting(true);

    try {
      if (typeof window === "undefined") {
        setIsRedirecting(false);
        return;
      }

      // console.log("Channel ID Check:", process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL); // เพิ่มบรรทัดนี้
      const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL;

      if (!channelId) {
        setPopupStatus({
          type: "error",
          message: "ยังไม่ได้ตั้งค่า LINE Login channel",
        });
        setIsRedirecting(false);
        return;
      }

      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId: channelId as string });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();

      const call = await fetch("/api/auth/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name_en: nameEn,
          line_user_id: profile.userId,
        }),
      });

      const res = await call.json();

      if (call.ok && res?.ok) {
        setIsRedirecting(false);
        setPopupStatus({
          type: "success",
          message: "เชื่อมต่อ LINE สำเร็จแล้ว",
        });
        setTimeout(() => {
          router.refresh();
        }, 400);
      } else {
        setIsRedirecting(false);
        setPopupStatus({
          type: "error",
          message: res?.message || "เชื่อมต่อ LINE ไม่สำเร็จ",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setPopupStatus({
        type: "error",
        message: `เชื่อมต่อ LINE ผิดพลาด: ${message}`,
      });
      setIsRedirecting(false);
    }
  }, [canLink, nameEn, router, userId]);

  const tryAutoLink = useCallback(async () => {
    if (!canLink) return;

    const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL;
    if (!channelId) return false;

    const liff = (await import("@line/liff")).default;
    await liff.init({ liffId: channelId });

    if (!liff.isLoggedIn()) return false;

    const profile = await liff.getProfile();

    const call = await fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name_en: nameEn,
        line_user_id: profile.userId,
      }),
    });

    const res = await call.json();

    if (call.ok && res?.ok) {
      setPopupStatus({
        type: "success",
        message: "เชื่อมต่อ LINE สำเร็จแล้ว",
      });
      setTimeout(() => {
        router.refresh();
      }, 400);
      return true;
    }

    return false;
  }, [canLink, nameEn, router, userId]);

  const openLineLinkModal = useCallback(() => {
    setModalConfig({
      isOpen: true,
      type: "info",
      title: "Connect LINE / เชื่อมต่อ LINE",
      message:
        "Connect LINE to receive booking notifications.\nเชื่อมต่อ LINE เพื่อรับการแจ้งเตือนการจอง\nแนะนำให้ใช้งานผ่าน Browser Google Chrome เพื่อการแจ้งเตือนที่สมบูรณ์",
      confirmText: "Connect LINE / เชื่อมต่อ LINE",
      action: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        await lineLink();
      },
    });
  }, [lineLink]);

  useEffect(() => {
    if (didOpenLineLinkModal.current) return;
    if (hasLineLogin !== false || !canLink) return;

    const autolink = async () => {
      setIsAutoLinkChecking(true);
      try {
        const linked = await tryAutoLink();
        if (linked) return;

        didOpenLineLinkModal.current = true;
        openLineLinkModal();
      } catch {
        didOpenLineLinkModal.current = true;
        openLineLinkModal();
      } finally {
        setIsAutoLinkChecking(false);
      }
    };

    void autolink();
  }, [canLink, hasLineLogin, openLineLinkModal, tryAutoLink]);

  if (hasLineLogin !== false) return null;

  return (
    <>
      {(isRedirecting || isAutoLinkChecking) && (
        <LoadingOverlay message="Loading..." />
      )}

      <ConfirmModal
        {...modalConfig}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.action}
        isLoading={isRedirecting}
      />

      {popupStatus && (
        <StatusPopup
          type={popupStatus.type}
          message={popupStatus.message}
          onClose={() => setPopupStatus(null)}
        />
      )}

      <div className="mt-4 flex justify-end">
        <div className="text-[12px] text-red-400 font-bold text-right">
          <p>กรุณาเชื่อมต่อ LINE เพื่อใช้งานการแจ้งเตือนผ่าน LINE</p>
          <button
            type="button"
            onClick={() => void lineLink()}
            disabled={isRedirecting || !canLink}
            className="mt-2 w-auto bg-[#006633] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-100 hover:bg-[#004d26] active:scale-95 transition-all disabled:opacity-50"
          >
            {isRedirecting ? "Loading..." : "เชื่อมต่อ LINE"}
          </button>
          {!canLink && (
            <p className="mt-2 text-[11px] text-red-500 font-medium">
              ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองเข้าสู่ระบบใหม่
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default LineLinkPrompt;
