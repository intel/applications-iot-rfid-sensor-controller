#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
#
FROM node:18-alpine AS base
WORKDIR /web-ui
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM base AS builder
WORKDIR /web-ui
COPY . .
RUN npm run build

FROM nginx:stable-alpine as prod
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /web-ui/dist /usr/share/nginx/html/

