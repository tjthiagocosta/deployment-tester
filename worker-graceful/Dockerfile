FROM node:22-alpine
WORKDIR /app
COPY worker.js .
# Exec form so node is PID 1 and receives the configured stop signal directly (#284).
CMD ["node", "worker.js"]
