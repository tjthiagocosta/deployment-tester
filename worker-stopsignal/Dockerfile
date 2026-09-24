FROM node:22-alpine
WORKDIR /app
COPY worker.js .
# #284 scenario 5: the image declares its own stop signal; an empty dashboard signal must keep it.
STOPSIGNAL SIGINT
CMD ["node", "worker.js"]
