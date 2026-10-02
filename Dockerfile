# syntax=docker/dockerfile:1
# Portable image for EC2, Google Cloud Run or Azure Container Apps.
# NEXT_PUBLIC_* and APP_ENV/SITE_URL are build-time inputs (they are baked into static pages);
# secrets are runtime environment variables only and never build arguments.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
ARG APP_ENV=preview
ARG SITE_URL
ARG PRIVACY_EMAIL
ARG RESPONSIBLE_OPERATOR_NAME
ARG LEGAL_REVIEW_APPROVED=false
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_GOOGLE_TAG_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION
ENV APP_ENV=$APP_ENV SITE_URL=$SITE_URL PRIVACY_EMAIL=$PRIVACY_EMAIL \
    RESPONSIBLE_OPERATOR_NAME=$RESPONSIBLE_OPERATOR_NAME LEGAL_REVIEW_APPROVED=$LEGAL_REVIEW_APPROVED \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST NEXT_PUBLIC_GOOGLE_TAG_ID=$NEXT_PUBLIC_GOOGLE_TAG_ID \
    NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION=$NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
# The same non-secret identity values the pages were built with; API routes read them at runtime.
ARG APP_ENV=preview
ARG SITE_URL
ARG PRIVACY_EMAIL
ARG RESPONSIBLE_OPERATOR_NAME
ARG LEGAL_REVIEW_APPROVED=false
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0 \
    APP_ENV=$APP_ENV SITE_URL=$SITE_URL PRIVACY_EMAIL=$PRIVACY_EMAIL \
    RESPONSIBLE_OPERATOR_NAME=$RESPONSIBLE_OPERATOR_NAME LEGAL_REVIEW_APPROVED=$LEGAL_REVIEW_APPROVED
RUN addgroup -S knowvia && adduser -S knowvia -G knowvia
COPY --from=build --chown=knowvia:knowvia /app/.next/standalone ./
COPY --from=build --chown=knowvia:knowvia /app/.next/static ./.next/static
COPY --from=build --chown=knowvia:knowvia /app/public ./public
USER knowvia
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server.js"]
