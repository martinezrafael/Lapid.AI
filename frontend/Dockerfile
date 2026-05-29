FROM node:20-alpine

WORKDIR /usr/src/app

# Copia os manifestos para otimizar o cache de camadas do Docker
COPY package*.json ./
RUN npm install

# Copia o restante dos arquivos do código do frontend
COPY . .

EXPOSE 3000

# Executa o Vite em modo de desenvolvimento exposto para a rede do Docker
CMD ["npm", "run", "dev"]