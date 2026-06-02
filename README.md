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

### 4. 로컬 하이브리드 개발 모드 (추천 💻)
로컬에서 백엔드 코드를 신속하게 디버깅하고 핫스왑을 활용하기 위한 개발 방식입니다. 데이터베이스(DB)는 Docker로 간편하게 구동하고, 백엔드는 IntelliJ나 Eclipse 등 IDE에서 직접 구동합니다.

1. **로컬 DB만 백그라운드로 실행**
   ```bash
   docker compose up db -d
   ```
2. **IDE에서 백엔드 구동**
   - IntelliJ 또는 STS에서 백엔드 프로젝트(`backend`)를 열고 실행합니다.
   - 로컬 구동 시 백엔드는 자동으로 `28080` 포트로 켜집니다.
3. **프론트엔드 API 주소 연결**
   - [frontend/src/api/client.ts](file:///Users/william/Documents/GitHub/pet-diary/frontend/src/api/client.ts) 파일의 `BASE_URL`을 PC의 사설 IP 주소로 고정해 줍니다.
   - 예: `const BASE_URL = 'http://192.168.0.11:28080';` *(기기와 PC가 같은 Wi-Fi에 연결되어 있어야 합니다.)*

---

## 🛠️ 트러블슈팅 (Troubleshooting)

### Q. IDE에서 서버 기동 시 `Port 28080 was already in use` 에러가 나요.
- **원인**: 이전에 실행한 도커의 백엔드 컨테이너(`pet-diary-backend`)가 포트 `28080`을 이미 차지하고 있기 때문입니다.
- **해결책**: 도커 컨테이너를 한 번 내렸다가 DB만 단독으로 다시 구동한 후 IDE에서 서버를 실행하세요.
  ```bash
  docker compose down
  docker compose up db -d
  ```

### Q. 앱(Expo Go)에서 요청 시 `Network Error` (timeout)가 뜹니다.
- **원인 1**: 핸드폰과 PC가 동일한 와이파이 네트워크에 연결되지 않았거나, PC의 사설 IP가 변경되었을 수 있습니다.
- **원인 2**: IDE에서 디버그 모드로 구동할 때 회원가입/로그인 로직에 **중단점(Breakpoint)**이 걸려 무응답 상태에 빠진 경우입니다.
- **해결책**:
  1. PC의 IP 주소를 확인한 뒤(`ipconfig getifaddr en0`), [client.ts](file:///Users/william/Documents/GitHub/pet-diary/frontend/src/api/client.ts)의 IP와 동일한지 확인하세요.
  2. IDE 콘솔을 확인해 중단점에 걸려 대기 중인지 보시고, 중단점을 해제하거나 흐름을 재개(Resume)하세요.

---

## 🔗 CI/CD & Deployment
GitHub `main` 브랜치에 푸시 시 GitHub Actions가 트리거되어 홈 서버에 자동으로 배포됩니다.

### GitHub Secrets 설정
- `SERVER_HOST`: 서버 IP (예: `100.122.114.5`)
- `SERVER_USERNAME`: 서버 접속 계정 (예: `william`)
- `SERVER_KEY`: SSH Private Key (`id_rsa` 내용)

---
© 2026 Pet Diary Project. All rights reserved.
