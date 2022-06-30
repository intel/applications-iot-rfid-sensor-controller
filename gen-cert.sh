#!/bin/sh
#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
#

name="${1:-server.com}"
key_file=${name}.key
crt_file=${name}.crt

if [ -f ${key_file} ]; then
  echo "${key_file} exists already, not creating new certs"
  return
fi

if [ -f ${crt_file} ]; then
  echo "${crt_file} exists already, not creating new certs"
  return
fi

echo "creating ${name} certs in ${PWD}"

openssl req -x509 \
  -nodes \
  -days 365 \
  -subj "/C=US/ST=AZ/O=RFID Controller Sample/CN=${name}" \
  -addext "subjectAltName=DNS:${name},DNS:localhost,IP:127.0.0.1" \
  -newkey rsa:2048 \
  -keyout ${key_file} \
  -out ${crt_file}

