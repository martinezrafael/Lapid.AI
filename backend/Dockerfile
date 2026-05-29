FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3333

# Comando padrão (pode ser sobrescrito no docker-compose para rodar o worker)
CMD ["npm", "run", "start:api:dev"]