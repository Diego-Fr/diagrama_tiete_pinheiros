# ---- build ----
FROM node:18-alpine AS build
WORKDIR /app

# Override opcional pra VITE_API_BASE — por padrão fica sem valor, e o app
# cai no default same-origin ("/sibh/api", ver src/api/base.ts), que é o
# certo se este container for servido atrás do MESMO domínio da API
# (apps.spaguas.sp.gov.br). Só passar --build-arg VITE_API_BASE=... se o
# deploy for atrás de outro host/proxy que precise apontar pra API diferente.
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

# package*.json antes do resto do código — cache da camada do `npm ci` só
# invalida quando as dependências mudam, não a cada mudança de código.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
