FROM node:16.6.2-alpine

ENV NODE_ENV "development"
ENV PORT 3000

USER node
WORKDIR /home/node/app
COPY --chown=node:node . .

RUN yarn install
RUN yarn build

EXPOSE $PORT

CMD ["yarn", "start"]

