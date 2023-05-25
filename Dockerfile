FROM node:18-alpine as builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate 
COPY . /app
WORKDIR /app
RUN pnpm i && pnpm run build && pnpm prune --prod
FROM node:18-alpine as base
LABEL fly_launch_runtime="Node.js"
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate 
COPY --from=builder /app /app
WORKDIR /app
EXPOSE 3000
CMD [ "pnpm", "run", "start-prod" ]
