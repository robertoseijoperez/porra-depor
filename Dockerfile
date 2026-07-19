FROM node:20-alpine

# Definimos el directorio directamente en la carpeta del servidor
WORKDIR /app/server

# Copiamos los archivos de dependencias
COPY server/package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código del servidor
COPY server/ ./

# Establecer NODE_ENV a production
ENV NODE_ENV=production

EXPOSE 3000

# Ejecutamos el archivo directamente desde el directorio actual
CMD ["node", "index.js"]
