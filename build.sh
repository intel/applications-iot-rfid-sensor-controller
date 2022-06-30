#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
#
proj_dir="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
certs_dir="${proj_dir}/controller/certs"
key_file="${certs_dir}/key.pem"
cert_file="${certs_dir}/cert.pem"

echo "building controller dev image"
docker build -t sensor-controller/controller:dev --target dev ./controller
docker build -t sensor-controller/web-ui:dev --target dev ./web-ui

if [ ! -f "${key_file}" ]; then
  echo "creating controller certs for https connections"
  # create the parent path
  mkdir -p ${key_file%/*}
  openssl req \
    -x509 \
    -new \
    -newkey rsa:4096 \
    -nodes \
    -subj "/CN=localhost /" \
    -keyout "${certs_dir}/key.pem" \
    -out "${certs_dir}/cert.pem" \
    -days 365
fi

