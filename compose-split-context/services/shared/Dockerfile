FROM node:22-alpine
WORKDIR /app
COPY . .
# Fails the build when the wrong folder is used as the Docker context.
RUN test -f server.js
EXPOSE 8080
CMD ["node", "server.js"]
