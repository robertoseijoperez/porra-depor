# 1. Fase de compilación
FROM node:24.16.0-alpine AS build
WORKDIR /app

# Copiar archivos de configuración del frontend
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar
COPY . .
RUN npm run build

# 2. Fase de ejecución (Servidor de estáticos)
FROM node:24.16.0-alpine
WORKDIR /app

# Instalar un servidor estático ligero
RUN npm install -g serve

# Copiar los archivos compilados desde la fase anterior
# (Asegúrate de que "porra-depor" coincide con el nombre en tu dist/)
COPY --from=build /app/dist/porra-depor/browser ./browser

EXPOSE 3000
CMD ["serve", "-s", "browser", "-l", "3000"]
