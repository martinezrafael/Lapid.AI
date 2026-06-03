FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

RUN npm install --include=dev

COPY . .

FROM base AS development
CMD ["npm", "run", "dev"]