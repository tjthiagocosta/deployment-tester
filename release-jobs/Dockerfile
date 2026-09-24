FROM node:22-alpine
RUN apk add --no-cache postgresql-client curl
WORKDIR /app
COPY package.json server.js migrate.sh ./
COPY bin/ /app/bin/
RUN chmod +x /app/bin/* /app/migrate.sh
# #287: release commands must see the image PATH (a login shell would reset it).
ENV PATH=/app/bin:$PATH
CMD ["node", "server.js"]
