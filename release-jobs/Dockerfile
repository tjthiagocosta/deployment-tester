FROM node:22-alpine
RUN apk add --no-cache postgresql-client curl
WORKDIR /app
COPY package.json server.js migrate.sh ./
CMD ["node", "server.js"]
