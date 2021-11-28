FROM node:14-alpine

WORKDIR /usr/app

COPY src/ ./src
COPY test/ ./test
COPY .env .env
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

CMD npm start
