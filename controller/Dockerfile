#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
## see https://hub.docker.com/_/node
FROM node:19-alpine AS base
ENV NODE_ENV=production
WORKDIR /controller
COPY ./package*.json ./
RUN npm ci && npm cache clean --force

FROM base AS prod
ENV NODE_ENV=production
WORKDIR /controller
COPY ./src/ ./
ENTRYPOINT ["node", "./server.js"]
