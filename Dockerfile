FROM node:18-alpine 

WORKDIR /app

ARG PORT
ARG APPLICATION_NAME

COPY package*.json .
COPY yarn.lock .
COPY server.js .

RUN yarn install

ENTRYPOINT [ "yarn", "start" ]

## Verificar os plugins instalados no jenkins e validar passo a passo.
## SUBIR REPOSITÓRIO