#Perform full build
FROM mhart/alpine-node:12 as build
WORKDIR /usr/src/app
RUN apk add --no-cache git python make gcc g++
COPY patches/ ./patches/
COPY package*.json ./
COPY ./.npmrc ./
RUN  npm ci
COPY . .
COPY ./template.env ./.env
RUN npm run build && \
    rm -rf ./node_modules && \
    npm install --g patch-package && \
    npm ci --prod

#Build final image
FROM mhart/alpine-node:slim-12

ARG env
ARG SOURCE_COMMIT

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/ .

ENV BUILD=$SOURCE_COMMIT
ENV BUILD_ENVIRONMENT=$env
ENV NODE_ENV=production

EXPOSE ${APP_PORT}
CMD [ "node", "server.js" ]
