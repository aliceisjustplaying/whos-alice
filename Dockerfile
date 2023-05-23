# # syntax = docker/dockerfile:1

# # Adjust NODE_VERSION as desired
# ARG NODE_VERSION=18.16.0
# FROM node:${NODE_VERSION}-slim as base



# # Node.js app lives here
# WORKDIR /app

# # Set production environment


# ARG PNPM_VERSION=8.5.1
# RUN npm install -g pnpm@$PNPM_VERSION


# # Throw-away build stage to reduce size of final image
# FROM base as build

# # Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install -y python-is-python3 pkg-config build-essential 

# # Install node modules
# COPY --link package.json pnpm-lock.yaml ./
# RUN pnpm install --frozen-lockfile

# # Copy application code
# COPY --link . .

# # Build application
# RUN pnpm run build

# # Remove development dependencies
# RUN pnpm prune --prod


# # Final stage for app image
# FROM base

# # Copy built application
# COPY --from=build /app /app

# # Start the server by default, this can be overwritten at runtime
# EXPOSE 3000
# CMD [ "pnpm", "run", "start" ]

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
