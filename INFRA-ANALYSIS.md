# 인프라 상세 분석 문서

> 이 문서는 인프라 구성의 각 파일을 상세히 분석하고, 잠재적 문제점과 역할을 정리한 참고 문서입니다.
> 마지막 업데이트: 2026-01-23

---

## 목차
1. [파일 구조](#1-파일-구조)
2. [docker-compose.yml 분석](#2-docker-composeyml-분석)
3. [Nginx 설정 분석](#3-nginx-설정-분석)
4. [Jenkinsfile 분석](#4-jenkinsfile-분석)
5. [Dockerfile 분석](#5-dockerfile-분석)
6. [Mosquitto 설정 분석](#6-mosquitto-설정-분석)
7. [배포 스크립트 분석](#7-배포-스크립트-분석)
8. [환경변수 분석](#8-환경변수-분석)
9. [알려진 이슈](#9-알려진-이슈)
10. [서비스 흐름도](#10-서비스-흐름도)

---

## 1. 파일 구조

```
S14P11A103/
├── docker-compose.yml              # [핵심] 전체 서비스 오케스트레이션
├── Jenkinsfile                     # [핵심] CI/CD 파이프라인 정의
├── .env.example                    # 환경변수 템플릿
├── .env                            # (gitignore) 실제 환경변수 - EC2에만 존재
│
├── infra/
│   ├── nginx/
│   │   └── conf.d/
│   │       ├── 00-acme.conf        # HTTP(80) - ACME + 리다이렉트
│   │       └── 10-backend.conf     # HTTPS(443) - 역프록시
│   │
│   ├── mosquitto/
│   │   └── config/
│   │       └── mosquitto.conf      # MQTT 브로커 설정
│   │
│   └── certbot/                    # (EC2에서 생성됨)
│       ├── conf/                   # SSL 인증서 (/etc/letsencrypt)
│       ├── www/                    # ACME challenge 파일
│       └── logs/                   # certbot 로그
│
├── scripts/
│   └── deploy_backend.sh           # 수동 배포 스크립트
│
├── server/
│   └── Dockerfile                  # Spring Boot 빌드 정의
│   └── (소스코드 필요)              # build.gradle, src/ 등
│
├── README.md                       # 프로젝트 메인 문서
├── README-infra.md                 # 인프라 운영 가이드
├── CONVENTION.md                   # Git/Commit 컨벤션
└── INFRA-ANALYSIS.md               # (이 문서)
```

---

## 2. docker-compose.yml 분석

**파일 위치**: `/docker-compose.yml`

### 2.1 전체 구조

```yaml
version: "3.8"  # ⚠️ WARNING: obsolete, docker compose가 무시함

services:
  nginx       # 역프록시 (80, 443)
  certbot     # SSL 자동갱신
  backend     # Spring Boot API
  mysql       # 데이터베이스
  redis       # 캐시
  mosquitto   # MQTT 브로커
  jenkins     # CI/CD

networks:
  app-network  # bridge 네트워크 (모든 서비스 연결)

volumes:
  mysql-data, redis-data, mosquitto-data, mosquitto-log, jenkins-data
```

### 2.2 서비스별 상세 분석

#### nginx (Lines 7-22)
```yaml
nginx:
  image: nginx:1.25-alpine
  ports:
    - "80:80"      # HTTP (ACME + 리다이렉트)
    - "443:443"    # HTTPS (역프록시)
  volumes:
    - ./infra/nginx/conf.d:/etc/nginx/conf.d:ro      # 설정파일
    - ./infra/certbot/conf:/etc/letsencrypt:ro       # SSL 인증서
    - ./infra/certbot/www:/var/www/certbot:ro        # ACME challenge
  depends_on:
    - backend
    - jenkins
```

**역할**:
- HTTP→HTTPS 리다이렉트
- SSL 종단 처리
- `/api/*` → backend:8080 프록시
- `/jenkins/*` → jenkins:8080 프록시

**⚠️ 잠재적 문제**:
- `depends_on`이 backend, jenkins에 걸려있음 → backend가 없으면 nginx 시작 실패
- **해결**: depends_on 제거하거나, backend를 optional하게 변경 필요

```yaml
# 현재 (문제)
depends_on:
  - backend
  - jenkins

# 개선안 (backend 없어도 시작)
depends_on:
  jenkins:
    condition: service_started
# backend 의존성 제거
```

#### certbot (Lines 27-37)
```yaml
certbot:
  image: certbot/certbot:latest
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
  volumes:
    - ./infra/certbot/conf:/etc/letsencrypt        # 인증서 저장
    - ./infra/certbot/www:/var/www/certbot         # ACME webroot
    - ./infra/certbot/logs:/var/log/letsencrypt    # 로그
```

**역할**:
- 12시간마다 `certbot renew` 실행
- SSL 인증서 자동 갱신

**⚠️ 잠재적 문제**:
- 갱신 후 nginx reload가 없음 → 인증서 갱신되어도 nginx가 새 인증서 로드 안함
- **해결**: certbot 갱신 후 nginx reload 필요

```bash
# 수동으로 nginx reload
docker exec nginx nginx -s reload
```

#### backend (Lines 42-66)
```yaml
backend:
  build:
    context: ./server
    dockerfile: Dockerfile
  expose:
    - "8080"           # 내부 포트만 (외부 노출 X)
  environment:
    - SPRING_PROFILES_ACTIVE=prod
    - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/${MYSQL_DATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
    - SPRING_DATASOURCE_USERNAME=${MYSQL_USER}
    - SPRING_DATASOURCE_PASSWORD=${MYSQL_PASSWORD}
    - SPRING_REDIS_HOST=redis
    - SPRING_REDIS_PORT=6379
    - MQTT_BROKER_URL=tcp://mosquitto:1883
  depends_on:
    mysql:
      condition: service_healthy    # mysql 헬스체크 통과 후 시작
    redis:
      condition: service_started
    mosquitto:
      condition: service_started
```

**역할**:
- Spring Boot REST API 서버
- MySQL, Redis, Mosquitto 연결

**⚠️ 잠재적 문제**:
1. **소스코드 없음**: `./server` 디렉토리에 Dockerfile만 있고, build.gradle, src/ 없음
2. **useSSL=false**: MySQL 연결 시 SSL 미사용 (내부 네트워크라 OK)
3. **allowPublicKeyRetrieval=true**: 보안상 주의 필요 (내부 네트워크라 OK)

#### mysql (Lines 71-89)
```yaml
mysql:
  image: mysql:8.0
  environment:
    - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
    - MYSQL_DATABASE=${MYSQL_DATABASE}
    - MYSQL_USER=${MYSQL_USER}
    - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    - TZ=Asia/Seoul
  volumes:
    - mysql-data:/var/lib/mysql    # Named volume (데이터 영속화)
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**역할**:
- 주 데이터베이스
- 헬스체크로 준비 상태 확인

**⚠️ 잠재적 문제**:
1. **healthcheck 비밀번호 노출**: `-p${MYSQL_ROOT_PASSWORD}`가 프로세스 목록에 노출될 수 있음
   - **해결**: `MYSQL_PWD` 환경변수 사용 권장
2. **외부 포트 미노출**: 내부 전용 (정상)

```yaml
# 개선된 healthcheck
healthcheck:
  test: ["CMD-SHELL", "MYSQL_PWD=${MYSQL_ROOT_PASSWORD} mysqladmin ping -h localhost -u root"]
```

#### redis (Lines 94-101)
```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
```

**역할**:
- 세션/캐시 저장소

**⚠️ 잠재적 문제**:
- **비밀번호 없음**: 내부 네트워크 전용이라 OK, 필요시 `--requirepass` 추가

#### mosquitto (Lines 106-117)
```yaml
mosquitto:
  image: eclipse-mosquitto:2
  ports:
    - "1883:1883"        # ⚠️ 외부 노출!
  volumes:
    - ./infra/mosquitto/config:/mosquitto/config:ro
    - mosquitto-data:/mosquitto/data
    - mosquitto-log:/mosquitto/log
```

**역할**:
- MQTT 브로커 (디바이스 ↔ 백엔드 통신)

**⚠️ 잠재적 문제**:
1. **1883 포트 외부 노출 + 인증 없음**: 누구나 MQTT 접속 가능
   - mosquitto.conf에서 `allow_anonymous true` 설정
   - **프로덕션에서는 반드시 인증 추가 필요**

#### jenkins (Lines 122-140)
```yaml
jenkins:
  image: jenkins/jenkins:lts-jdk17
  user: root                    # ⚠️ root 권한 실행
  expose:
    - "8080"                    # 내부 포트
  ports:
    - "50000:50000"             # Agent 통신용
  environment:
    - JENKINS_OPTS=--prefix=/jenkins
    - TZ=Asia/Seoul
    - JAVA_OPTS=-Dhudson.security.csrf.GlobalCrumbIssuerConfiguration.DISABLE_CSRF_PROTECTION=true -Djenkins.install.runSetupWizard=true -Dhudson.security.csrf.DefaultCrumbIssuer.EXCLUDE_SESSION_ID=true -Djenkins.model.Jenkins.crumbIssuerProxyCompatibility=true
  volumes:
    - jenkins-data:/var/jenkins_home
    - /var/run/docker.sock:/var/run/docker.sock    # Docker 소켓 마운트
    - /usr/bin/docker:/usr/bin/docker              # Docker CLI
```

**역할**:
- CI/CD 파이프라인 실행
- Docker 소켓으로 호스트 Docker 제어

**⚠️ 잠재적 문제**:
1. **user: root**: 보안상 위험하지만, Docker 소켓 접근에 필요
2. **Docker 소켓 마운트**: Jenkins가 호스트 Docker 전체 제어 가능 (의도된 동작)
3. **CSRF 비활성화**: reverse proxy 문제 해결용이지만 보안 약화
4. **⚠️ 현재 403 에러 발생 중**: reverse proxy 설정 문제

---

## 3. Nginx 설정 분석

### 3.1 00-acme.conf (HTTP:80)

**파일 위치**: `/infra/nginx/conf.d/00-acme.conf`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name i14a103.p.ssafy.io;

    # Let's Encrypt ACME Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

**역할**:
- Line 11-13: ACME challenge 응답 (certbot 인증서 발급/갱신용)
- Line 16-17: 나머지 모든 HTTP 요청 → HTTPS로 301 리다이렉트

**⚠️ 잠재적 문제**: 없음 (정상)

### 3.2 10-backend.conf (HTTPS:443)

**파일 위치**: `/infra/nginx/conf.d/10-backend.conf`

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;                    # HTTP/2 활성화 (nginx 1.25.1+ 문법)
    server_name i14a103.p.ssafy.io;

    ssl_certificate /etc/letsencrypt/live/i14a103.p.ssafy.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/i14a103.p.ssafy.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    resolver 127.0.0.11 valid=30s;    # Docker DNS resolver

    # Backend API 프록시
    location /api/ {
        set $backend backend:8080;
        proxy_pass http://$backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Jenkins 프록시
    location /jenkins/ {
        set $jenkins jenkins:8080;
        proxy_pass http://$jenkins/jenkins/;
        proxy_http_version 1.1;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;      # 고정값 https
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_set_header X-Forwarded-Port 443;

        proxy_set_header Upgrade $http_upgrade;        # WebSocket 지원
        proxy_set_header Connection "upgrade";

        proxy_buffer_size 128k;                        # 큰 응답 처리
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;

        # Cookie 및 Redirect 설정
        proxy_cookie_path /jenkins /jenkins;
        proxy_redirect http://jenkins:8080/jenkins/ https://$http_host/jenkins/;
        proxy_redirect http:// https://;
    }

    # 기본 응답
    location / {
        return 404;
    }
}
```

**라인별 분석**:

| 라인 | 코드 | 역할 |
|------|------|------|
| 6-7 | `listen 443 ssl` | HTTPS 리스닝 |
| 8 | `http2 on` | HTTP/2 활성화 |
| 11-12 | `ssl_certificate*` | SSL 인증서 경로 |
| 15 | `resolver 127.0.0.11` | Docker 내부 DNS (컨테이너 이름 해석) |
| 17-25 | `location /api/` | Backend API 프록시 |
| 27-50 | `location /jenkins/` | Jenkins 프록시 |
| 52-54 | `location /` | 그 외 404 |

**⚠️ 잠재적 문제**:
1. **SSL 인증서 경로 하드코딩**: 도메인 변경 시 수정 필요
2. **⚠️ Jenkins 403 에러**: 현재 reverse proxy 설정에도 불구하고 403 발생 중
   - Jenkins 자체 보안 설정 문제로 추정

---

## 4. Jenkinsfile 분석

**파일 위치**: `/Jenkinsfile`

### 4.1 전체 구조

```groovy
pipeline {
    agent any

    environment {
        PROJECT_ROOT = '/home/ubuntu/S14P11A103'    // EC2 경로
        COMPOSE_FILE = "${PROJECT_ROOT}/docker-compose.yml"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')    // 최대 30분
        disableConcurrentBuilds()              // 동시 빌드 방지
        buildDiscarder(logRotator(numToKeepStr: '10'))  // 최근 10개만 보관
    }

    stages {
        stage('Checkout') { ... }
        stage('Build & Static Analysis') { ... }  // develop, MR만
        stage('Deploy to Production') { ... }     // master만
    }
}
```

### 4.2 Stage별 분석

#### Stage 1: Checkout (Lines 24-29)
```groovy
stage('Checkout') {
    steps {
        checkout scm
        sh 'git log -1 --pretty=format:"%h - %s (%ci)" || true'
    }
}
```

**역할**: 모든 브랜치에서 코드 체크아웃

#### Stage 2: Build & Static Analysis (Lines 34-57)
```groovy
stage('Build & Static Analysis') {
    when {
        anyOf {
            branch 'develop'
            changeRequest()     // MR/PR
        }
    }
    steps {
        dir('server') {
            sh '''
                ./gradlew clean build -x test --no-daemon
                ./gradlew checkstyleMain --no-daemon || true
            '''
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'server/build/reports/**/*', allowEmptyArchive: true
        }
    }
}
```

**역할**:
- develop 브랜치 또는 MR 시에만 실행
- 빌드 + 정적분석 (checkstyle)

**⚠️ 잠재적 문제**:
1. `-x test`: 테스트 스킵됨 (의도된 동작)
2. `|| true`: checkstyle 실패해도 파이프라인 계속 (의도된 동작)

#### Stage 3: Deploy to Production (Lines 62-107)
```groovy
stage('Deploy to Production') {
    when {
        branch 'master'
    }
    steps {
        script {
            sh '''
                cd ${PROJECT_ROOT}
                git fetch origin master
                git checkout master
                git pull origin master

                docker compose -f ${COMPOSE_FILE} stop backend || true
                docker compose -f ${COMPOSE_FILE} build --no-cache backend
                docker compose -f ${COMPOSE_FILE} up -d backend

                # Health check (20회 시도, 3초 간격)
                for i in $(seq 1 20); do
                    if docker exec backend wget ... ; then
                        exit 0
                    fi
                    sleep 3
                done
                exit 1
            '''
        }
    }
}
```

**역할**:
- master 브랜치에서만 실행
- EC2에서 직접 git pull → docker build → health check

**⚠️ 잠재적 문제**:
1. **PROJECT_ROOT 경로**: `/home/ubuntu/S14P11A103` 하드코딩 → EC2 경로와 일치 필요
2. **git 인증 문제**: EC2에서 git pull 시 인증 필요할 수 있음 (현재 문제 있음)
3. **build --no-cache**: 매번 전체 빌드 (시간 소요, 캐시 미사용)

---

## 5. Dockerfile 분석

**파일 위치**: `/server/Dockerfile`

### 5.1 전체 구조 (Multi-stage Build)

```dockerfile
# Stage 1: Build
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 5.2 라인별 분석

| 라인 | 코드 | 역할 |
|------|------|------|
| 7 | `FROM gradle:8.5-jdk17` | 빌드용 이미지 |
| 12-13 | `COPY build.gradle...` | 의존성 파일 먼저 복사 (캐싱용) |
| 16 | `RUN gradle dependencies` | 의존성 다운로드 (캐시됨) |
| 19 | `COPY src ./src` | 소스코드 복사 |
| 22 | `RUN gradle bootJar -x test` | JAR 빌드 (테스트 스킵) |
| 25 | `FROM eclipse-temurin:17-jre-alpine` | 런타임 이미지 (경량) |
| 30-31 | `addgroup/adduser` | 비root 사용자 생성 |
| 34 | `COPY --from=builder` | 빌드된 JAR만 복사 |
| 39 | `USER appuser` | 비root로 실행 |
| 45-46 | `HEALTHCHECK` | 헬스체크 (actuator/health) |

**⚠️ 잠재적 문제**:
1. **⚠️ 소스코드 없음**: build.gradle, settings.gradle, src/ 디렉토리가 없음
2. `*.jar` 와일드카드: JAR 파일이 여러 개면 문제 발생
3. `-x test`: 테스트 스킵 (의도된 동작)

**필요한 파일**:
```
server/
├── Dockerfile          # ✅ 있음
├── build.gradle        # ❌ 없음
├── settings.gradle     # ❌ 없음
├── gradle/
│   └── wrapper/        # ❌ 없음
└── src/
    └── main/           # ❌ 없음
```

---

## 6. Mosquitto 설정 분석

**파일 위치**: `/infra/mosquitto/config/mosquitto.conf`

```conf
# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information

# Connection settings
connection_messages true

# Listener
listener 1883
allow_anonymous true    # ⚠️ 인증 없음!
```

**라인별 분석**:

| 라인 | 설정 | 역할 |
|------|------|------|
| 6-7 | `persistence true` | 메시지 영속화 |
| 10-14 | `log_dest/log_type` | 로깅 설정 |
| 17 | `connection_messages true` | 연결 로그 |
| 23 | `listener 1883` | 1883 포트 리스닝 |
| 24 | `allow_anonymous true` | **인증 없이 접속 허용** |

**⚠️ 잠재적 문제**:
1. **⚠️ 보안 위험**: `allow_anonymous true` + 외부 포트 노출
   - 누구나 MQTT 메시지 발행/구독 가능
   - 디바이스 조작 위험

**프로덕션 권장 설정**:
```conf
# 인증 활성화
allow_anonymous false
password_file /mosquitto/config/passwd

# 또는 TLS 활성화
listener 8883
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
```

---

## 7. 배포 스크립트 분석

**파일 위치**: `/scripts/deploy_backend.sh`

```bash
#!/bin/bash
set -e    # 에러 시 중단

PROJECT_ROOT="/home/ubuntu/S14P11A103"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
BRANCH="${1:-master}"    # 기본값: master

# [1/5] Git pull
cd "$PROJECT_ROOT"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# [2/5] Stop backend
docker compose -f "$COMPOSE_FILE" stop backend || true

# [3/5] Build
docker compose -f "$COMPOSE_FILE" build --no-cache backend

# [4/5] Start
docker compose -f "$COMPOSE_FILE" up -d backend

# [5/5] Health check (30회 시도)
for retry in {1..30}; do
    if docker exec backend wget ... ; then
        exit 0
    fi
    sleep 2
done
exit 1
```

**역할**: 수동 배포 시 사용 (Jenkinsfile과 유사한 로직)

**⚠️ 잠재적 문제**:
1. **PROJECT_ROOT 하드코딩**: EC2 경로 일치 필요
2. **git 인증**: 수동 실행 시 인증 문제 가능
3. **`--no-cache`**: 매번 전체 빌드 (캐시 미사용)

---

## 8. 환경변수 분석

**파일 위치**: `/.env.example`

```env
# Domain
DOMAIN=i14a103.p.ssafy.io
CERTBOT_EMAIL=your-email@ssafy.com

# MySQL
MYSQL_ROOT_PASSWORD=your_root_password_here
MYSQL_DATABASE=plantcare
MYSQL_USER=plantcare_user
MYSQL_PASSWORD=your_password_here

# Redis (비밀번호 미사용)
# REDIS_PASSWORD=

# MQTT
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883

# Spring Boot
SPRING_PROFILES_ACTIVE=prod

# JWT (필요 시)
# JWT_SECRET=your_jwt_secret_here
```

**필수 환경변수**:

| 변수 | 용도 | 사용처 |
|------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 비밀번호 | mysql 컨테이너 |
| `MYSQL_DATABASE` | 데이터베이스명 | mysql, backend |
| `MYSQL_USER` | DB 사용자명 | mysql, backend |
| `MYSQL_PASSWORD` | DB 사용자 비밀번호 | mysql, backend |

**⚠️ 주의사항**:
- `.env` 파일은 절대 git에 커밋하지 말 것
- EC2에만 `.env` 파일 존재해야 함

---

## 9. 알려진 이슈

### 9.1 Critical (해결 필요)

| # | 이슈 | 상태 | 설명 |
|---|------|------|------|
| 1 | **Spring Boot 소스코드 없음** | ❌ 미해결 | server/ 디렉토리에 Dockerfile만 존재 |
| 2 | **Jenkins 403 에러** | ⏸️ 보류 | reverse proxy 뒤에서 접근 불가 |

### 9.2 Warning (주의 필요)

| # | 이슈 | 위치 | 설명 |
|---|------|------|------|
| 3 | MQTT 인증 없음 | mosquitto.conf:24 | `allow_anonymous true` |
| 4 | nginx depends_on backend | docker-compose.yml:18-20 | backend 없으면 nginx 시작 실패 |
| 5 | git 인증 문제 | EC2 | git pull 시 인증 실패 |
| 6 | version obsolete 경고 | docker-compose.yml:1 | `version: "3.8"` 제거 권장 |

### 9.3 Jenkins 403 에러 상세

**증상**: `https://i14a103.p.ssafy.io/jenkins/` 접속 시 403 + 무한 새로고침

**로그 분석**:
```
GET /jenkins/login?from=%2Fjenkins%2F HTTP/2.0" 403
GET /jenkins/static/.../redirect.js HTTP/2.0" 403
```

**시도한 해결책**:
1. nginx `proxy_set_header X-Forwarded-Proto https` ✅
2. nginx `proxy_cookie_path /jenkins /jenkins` ✅
3. JAVA_OPTS에 CSRF 관련 옵션 추가 ✅
4. ❌ 아직 미해결

**추가 시도 필요**:
- Jenkins config.xml에서 `<useSecurity>false</useSecurity>` 임시 설정
- Jenkins 재설치

---

## 10. 서비스 흐름도

### 10.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Internet                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │       UFW/AWS SG      │
                    │  (22, 80, 443, 1883)  │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
   ┌─────────┐            ┌─────────┐            ┌─────────────┐
   │ :80/443 │            │ :1883   │            │ :50000      │
   │  Nginx  │            │Mosquitto│            │Jenkins Agent│
   └────┬────┘            └────┬────┘            └─────────────┘
        │                      │
   ┌────┴────────────┐         │
   │                 │         │
   ▼                 ▼         │
┌──────────┐   ┌──────────┐    │
│ /api/*   │   │/jenkins/*│    │
│ Backend  │   │ Jenkins  │    │
│  :8080   │   │  :8080   │    │
└────┬─────┘   └──────────┘    │
     │                         │
     ├────────┬────────────────┤
     │        │                │
     ▼        ▼                ▼
┌────────┐ ┌───────┐    ┌───────────┐
│ MySQL  │ │ Redis │    │ Mosquitto │
│ :3306  │ │ :6379 │    │   :1883   │
└────────┘ └───────┘    └───────────┘
```

### 10.2 CI/CD 흐름

```
┌──────────────────────────────────────────────────────────────────┐
│                         GitLab                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                       │
│  │ feature │───▶│ develop │───▶│ master  │                       │
│  └─────────┘    └────┬────┘    └────┬────┘                       │
└──────────────────────┼──────────────┼────────────────────────────┘
                       │              │
                       │ MR          │ Merge
                       ▼              ▼
              ┌────────────────────────────────────┐
              │            Jenkins                  │
              │  ┌──────────────────────────────┐  │
              │  │ develop/MR:                  │  │
              │  │  - Build (gradlew build)     │  │
              │  │  - Static Analysis           │  │
              │  └──────────────────────────────┘  │
              │  ┌──────────────────────────────┐  │
              │  │ master:                      │  │
              │  │  - git pull                  │  │
              │  │  - docker compose build      │  │
              │  │  - docker compose up         │  │
              │  │  - Health check              │  │
              │  └──────────────────────────────┘  │
              └────────────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────────┐
              │         Backend Container          │
              │  (새 버전 배포됨)                   │
              └────────────────────────────────────┘
```

### 10.3 요청 흐름

```
[Client App]
     │
     │ HTTPS :443
     ▼
[Nginx]
     │
     ├── /api/* ──────▶ [Backend :8080] ──▶ [MySQL :3306]
     │                         │
     │                         └──────────▶ [Redis :6379]
     │
     └── /jenkins/* ──▶ [Jenkins :8080]


[IoT Device]
     │
     │ MQTT :1883
     ▼
[Mosquitto] ◀──────▶ [Backend :8080]
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-23 | 초기 문서 작성 |
| 2026-01-23 | Jenkins 403 이슈 추가 |
| 2026-01-23 | JAVA_OPTS 설정 업데이트 |
