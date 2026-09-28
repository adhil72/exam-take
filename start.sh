#!/bin/bash
set -e

# Detect if docker requires sudo
if docker info >/dev/null 2>&1; then
    DOCKER_CMD="docker"
else
    echo "Docker permission denied for current user. Running with 'sudo'..."
    DOCKER_CMD="sudo docker"
fi

echo "Building GExam Image..."
$DOCKER_CMD build -t gexam-app .

echo "Running GExam Container..."
QUESTIONS_PATH="${QUESTIONS_PATH:-$(cd "$(dirname "$0")/../gate-questions" && pwd)}"
$DOCKER_CMD run -p 3000:3000 \
    -v gexam-data:/app/data \
    -v "$QUESTIONS_PATH":/gate-questions:ro \
    gexam-app
