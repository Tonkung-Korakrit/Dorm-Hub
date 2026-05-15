# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# ใช้ npm ci เพื่อให้ได้ version เดียวกับ package-lock.json เป๊ะๆ
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ตั้งค่า DATABASE_URL หลอกๆ เพื่อให้ Build ผ่าน (Next.js จะไม่พยายามต่อ DB จริงตอน Build)
ENV DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_LINE_LOGIN_CHANNEL
ENV NEXT_PUBLIC_LINE_LOGIN_CHANNEL=$NEXT_PUBLIC_LINE_LOGIN_CHANNEL

RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# สร้าง User ใหม่เพื่อความปลอดภัย
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# คัดลอกไฟล์จาก Builder
COPY --from=builder /app/public ./public

# คัดลอกโฟลเดอร์ .next/standalone และ .next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# สำคัญ: คัดลอกโฟลเดอร์ prisma ไปด้วยเพื่อให้ใช้งาน Prisma Client ใน runtime ได้สมบูรณ์
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# รัน server.js ที่ Next.js standalone เจนออกมา
CMD ["node", "server.js"]