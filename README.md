# 🐾 Pet Diary (펫 다이어리) - Monorepo

반려동물의 건강 기록, 일상 기록, 그리고 스케줄 관리를 위한 모노레포 기반 애플리케이션 프로젝트입니다.

## 🏗️ Monorepo Structure

본 프로젝트는 백엔드와 프론트엔드가 하나의 저장소에서 관리되는 모노레포 구조입니다.

```text
pet-diary/
├── backend/            # Spring Boot (Java) 백엔드 프로젝트
│   ├── src/            # 소스 코드 (Entity, Repository, Service, Controller 등)
│   ├── Dockerfile      # 백엔드 배포를 위한 도커 설정
│   └── build.gradle    # 백엔드 빌드 및 의존성 관리
├── frontend/           # React Native (Expo) 프론트엔드 프로젝트
│   ├── src/            # 소스 코드 (Screens, Components, Navigation, Store 등)
│   ├── src/types/      # 백엔드 OpenAPI 기반 자동 생성 타입
│   └── package.json    # 프론트엔드 빌드 및 의존성 관리
├── docker-compose.yml  # 전체 서비스(DB, Backend) 통합 실행 설정
└── README.md           # 본 가이드 문서
```

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 3.2.4
- **Language:** Java 21
- **Database:** PostgreSQL 14
- **Security:** Spring Security + JWT (with Refresh Token)
- **API Docs:** Swagger (OpenAPI 3.0)

### Frontend
- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **State:** Zustand (with Persist)
- **Network:** Axios (with JWT Interceptor)
- **Types:** OpenAPI-TypeScript (Type Automation)

### Infra & CI/CD
- **Container:** Docker, Docker Compose
- **CI/CD:** GitHub Actions (Automatic Build & Deploy)
- **Server:** Home Server (SSH Deployment)

## 🚀 How to Run

### 1. 전제 조건
- Docker 및 Docker Compose 설치 필요
- Node.js (v20 이상 권장) 설치 필요

### 2. 전체 서비스 실행 (Docker)
루트 디렉토리에서 아래 명령어를 실행하여 데이터베이스와 백엔드를 동시에 띄웁니다.
```bash
docker-compose up -d --build
```
*백엔드 API 서버는 `http://localhost:8080`에서 실행됩니다.*

### 3. 프론트엔드 실행 (Expo)
```bash
cd frontend
npm install
npx expo start
```

## 🔗 CI/CD & Deployment
GitHub `main` 브랜치에 푸시 시 GitHub Actions가 트리거되어 홈 서버에 자동으로 배포됩니다.

### GitHub Secrets 설정
- `SERVER_HOST`: 서버 IP (예: `100.122.114.5`)
- `SERVER_USERNAME`: 서버 접속 계정 (예: `william`)
- `SERVER_KEY`: SSH Private Key (`id_rsa` 내용)

---
© 2026 Pet Diary Project. All rights reserved.
