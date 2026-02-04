import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

// Force Node.js runtime (not edge) to ensure 'crypto' and native modules work
export const runtime = 'nodejs';

// Environment variables expected:
// LINE_CHANNEL_SECRET - for signature validation
// LINE_CHANNEL_ACCESS_TOKEN - for reply API

// Helper: validate the X-Line-Signature header
function validateSignature(body, signature, channelSecret) {
  const hmac = crypto.createHmac('sha256', channelSecret);
  hmac.update(body);
  const digest = hmac.digest('base64');
  return digest === signature;
}

// Mock booking status lookup (replace later with real DB query via Prisma)
function getMockBookingStatus(bookingId) {
  // deterministic mapping: last digit decides status
  const statuses = ['รอดำเนินการ', 'ยืนยันแล้ว', 'ยกเลิก', 'กำลังตรวจสอบ', 'เสร็จสิ้น'];
  const num = parseInt(String(bookingId).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return null;
  const status = statuses[num % statuses.length];
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomNumber = Math.floor(Math.random() * 99) + 1; 
  const dorm = `${randomLetter}${randomNumber}`;
  const room = `ห้อง ${(num % 50) + 101}`;
  return {
    bookingId: String(bookingId),
    status,
    dorm,
    room,
    updatedAt: new Date().toISOString().substring(0, 19).replace('T', ' ')
  };
}

// Build Flex Message (Bubble) for booking status
function buildBookingStatusFlex(info) {
  const statusFlow = ['รอดำเนินการ', 'กำลังตรวจสอบ', 'ยืนยันแล้ว', 'เสร็จสิ้น'];
  const currentIndex = statusFlow.indexOf(info.status);

  let timelineBox = null;
  if (currentIndex >= 0) {
    const timelineContents = [];
    for (let i = 0; i < statusFlow.length; i++) {
      // Responsive step node (use flex, smaller circle)
      timelineContents.push({
        type: 'box',
        layout: 'vertical',
        alignItems: 'center',
        flex: 1,
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            width: '10px',
            height: '10px',
            cornerRadius: '10px',
            backgroundColor: i <= currentIndex ? '#1976d2' : '#cccccc',
            contents: []
          },
          {
            type: 'text',
            text: statusFlow[i].replace('กำลังตรวจสอบ','ตรวจสอบ'),
            size: 'xxs',
            weight: i === currentIndex ? 'bold' : 'regular',
            color: i <= currentIndex ? '#1976d2' : '#999999',
            wrap: true,
            align: 'center',
            margin: 'xs'
          }
        ]
      });
      if (i < statusFlow.length - 1) {
        timelineContents.push({
          type: 'box',
          layout: 'vertical',
          justifyContent: 'center',
          width: '8px',
          flex: 0,
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              height: '2px',
              backgroundColor: i < currentIndex ? '#1976d2' : '#cccccc',
              contents: []
            }
          ]
        });
      }
    }
    timelineBox = {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: timelineContents
        }
      ]
    };
  } else if (info.status.includes('ยกเลิก')) {
    timelineBox = {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      contents: [
        {
          type: 'text',
          text: 'การจองถูกยกเลิก',
          size: 'sm',
          weight: 'bold',
          color: '#b71c1c'
        }
      ]
    };
  }

  const bodyContents = [
    {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'หอพัก', size: 'sm', color: '#888888' },
        { type: 'text', text: info.dorm, weight: 'bold', wrap: true }
      ]
    },
    {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'ห้อง', size: 'sm', color: '#888888' },
        { type: 'text', text: info.room, weight: 'bold' }
      ]
    },
    {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'สถานะ', size: 'sm', color: '#888888' },
        {
          type: 'text',
          text: info.status,
          weight: 'bold',
          color: info.status.includes('ยืนยัน') ? '#1b5e20' : (info.status.includes('ยกเลิก') ? '#b71c1c' : '#0d47a1')
        }
      ]
    }
  ];

  if (timelineBox) bodyContents.push(timelineBox);

  bodyContents.push(
    { type: 'separator' },
    {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'icon', url: 'https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip14.png', size: 'sm' },
        {
          type: 'text',
          text: `อัปเดต: ${info.updatedAt}`,
          size: 'xs',
          color: '#999999',
          wrap: true
        }
      ]
    }
  );

  return {
    type: 'flex',
    altText: `สถานะการจอง ${info.bookingId}: ${info.status}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'box',
        layout: 'vertical',
        height: '90px',
        contents: [
          { type: 'text', text: 'สถานะการจอง', weight: 'bold', size: 'lg', color: '#ffffff' },
          { type: 'text', text: `หมายเลข #${info.bookingId}` , size: 'md', color: '#e3f2fd' }
        ],
        backgroundColor: '#0d47a1',
        paddingAll: '16px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: bodyContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1976d2',
            height: 'sm',
            action: { type: 'message', label: 'รีเฟรชสถานะ', text: `สถานะการจอง ${info.bookingId}` }
          },
          {
            type: 'button',
            style: 'secondary',
            color: '#eeeeee',
            height: 'sm',
            action: { type: 'message', label: 'ตรวจหมายเลขอื่น', text: 'สถานะการจอง 123' }
          }
        ],
        flex: 0,
        paddingAll: '12px'
      }
    }
  };
}

// Parse user message to extract booking ID command
function parseBookingStatusCommand(text) {
  // Accept patterns like:
  // "ตรวจสอบสถานะการจองหมายเลข 123" OR
  // "สถานะการจอง 123" OR
  // "เช็คจอง 123"
  const normalized = text.trim();
  const regexes = [
    /ตรวจสอบสถานะการจองหมายเลข\s*(\d+)/i,
    /สถานะการจอง\s*(\d+)/i,
    /เช็คจอง\s*(\d+)/i
  ];
  for (const r of regexes) {
    const m = normalized.match(r);
    if (m) return m[1];
  }
  return null;
}

async function replyMessage(replyToken, messages) {
  const endpoint = 'https://api.line.me/v2/bot/message/reply';
  return axios.post(endpoint, { replyToken, messages }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    timeout: 5000
  });
}

export async function POST(request) {
  const debug = process.env.LINE_DEBUG === '1';
  console.log('[LINE][Webhook] POST hit at', new Date().toISOString());
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelSecret || !accessToken) {
    return NextResponse.json({ error: 'Missing LINE env vars' }, { status: 500 });
  }

  const rawBody = await request.text(); // need raw string for signature validation
  const signature = request.headers.get('x-line-signature');
  const valid = signature && validateSignature(rawBody, signature, channelSecret);
  if (!valid) {
    if (debug) {
      console.error('[LINE][SignatureInvalid]', { signature, rawBodyLength: rawBody.length });
    }
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (debug) {
    console.log('[LINE][Webhook][RawBody]', rawBody);
  }

  let bodyObj;
  try {
    bodyObj = JSON.parse(rawBody);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const events = bodyObj.events || [];
  const results = [];
  for (const event of events) {
    if (debug) console.log('[LINE][Event]', JSON.stringify(event));
    try {
      if (event.type === 'message' && event.message?.type === 'text') {
        const userText = event.message.text || '';
        const bookingId = parseBookingStatusCommand(userText);
        if (bookingId) {
          const info = getMockBookingStatus(bookingId);
          if (info) {
            const flex = buildBookingStatusFlex(info);
            await replyMessage(event.replyToken, [flex]);
            results.push({ eventType: 'message', handled: true, bookingId, flex: true });
          } else {
            await replyMessage(event.replyToken, [{ type: 'text', text: 'ไม่พบหมายเลขการจองนี้ โปรดตรวจสอบอีกครั้ง' }]);
            results.push({ eventType: 'message', handled: true, bookingId, notFound: true });
          }
        } else {
          await replyMessage(event.replyToken, [{
            type: 'text',
            text: 'พิมพ์: ตรวจสอบสถานะการจองหมายเลข 123 หรือ สถานะการจอง 123 (ตัวอย่าง: สถานะการจอง 321)'
          }]);
          results.push({ eventType: 'message', handled: true, help: true });
        }
      } else if (event.type === 'follow') {
        await replyMessage(event.replyToken, [{ type: 'text', text: 'ยินดีต้อนรับ! พิมพ์: สถานะการจอง 123' }]);
        results.push({ eventType: 'follow', handled: true });
      } else {
        if (debug) console.log('[LINE][Event][Ignored]', event.type);
        results.push({ eventType: event.type, handled: false });
      }
    } catch (err) {
      console.error('[LINE][Event][Error]', err?.response?.data || err?.message || err);
      results.push({ eventType: event.type, error: true });
      // Do not throw; continue processing other events
    }
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  console.log('[LINE][Webhook] GET health check at', new Date().toISOString());
  return NextResponse.json({ ok: true, endpoint: 'line webhook', time: new Date().toISOString() });
}

export const dynamic = 'force-dynamic'; // ensure no caching
