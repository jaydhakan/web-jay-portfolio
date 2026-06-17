# syntax=docker/dockerfile:1

# Multi-stage build for the Next.js app. Produces a small production image that
# runs the app with `node server.js` (Next standalone output) — this is a server
# app (server components, the contact server action, SSR/SSG, image optimization),
# not static files, so it must RUN, not be served as a flat index.html.

# ---- deps: install production-resolvable node_modules from the lockfile -------
FROM node:22-alpine AS deps
WORKDIR /app
# libc compat for some native deps (e.g. sharp) on alpine.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the standalone server bundle ---------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars are inlined at build time. Pass a real URL at build for
# correct absolute URLs in metadata/OG (defaults to localhost otherwise).
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

# ---- runner: minimal runtime image ------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Public assets + the standalone server + the static chunks. The standalone
# output already contains the traced node_modules it needs (no `npm install`).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Container healthcheck hits the running server.
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# RESEND_API_KEY (+ a verified from-domain) is needed at RUNTIME for the contact
# form to actually send; pass it with `-e` / compose env. The site runs without
# it — the form just can't deliver mail.
CMD ["node", "server.js"]
