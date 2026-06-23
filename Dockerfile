# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S agent && \
    adduser -S agent -u 1001

USER agent

EXPOSE 37701

ENV NODE_ENV=production
ENV PORT=37701

CMD ["node", "dist/index.js"]