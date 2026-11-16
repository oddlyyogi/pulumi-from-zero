FROM node:24-slim
WORKDIR /app
COPY server.js ./
COPY public ./public
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "server.js"]
