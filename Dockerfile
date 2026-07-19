# Etapa 1: Instalar dependencias del servidor
FROM node:20-alpine

WORKDIR /app

# Copiar server
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copiar archivos del servidor
COPY server/ ./server/

# Copiar service account (asegúrate de que existe)
COPY server/service-account-key.json ./server/

# Exponer puerto
EXPOSE 3000

# Ejecutar servidor
CMD ["node", "server/index.js"]