FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY server/package.json server/pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

COPY server/ .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "index.js"]
