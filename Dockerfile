FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

COPY . .


FROM base AS development
CMD ["npm", "run", "dev"]

