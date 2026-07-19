FROM node:20-alpine

WORKDIR /app

# Copiar server
COPY server/package*.json ./server/
RUN cd server && npm install

# Copiar archivos del servidor
COPY server/ ./server/

# Crear service-account-key.json desde variable de entorno
RUN echo "$SERVICE_ACCOUNT_KEY" | base64 -d > ./server/service-account-key.json


EXPOSE 3000

CMD ["node", "server/index.js"]