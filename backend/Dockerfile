FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

ENV NODE_ENV=production
RUN npm prune --production && npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]