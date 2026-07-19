FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/

# Establecer NODE_ENV a production
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server/index.js"]