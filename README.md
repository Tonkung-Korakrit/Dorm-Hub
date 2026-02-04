This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# TUDormBookingSystem" 

## LINE Messaging API (Mock Booking Status)

We added a webhook endpoint to allow users to query (mock) booking status through LINE OA chat.

### Endpoint

`POST /api/line/webhook`

Deploy / expose this path publicly (e.g. via `ngrok`) and set it as your LINE bot Webhook URL in the LINE Developers Console.

### Required Environment Variables

Add the following to your `.env` (never commit secrets):

```
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LONG_LIVED_CHANNEL_ACCESS_TOKEN
```

Restart the dev server after setting them.

### How It Works

When a user sends a text message such as:

```
ตรวจสอบสถานะการจองหมายเลข 123
สถานะการจอง 123
เช็คจอง 123
```

The webhook parses the booking number (here `123`) and returns a mock response with a deterministic status and sample dorm / room info. This is only for testing; integrate Prisma + real DB queries later.

If the message doesn't match a command, a help message is returned.

### Local Testing with ngrok

1. Start dev server:
	 ```bash
	 npm run dev
	 ```
2. In another terminal expose port 3000:
	 ```bash
	 ngrok http 3000
	 ```
3. Copy the HTTPS forwarding URL from ngrok, e.g. `https://abc123.ngrok.io`.
4. Set Webhook URL in LINE console to:
	 ```
	 https://abc123.ngrok.io/api/line/webhook
	 ```
5. Enable the webhook and click "Verify"; you should receive `{"ok":true}`.

### Manual cURL Test (Signature Optional Bypass)

LINE will sign requests. For quick local sanity (without signature) you can temporarily comment out the signature block in the route (NOT recommended in production) and send:

```bash
curl -X POST http://localhost:3000/api/line/webhook \
	-H 'Content-Type: application/json' \
	-d '{
		"events": [
			{
				"type": "message",
				"replyToken": "TESTTOKEN",
				"message": { "type": "text", "text": "สถานะการจอง 123" }
			}
		]
	}'
```

You should get `{"ok":true}` (the actual reply call will fail without a valid access token / replyToken context). For full integration test, send a real message from LINE client.

### Next Steps (Future Integration)

- Replace mock lookup with Prisma query (e.g. `prisma.booking.findUnique`).
- Store mappings between LINE userId (`event.source.userId`) and internal user records.
- Add push message or proactive notifications on status changes.
- Implement error logging & retry strategy for LINE API failures.

---

