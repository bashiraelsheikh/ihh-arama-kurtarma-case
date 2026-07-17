# Geliştirme ortamı için Dockerfile
FROM node:22-bookworm-slim

WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate

# Bağımlılıklar
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Kaynak kod
COPY . .

RUN pnpm prisma generate

EXPOSE 3000

# Migration + seed + dev server (entrypoint script)
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm db:seed && pnpm dev"]
