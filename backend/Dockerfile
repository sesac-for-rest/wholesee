FROM golang:1.25-alpine

WORKDIR /app

# 개발 도구 설치 (Air - hot reload)
RUN go install github.com/air-verse/air@latest

EXPOSE 3000

# Air를 사용한 hot-reload 또는 go run 사용
CMD ["sh", "-c", "go mod download && go run ./cmd/server/main.go"]
