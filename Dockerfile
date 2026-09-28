FROM node:22-bookworm

WORKDIR /app

# Copy package files for caching
COPY package*.json ./
RUN npm ci

COPY . .

# Build the frontend
RUN npm run build

EXPOSE 3000

# Exam data (JSON files) lives in /app/data; the gate-questions checkout is mounted at /gate-questions
ENV DATA_DIR=/app/data
ENV QUESTIONS_DIR=/gate-questions
VOLUME ["/app/data"]

CMD ["npm", "run", "start"]
