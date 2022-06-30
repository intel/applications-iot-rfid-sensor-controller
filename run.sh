#!/bin/bash
#
# Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause
#
proj_dir="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
controller_cert_dir="${proj_dir}/controller/run/certs"
web_ui_cert_dir="${proj_dir}/web-ui/run/certs"

usage() {
    echo
    echo "-----------------------------------------------------------------"
    echo "Usage: ${BASH_SOURCE[0]##*/} [args]"
    echo "-----------------------------------------------------------------"
    echo "  no args ... controller and web-ui only http."
    echo "  -s, --https"
    echo "    generates certificates (see -c option)"
    echo "    controller and web-ui https"
    echo "  -f, --foreground"
    echo "    docker-compose in foreground with logs to console"
    echo "  -l, --logs [controller,web-ui,db,mqtt]"
    echo "    displays the docker log of the container"
    echo "    -f option will follow(tail) the log"
    echo "  -q, --quit"
    echo "  -c, --certs"
    echo "    generates self signed certs for controller and web-ui"
    echo "    ${controller_cert_dir}"
    echo "    ${web_ui_cert_dir}"
    echo "  -d, --dev"
    echo "    only starts the postgres-db and mqtt-broker containers"
    echo "  -b, --build"
    echo "    triggers rebuild of the docker images"
    echo "  --clean"
    echo "    stops all services and removes the builder images"
    echo "  --clean-all"
    echo "    stops all services and removes all sensor-controller images"
    echo "  -h | --help"
    echo "-----------------------------------------------------------------"
    exit 255
}

notify_dependencies() {
  echo
  echo "Be sure docker and docker-compose are installed"
  echo "Unable to continue..."
  echo
  exit 255
}

# need docker && docker-compose to be installed
( command docker -v &> /dev/null && \
  command docker-compose -v &> /dev/null) \
  || notify_dependencies


gen_cert() {
  sudo docker run -it --rm \
    -v rfid-certs:/certs \
    -v ${proj_dir}/:/tmp/bin/ \
    -w /certs \
    --entrypoint /tmp/bin/gen-cert.sh \
    alpine/openssl ${1}
}

confirm_certs() {
  gen_cert "controller.rfid.com"
  gen_cert "web-ui.rfid.com"
}

clean_builders() {
  echo "stopping services ..."
  docker-compose down
  echo "removing runtime and builder images ..."
  sudo docker rmi \
    sensor-controller/web-ui-builder:latest \
    sensor-controller/web-ui:latest \
    sensor-controller/controller:latest
}

clean_everything() {
  clean_builders
  echo "removing base (node_modules) images ..."
  sudo docker rmi \
    sensor-controller/web-ui-base:latest \
    sensor-controller/controller-base:latest
}

# parse command line
build=false
clean=false
clean_all=false
run_dev=false
run_https=false
container_log=''
follow_log=''
background_flag='-d'

while (( "$#" )); do
  case "$1" in
    -b | --build) build=true ;;
    -c | --certs)
      confirm_certs
      exit ;;
    --clean) clean=true ;;
    --clean-all) clean_all=true ;;
    -d | --dev) run_dev=true ;;
    -f | --foreground)
      background_flag=''
      follow_log='--follow' ;;
    --follow)
      follow_log='--follow' ;;
    -h | --help) usage ;;
    -l | --logs)
      case "$2" in
        'controller') container_log='sensor-controller_controller' ;;
        'db') container_log='sensor-controller_postgres-db' ;;
        'mqtt') container_log='sensor-controller_mqtt-broker' ;;
        'web-ui') container_log='sensor-controller_web-ui' ;;
        '') container_log='sensor-controller_controller' ;;
        *)
          echo "UNKNOWN LOG OPTION ${1}"
          usage ;;
      esac ;;
    -s | --https) run_https=true ;;
    -q | --quit)
      docker-compose down
      exit ;;
    *)
      echo
      echo "UNKNOWN OPTION: ${1}"
      echo
      usage ;;
  esac
  shift
done

if [[ "${clean}" == true ]]; then
  clean_builders
elif [[ "${clean_all}" == true ]]; then
  clean_everything
elif [[ "${build}" == true ]]; then
  echo "building controller-base"
  docker build --target base -t sensor-controller/controller-base:latest ./controller
  echo "building controller"
  docker build --target prod -t sensor-controller/controller:latest ./controller
  echo "building web-ui-base"
  docker build --target base -t sensor-controller/web-ui-base:latest ./web-ui
  echo "building web-ui-builder"
  docker build --target builder -t sensor-controller/web-ui-builder:latest ./web-ui
  echo "building web-ui"
  docker build --target prod -t sensor-controller/web-ui:latest ./web-ui
elif [[ "${container_log}" != '' ]]; then
  docker logs ${container_log} ${follow_log}
elif [[ "${run_dev}" == true ]]; then
  echo "running postgres-db and mqtt-broker"
  docker-compose up ${background_flag} postgres-db mqtt-broker
elif [[ "${run_https}" == true ]]; then
  echo "running https"
  confirm_certs
  docker-compose \
    -f docker-compose.yml \
    -f docker-compose-https.yml \
    up ${background_flag}
else
  echo "running simple"
  docker-compose up ${background_flag}
fi

