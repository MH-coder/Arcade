FROM node:14

RUN apt update
RUN apt-get update
RUN apt install nano
RUN npm install -g nodemon

WORKDIR /arcade

COPY package.json ./
RUN npm install && npm cache clean --force

ENV NODE_ENV development

COPY .env /arcade/.env
COPY . /arcade

CMD ["npm", "run", "start:dev"]

EXPOSE 3001
