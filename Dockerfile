# --- Build Stage ---
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install


COPY . .
RUN npm run build


# --- Runtime Stage ---
FROM node:20-bullseye-slim
WORKDIR /app

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-freefont-ttf fonts-kacst fonts-symbola fonts-thai-tlwg \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/email.html ./
COPY --from=builder /app/img ./img

EXPOSE 3000

CMD ["npm", "start"]