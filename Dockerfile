FROM node:18-alpine 

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY server.js .

ENTRYPOINT [ "node server.js" ]

## Verificar os plugins instalados no jenkins e validar passo a passo.
## SUBIR REPOSITÓRIO