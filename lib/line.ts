import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LINE_API_BASE = "https://api.line.me/v2/bot/message";
const LINE_HEADER_IMAGE_PATH = "/images/layout_background_pc.png";

const getLineAssetUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URLS || "";
  if (!baseUrl) {
    return path;
  }
  return `${baseUrl.replace(/\/$/, "")}${path}`;
};

const getLineToken = () => {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is missing");
  }
  return token;
};

type LineTextMessage = {
  type: "text";
  text: string;
};

type LineFlexMessage = {
  type: "flex";
  altText: string;
  contents: unknown;
};

export type LineMessage = LineTextMessage | LineFlexMessage;

export type PushMessagePayload = {
  to: string;
  messages: LineMessage[];
};

const lineRequest = async (path: string, payload: unknown) => {
  const token = getLineToken();
  const res = await fetch(`${LINE_API_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE API error: ${res.status} ${body}`);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
};

export const pushMessage = async (payload: PushMessagePayload) => {
  return lineRequest("push", payload);
};

export const sendText = async (to: string, text: string) => {
  return pushMessage({ to, messages: [{ type: "text", text }] });
};

export const sendFlex = async (to: string, altText: string, contents: unknown) => {
  return pushMessage({
    to,
    messages: [{ type: "flex", altText, contents }],
  });
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "รอดำเนินการ",
  VERIFYING: "กำลังตรวจสอบ",
  COMPLETED: "ยืนยันแล้ว",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิก",
  EXPIRED: "หมดเวลา",
  PENDING_CORRECTION: "รอการแก้ไข"
};

const buildBookingStatusFlex = (info: {
  bookingId: number;
  status: BookingStatus;
  dormName: string;
  roomCode: string;
  updatedAt: string;
  remark: string;
}) => {
  const statusFlow: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.VERIFYING,
    BookingStatus.COMPLETED,
  ];
  const currentIndex = statusFlow.indexOf(info.status);
  const isCancelled = info.status === BookingStatus.CANCELLED;
  const isRejected = info.status === BookingStatus.REJECTED;
  const isExpired = info.status === BookingStatus.EXPIRED;
  const isEditReq = info.status === BookingStatus.PENDING_CORRECTION;

  let timelineBox = null;
  if (currentIndex >= 0) {
    const timelineContents = [] as any[];
    for (let i = 0; i < statusFlow.length; i += 1) {
      timelineContents.push({
        type: "box",
        layout: "vertical",
        alignItems: "center",
        flex: 1,
        contents: [
          {
            type: "box",
            layout: "vertical",
            width: "10px",
            height: "10px",
            cornerRadius: "10px",
            backgroundColor: i <= currentIndex ? "#1976d2" : "#cccccc",
            contents: [],
          },
          {
            type: "text",
            text: STATUS_LABELS[statusFlow[i]].replace("กำลังตรวจสอบ", "ตรวจสอบ"),
            size: "xxs",
            weight: i === currentIndex ? "bold" : "regular",
            color: i <= currentIndex ? "#1976d2" : "#999999",
            wrap: true,
            align: "center",
            margin: "xs",
          },
        ],
      });
      if (i < statusFlow.length - 1) {
        timelineContents.push({
          type: "box",
          layout: "vertical",
          justifyContent: "center",
          width: "8px",
          flex: 0,
          contents: [
            {
              type: "box",
              layout: "vertical",
              height: "2px",
              backgroundColor: i < currentIndex ? "#1976d2" : "#cccccc",
              contents: [],
            },
          ],
        });
      }
    }
    timelineBox = {
      type: "box",
      layout: "vertical",
      margin: "md",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: timelineContents,
        },
      ],
    };
  } else if (isCancelled || isRejected || isExpired || isEditReq) {
    timelineBox = {
      type: "box",
      layout: "vertical",
      margin: "md",
      contents: [
        {
          type: "text",
          text: isCancelled ? "การจองของคุณได้ถูกยกเลิกแล้ว" 
              : isRejected ? "การจองของคุณได้ถูกปฏิเสธโดยเจ้าหน้าที่" 
              : isExpired ? "คุณไม่ได้ชำระเงินในเวลาที่กำหนด"
              : "กรุณาแก้ไขข้อมูลการจอง",
          size: "sm",
          weight: "bold",
          color: "#455a64",
        },
        {
          type: "text",
          text: info.remark ? "หมายเหตุ: " + info.remark : "หมายเหตุ: -",
          size: "sm",
          weight: "bold",
          color: "#455a64"
        }
      ],
    };
  }

  const bodyContents: any[] = [
    {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: "หอพัก", size: "sm", color: "#888888" },
        { type: "text", text: info.dormName, weight: "bold", wrap: true },
      ],
    },
    {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: "ห้อง", size: "sm", color: "#888888" },
        { type: "text", text: info.roomCode, weight: "bold" },
      ],
    },
    {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: "สถานะ", size: "sm", color: "#888888" },
        {
          type: "text",
          text: STATUS_LABELS[info.status],
          weight: "bold",
          color:
            info.status === BookingStatus.COMPLETED
              ? "#1b5e20"
              : info.status === BookingStatus.REJECTED || info.status === BookingStatus.CANCELLED || info.status === BookingStatus.EXPIRED
                ? "#b71c1c"
                : "#0d47a1",
        },
      ],
    },
  ];

  if (timelineBox) bodyContents.push(timelineBox);

  bodyContents.push(
    { type: "separator" },
    {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: `อัปเดต: ${info.updatedAt}`,
          size: "xs",
          color: "#999999",
          wrap: true,
        },
      ],
    }
  );

  return {
    type: "bubble",
    size: "mega",
    hero: {
      type: "box",
      layout: "vertical",
      height: "90px",
      contents: [
        {
          type: "image",
          url: getLineAssetUrl(LINE_HEADER_IMAGE_PATH),
          size: "full",
          aspectMode: "cover",
          aspectRatio: "20:9",
          position: "absolute",
          offsetTop: "0px",
          offsetBottom: "0px",
          offsetStart: "0px",
          offsetEnd: "0px",
        },
        { type: "text", text: "สถานะการจอง", weight: "bold", size: "lg", color: "#ffffff" },
        { type: "text", text: `หมายเลข #${info.bookingId}`, size: "md", color: "#e3f2fd" },
      ],
      paddingAll: "16px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: bodyContents,
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#91b838",
          height: "sm",
          action: {
            type: "uri",
            label: "รายละเอียด",
            uri: getLineAssetUrl("/my-booking"),
          },
        },
      ],
      flex: 0,
      paddingAll: "12px",
    },
  };
};

export const sendBookingStatusFlex = async (params: {
  userId: number;
  bookingId: number;
  status: BookingStatus;
  dormName: string;
  roomCode: string;
  updatedAt?: string;
  remark?: string;
}) => {
  const lineLogin = await prisma.line_login.findUnique({
    where: { userId: Number(params.userId) },
    select: { lineUserId: true },
  });

  if (!lineLogin?.lineUserId) {
    return { sent: false, reason: "NO_LINE_USER" } as const;
  }

  console.log("params in api line: ", params);

  const updatedAt =
    params.updatedAt || new Date().toISOString().substring(0, 19).replace("T", " ");
  const contents = buildBookingStatusFlex({
    bookingId: params.bookingId,
    status: params.status,
    dormName: params.dormName,
    roomCode: params.roomCode,
    updatedAt,
    remark: params.remark,
  });

  await sendFlex(lineLogin.lineUserId, `สถานะการจอง #${params.bookingId}`, contents);
  return { sent: true } as const;
};
