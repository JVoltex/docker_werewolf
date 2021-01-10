FROM node:12-alpine AS client
WORKDIR /build/client
COPY ./client/package*.json ./
RUN npm ci
COPY ./client .
RUN npm run build

FROM node:12-alpine
COPY --from=client /build/client/out /build/client/out
WORKDIR /build/server
COPY ./server/package*.json ./
RUN npm ci
COPY ./server .
ENV UID="5000"
RUN adduser -D "master" --u $UID
USER $UID
CMD ["npm", "start"]
