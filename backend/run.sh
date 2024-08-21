#!/bin/bash

IMAGE_NAME="3d-bot-backend"
IMAGE_TAG="v1.0"
CONTAINER_NAME="bot-container"
PORT="8000"

docker stop ${CONTAINER_NAME} || true
docker rm ${CONTAINER_NAME} || true

docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .


docker run -d -p ${PORT}:${PORT} --name ${CONTAINER_NAME} ${IMAGE_NAME}:${IMAGE_TAG}
