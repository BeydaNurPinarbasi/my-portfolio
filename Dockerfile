# beyda.dev — Dokploy (veya herhangi bir Docker ortamı) için üretim imajı.
# Çok aşamalı: bağımlılıklar -> build -> yalnızca çalışması gerekenleri içeren küçük çalışma imajı.
# Ayrıntılar: docs/deploy-dokploy.md

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/ şu an boş (git boş klasör tutmaz); çalışma aşamasındaki COPY için var olmalı.
RUN mkdir -p public && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Root olmayan kullanıcı: uygulama ele geçirilse bile konteynerde yetkisi sınırlı kalır.
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1

CMD ["node", "server.js"]
