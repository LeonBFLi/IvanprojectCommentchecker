FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 2888
ENV PORT=2888
ENV LOG_DIR=/var/ivanproject/logs
CMD ["npm", "start"]
