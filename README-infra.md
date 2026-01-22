# Infrastructure & CI/CD Guide

## 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [사전 준비](#사전-준비)
3. [초기 설정](#초기-설정)
4. [SSL 인증서 발급](#ssl-인증서-발급)
5. [서비스 실행](#서비스-실행)
6. [Jenkins 설정](#jenkins-설정)
7. [배포 방법](#배포-방법)
8. [유지보수](#유지보수)

---

## 아키텍처 개요

```
[Front(RN App)]                              [Device]
      │                                          │
      │ HTTPS (/api)                             │ TCP 1883 (직접 연결)
      ▼                                          ▼
┌─────────────────────────────────────────────────────────┐
│                   EC2 (Ubuntu 24.04)                    │
│                                                         │
│  ┌─────────────────┐                                    │
│  │  Nginx (80/443) │                                    │
│  │  - /api→backend │                                    │
│  │  - /jenkins     │                                    │
│  └────────┬────────┘                                    │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │ Backend (:8080) │◄──►│ Mosquitto(:1883)│◄───────────┤
│  └────────┬────────┘    └─────────────────┘   외부:1883│
│           │                                             │
│     ┌─────┴─────┐                                       │
│     ▼           ▼                                       │
│ [MySQL]     [Redis]      [Jenkins]                      │
│  :3306       :6379        :8080                         │
└─────────────────────────────────────────────────────────┘
```

**통신 흐름:**
- **Front → Backend**: Nginx(443) 경유, `/api` 경로로 REST API 호출
- **Backend ↔ Mosquitto**: 컨테이너 내부 네트워크 (MQTT publish/subscribe)
- **Device ↔ Mosquitto**: 외부 1883 포트로 직접 연결 (Nginx 안 거침)

### 서비스 목록
| 서비스 | 포트(내부) | 포트(외부) | 설명 |
|--------|-----------|-----------|------|
| nginx | 80, 443 | 80, 443 | Reverse Proxy, SSL |
| backend | 8080 | - | Spring Boot API |
| mysql | 3306 | - | Database |
| redis | 6379 | - | Cache |
| mosquitto | 1883 | 1883 | MQTT Broker |
| jenkins | 8080 | - | CI/CD (via /jenkins) |

---

## 사전 준비

### 1. EC2 접속
```bash
ssh -i your-key.pem ubuntu@i14a103.p.ssafy.io
```

### 2. Docker 설치 (EC2에서 실행)
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# ubuntu 사용자에 docker 권한 추가
sudo usermod -aG docker ubuntu

# 재접속 또는 newgrp docker
```

### 3. UFW 포트 설정 (EC2에서 실행)
⚠️ **주의: SSH 22번 포트는 절대 차단하지 마세요!**

```bash
# 현재 상태 확인
sudo ufw status verbose

# 필요한 포트 추가 (MQTT)
sudo ufw allow 1883/tcp comment 'MQTT Broker'

# 상태 재확인
sudo ufw status verbose
```

**최종 UFW 상태 (필요 포트):**
- 22 (SSH) - 기존 허용
- 80 (HTTP) - 기존 허용
- 443 (HTTPS) - 기존 허용
- 1883 (MQTT) - **추가 필요**

---

## 초기 설정

### 1. 프로젝트 클론 (EC2에서 실행)
```bash
cd /home/ubuntu
git clone https://lab.ssafy.com/your-team/S14P11A103.git
cd S14P11A103
```

### 2. 환경변수 설정 (EC2에서 실행)
```bash
# .env 파일 생성
cp .env.example .env

# 실제 값으로 수정
nano .env
```

**.env 필수 수정 항목:**
```env
CERTBOT_EMAIL=your-email@ssafy.com    # Let's Encrypt 이메일
MYSQL_ROOT_PASSWORD=강력한비밀번호     # MySQL root 비밀번호
MYSQL_PASSWORD=강력한비밀번호          # MySQL 사용자 비밀번호
```

### 3. 디렉토리 생성 (EC2에서 실행)
```bash
mkdir -p infra/certbot/conf infra/certbot/www infra/certbot/logs
```

---

## SSL 인증서 발급

### 1. 임시 Nginx 실행 (인증서 발급용)
```bash
# 먼저 10-backend.conf를 임시로 비활성화 (SSL 파일이 없으므로)
mv infra/nginx/conf.d/10-backend.conf infra/nginx/conf.d/10-backend.conf.disabled

# Nginx만 실행
docker compose up -d nginx
```

### 2. Certbot으로 인증서 발급
```bash
docker run --rm \
  -v $(pwd)/infra/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/infra/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@ssafy.com \
  --agree-tos \
  --no-eff-email \
  -d i14a103.p.ssafy.io
```

### 3. Nginx 설정 복원 및 재시작
```bash
# 설정 파일 복원
mv infra/nginx/conf.d/10-backend.conf.disabled infra/nginx/conf.d/10-backend.conf

# Nginx 재시작
docker compose restart nginx
```

---

## 서비스 실행

### 전체 서비스 시작
```bash
cd /home/ubuntu/S14P11A103

# 모든 서비스 시작
docker compose up -d

# 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f
```

### 개별 서비스 관리
```bash
# 특정 서비스 재시작
docker compose restart backend

# 특정 서비스 로그
docker compose logs -f backend

# 서비스 중지
docker compose stop backend

# 서비스 시작
docker compose start backend
```

---

## Jenkins 설정

### 1. 초기 비밀번호 확인
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 2. Jenkins 접속
- URL: `https://i14a103.p.ssafy.io/jenkins`
- 초기 비밀번호 입력 후 설정 진행

### 3. 필수 플러그인 설치
- GitLab Plugin
- Pipeline
- Docker Pipeline
- Credentials Binding

### 4. GitLab Webhook 설정
1. GitLab 프로젝트 → Settings → Webhooks
2. URL: `https://i14a103.p.ssafy.io/jenkins/project/your-job-name`
3. Trigger: Push events, Merge request events
4. SSL verification: Enable

### 5. Jenkins Pipeline 생성
1. New Item → Pipeline
2. Build Triggers: "Build when a change is pushed to GitLab"
3. Pipeline: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: GitLab 레포 URL
   - Script Path: `Jenkinsfile`

---

## 배포 방법

### 자동 배포 (Jenkins)
- `master` 브랜치에 merge 시 자동 배포
- Jenkins Pipeline이 다음을 수행:
  1. Git pull
  2. Docker image build
  3. Container restart
  4. Health check

### 수동 배포
```bash
cd /home/ubuntu/S14P11A103

# 배포 스크립트 실행
chmod +x scripts/deploy_backend.sh
./scripts/deploy_backend.sh master
```

---

## 유지보수

### 인증서 갱신 (자동)
- certbot 컨테이너가 12시간마다 자동 갱신 체크
- 수동 갱신이 필요한 경우:
```bash
docker compose exec certbot certbot renew
docker compose exec nginx nginx -s reload
```

### 로그 확인
```bash
# 컨테이너 로그
docker compose logs -f [service-name]

# Nginx 접근 로그
docker compose exec nginx cat /var/log/nginx/access.log

# MySQL 로그
docker compose logs mysql
```

### 백업
```bash
# MySQL 데이터 백업
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup.sql

# 볼륨 백업
docker run --rm -v s14p11a103_mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .
```

### 문제 해결
```bash
# 컨테이너 상태 확인
docker compose ps

# 디스크 사용량 확인
docker system df

# 사용하지 않는 이미지 정리
docker image prune -a

# 컨테이너 재시작
docker compose restart
```

---

## 파일 구조

```
S14P11A103/
├── docker-compose.yml
├── .env.example
├── .env                    # (서버에만, Git 제외)
├── Jenkinsfile
├── README-infra.md
├── server/
│   └── Dockerfile
├── scripts/
│   └── deploy_backend.sh
└── infra/
    ├── nginx/
    │   └── conf.d/
    │       ├── 00-acme.conf
    │       └── 10-backend.conf
    ├── mosquitto/
    │   └── config/
    │       └── mosquitto.conf
    └── certbot/
        ├── conf/           # (서버에만)
        ├── www/            # (서버에만)
        └── logs/           # (서버에만)
```
