FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY index.mjs ./
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "index.mjs"]
