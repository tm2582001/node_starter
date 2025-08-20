FROM node:22 AS builder
RUN apt-get update
WORKDIR /app
# copying only package.json so that I can cache this step
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:22-bookworm-slim
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Don't run production as root
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 --home /app expressjs
USER expressjs

WORKDIR /app
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/configurations ./configurations
COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .

# Set npm cache to a directory the user can write to
RUN npm ci --omit=dev

CMD ["npm", "start"]

