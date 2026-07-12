FROM node:22-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/ .

ENV NODE_ENV=production
PORT=5000
EXPOSE 5000

CMD ["node", "index.js"]
