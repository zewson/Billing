# --- স্টেজ ১: অ্যাপ্লিকেশন বিল্ড করা ---
# এই ধাপে আমরা TypeScript কোডকে JavaScript-এ কম্পাইল করব
FROM node:18-alpine AS builder
WORKDIR /app

# পুরো মনোরেপো প্রজেক্টটি কপি করুন যাতে pnpm workspace কাজ করে
COPY . .

# সকল প্যাকেজ ইনস্টল করুন
RUN apk add --no-cache libc6-compat
RUN pnpm install --frozen-lockfile

# শুধুমাত্র সার্ভার অ্যাপ্লিকেশনটি বিল্ড করুন
RUN pnpm --filter server build


# --- স্টেজ ২: প্রোডাকশন ইমেজ তৈরি করা ---
# এই ধাপে আমরা শুধুমাত্র প্রয়োজনীয় ফাইলগুলো নিয়ে একটি ছোট ইমেজ তৈরি করব
FROM node:18-alpine
WORKDIR /app

# বিল্ডার স্টেজ থেকে শুধুমাত্র প্রয়োজনীয় ফাইলগুলো কপি করুন
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json .
# Prisma ক্লায়েন্টের জন্য প্রয়োজনীয় ফাইলগুলো কপি করুন
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

# Prisma Client জেনারেট করুন
RUN pnpm --filter @titanexa/db exec prisma generate

# সার্ভারটি 5000 পোর্টে চলবে
EXPOSE 5000

# সার্ভার চালু করার কমান্ড
CMD ["node", "dist/index.js"]