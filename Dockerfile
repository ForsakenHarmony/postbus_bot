FROM node:8-alpine

RUN mkdir -p /urs/src/app
WORKDIR /usr/src/app

ENV TZ 'Europe/Berlin'
ENV NODE_ENV production

ENV BOT_TOKEN ''
ENV DB_NAME trapsbot
ENV DB_HOST 127.0.0.1
ENV DB_PORT 5985
ENV DB_USER admin
ENV DB_PASS admin

COPY package.json package-lock.json ./
ENV NODE_ENV production
RUN npm install

COPY . ./

EXPOSE 3030
CMD [ "npm", "start" ]
