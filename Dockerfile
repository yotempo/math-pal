# Math Pal — single container: Express API + built frontend + SQLite
FROM node:22-slim

WORKDIR /app

# Install dependencies first (better layer caching); dev deps are needed to
# build the frontend (vite/tsc)
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm ci --include=dev

# Copy sources and build the frontend
COPY server server
COPY web web
RUN npm run build --workspace web

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# SQLite lives here — mount a volume to persist across container rebuilds
VOLUME /app/server/data

CMD ["npm", "run", "start", "--workspace", "server"]
