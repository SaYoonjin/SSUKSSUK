# SSUKSSUK - IoT 스마트 식물 재배 모니터링 시스템

<!-- 홈 화면 스크린샷 -->
<img width="696" height="1514" alt="image" src="https://github.com/user-attachments/assets/14997ca4-73c2-4b92-9419-51a6a4fd6777" />

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 플랫폼 | Android (React Native) + IoT (Jetson Nano + STM32) |
| 장르 | IoT 기반 스마트 식물 재배 자동화 |
| 개발 환경 | Spring Boot, React Native, Python, C (STM32), Docker |
| 팀 구성 | 6인 |
| 개발 기간 | 2026.01 ~ 2026.02 |

SSUKSSUK은 센서로 식물의 상태를 실시간 모니터링하고, 물/영양분 공급을 자동화하며, AI 기반 식물 건강 분석까지 수행하는 스마트 식물 재배 시스템입니다.

---

## 주요 구현 기능

### 실시간 센서 모니터링
- 온도, 습도, 수위, EC(영양 농도) 센서 데이터 실시간 수집
- SSE(Server-Sent Events) 기반 실시간 대시보드 갱신
- 센서 이상치 감지 시 Push 알림 발송 (Firebase FCM)

### AUTO/MANUAL 모드 제어
- **AUTO 모드**: 수위/영양 농도 이상 감지 시 펌프 자동 작동 및 복구
- **MANUAL 모드**: 사용자가 직접 제어
- STM32 펌웨어 레벨의 상태 머신 기반 자동 복구 로직

### 듀얼 카메라 촬영 및 성장 추적
- 상단 카메라(높이 측정) + 측면 카메라(폭 측정)
- 14일간 성장 기록 앨범
- 센서 히스토리 그래프 시각화

### AI 식물 건강 분석
- YOLO 세그멘테이션 모델로 식물 상태 판별
- 정상, 아픔, 과습, 고온 스트레스, 저온 스트레스 5단계 분류
- TensorRT/ONNX/PyTorch 모델 지원

### 디바이스 관리
- 시리얼 번호 기반 디바이스 등록(Claim) / 해제(Unclaim)
- 식물-디바이스 바인딩 관리
- LED 조명 스케줄링 (종별 최적 광량 설정)

### 식물 관리
- 식물 종(Species)별 환경 파라미터 관리
- 복수 식물 등록 및 메인 식물 전환
- 종별 최적 환경 범위 기반 이상 판단

### 인프라 및 모니터링
- Docker Compose 기반 컨테이너 오케스트레이션
- Jenkins CI/CD 파이프라인 (자동 빌드, 배포, 롤백)
- Prometheus + Grafana + Loki 기반 모니터링 스택
- 12개 알림 규칙 (CPU, 메모리, 디스크, 컨테이너, DB, 애플리케이션)

---

## 시스템 아키텍처

```
  [React Native App]
        │
        │ HTTPS / SSE
        ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Nginx   │────>│ Backend  │────>│  MySQL   │
  │ :80/443  │     │ (Spring  │     │  :3306   │
  └──────────┘     │  Boot)   │     └──────────┘
                   │  :8080   │────>┌──────────┐
                   └────┬─────┘     │  Redis   │
                        │           │  :6379   │
                   MQTT │           └──────────┘
                        ▼
                   ┌──────────┐
                   │Mosquitto │
                   │  :1883   │
                   └────┬─────┘
                        │ MQTT (WebSocket)
                        ▼
                   ┌──────────┐     ┌──────────┐
                   │  Jetson  │────>│  STM32   │
                   │  Nano    │UART │  (센서/  │
                   │ (Python) │     │ 액추에이터)│
                   └──────────┘     └──────────┘
                   듀얼 카메라        온습도, 수위,
                   YOLO 추론         EC, 펌프, LED
```

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Spring Boot | 3.5.7 | REST API 서버 |
| Java | 17 (Temurin) | 서버 언어 |
| Gradle | 8.5 | 빌드 도구 |
| Spring Security + JWT | - | 인증/인가 |
| Spring Data JPA | - | ORM |
| Spring Integration MQTT | - | MQTT 통신 |
| Micrometer + Actuator | - | 메트릭 수집 |
| AWS SDK v2 | 2.41.16 | S3 이미지 저장 |
| Firebase Admin SDK | 9.3.0 | Push 알림 |

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React Native | 0.83.1 | 모바일 앱 프레임워크 |
| React | 19.2.0 | UI 라이브러리 |
| TypeScript | 5.8.3 | 타입 안전성 |
| Hermes | - | JS 엔진 |
| React Native Firebase | 23.8.4 | Push 알림 |

### Embedded
| 기술 | 용도 |
|------|------|
| Python 3.8+ (Jetson Nano) | 센서 데이터 수집, 카메라, MQTT, AI 추론 |
| C (STM32F1) | 하드웨어 센서/액추에이터 제어 |
| YOLO Segmentation | 식물 건강 분석 |
| paho-mqtt | MQTT 클라이언트 |
| UART | Jetson-STM32 시리얼 통신 |

### 인프라
| 기술 | 버전 | 용도 |
|------|------|------|
| Docker Compose | 3.8 | 컨테이너 오케스트레이션 |
| Nginx | 1.25-alpine | 리버스 프록시 / SSL |
| MySQL | 8.0 | 데이터베이스 |
| Redis | 7-alpine | 캐시 |
| Eclipse Mosquitto | 2 | MQTT 브로커 |
| Jenkins | LTS JDK17 | CI/CD |
| Let's Encrypt (Certbot) | - | SSL 인증서 |

### 모니터링
| 기술 | 용도 |
|------|------|
| Prometheus | 메트릭 수집/저장 |
| Grafana | 대시보드 시각화 |
| Loki + Promtail | 로그 수집/검색 |
| Alertmanager | 알림 관리 |
| node-exporter | 호스트 메트릭 |
| cAdvisor | 컨테이너 메트릭 |
| mysql-exporter | DB 메트릭 |
| redis-exporter | 캐시 메트릭 |
| nginx-exporter | 웹서버 메트릭 |

---

## 실행 방법

### 사전 요구사항
- Docker & Docker Compose
- Git

### 1. 소스 클론

```bash
git clone https://lab.ssafy.com/s14-webmobile3-sub1/S14P11A103.git
cd S14P11A103
```

### 2. 환경변수 설정

```bash
cp .env.example .env
vi .env  # 실제 값 입력
```

### 3. Firebase 설정

```bash
mkdir -p /home/ubuntu/secrets
# firebase-service-account.json 파일을 /home/ubuntu/secrets/ 에 배치
```

### 4. SSL 인증서 발급 (최초 1회)

```bash
docker compose up -d nginx
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d i14a103.p.ssafy.io
```

### 5. 전체 서비스 기동

```bash
docker compose up -d
```

### 6. 모니터링 스택 기동

```bash
# MySQL exporter 유저 생성
docker exec -it mysql mysql -u root -p -e "
CREATE USER 'exporter'@'%' IDENTIFIED BY '<비밀번호>';
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
"

# 모니터링 시작
docker compose -f docker-compose.monitoring.yml up -d
```

### 7. Frontend 빌드 (Android APK)

```bash
cd frontend/ssukssuk
npm install
cd android
./gradlew assembleRelease
# 결과: android/app/build/outputs/apk/release/app-release.apk
```

### 8. 접속 정보

| 서비스 | URL |
|--------|-----|
| API | `https://i14a103.p.ssafy.io/api/` |
| Jenkins | `https://i14a103.p.ssafy.io/jenkins/` |
| Grafana | `https://i14a103.p.ssafy.io/grafana/` |

> 상세 배포 가이드는 [exec/포팅_메뉴얼.md](exec/포팅_메뉴얼.md)를 참고하세요.
> 모니터링 상세 가이드는 [exec/모니터링_가이드.md](exec/모니터링_가이드.md)를 참고하세요.

---

## 프로젝트 구조

```
S14P11A103/
├── server/                          # Backend (Spring Boot)
│   ├── src/main/java/com/ssukssuk/
│   │   ├── domain/                  # 도메인별 컨트롤러, 서비스, 레포지토리
│   │   ├── global/                  # 공통 설정, 보안, 예외 처리
│   │   └── SsukssukApplication.java
│   ├── build.gradle
│   └── Dockerfile
│
├── frontend/ssukssuk/               # Frontend (React Native)
│   ├── src/
│   │   ├── screens/                 # 화면 컴포넌트
│   │   ├── components/              # 공통 UI 컴포넌트
│   │   ├── services/                # API 통신
│   │   └── navigation/              # 네비게이션 설정
│   └── android/                     # Android 네이티브 설정
│
├── EM/                              # Embedded Module
│   ├── jetson_app/                  # Jetson Nano (Python)
│   │   ├── main.py                  # 메인 실행 파일
│   │   ├── mqtt_client.py           # MQTT 통신
│   │   ├── camera.py                # 듀얼 카메라 제어
│   │   └── inference.py             # YOLO 식물 건강 분석
│   └── stm_system/                  # STM32 펌웨어 (C)
│       └── Core/Src/
│           ├── main.c               # 메인 루프
│           ├── sensor.c             # 센서 읽기 및 필터링
│           └── auto_recovery.c      # 자동 복구 상태 머신
│
├── infra/                           # 인프라 설정
│   ├── nginx/conf.d/                # Nginx 리버스 프록시
│   ├── mosquitto/config/            # MQTT 브로커
│   └── monitoring/                  # Prometheus, Loki, Grafana 등
│
├── docker-compose.yml               # 앱 서비스
├── docker-compose.monitoring.yml    # 모니터링 서비스
├── Jenkinsfile.ci                   # CI 파이프라인
├── Jenkinsfile.cd                   # CD 파이프라인
└── exec/                            # 포팅 메뉴얼, DB 덤프 등
```

---

## Contributors

| 이름 | 역할 |
|------|------|
| 윤승혁 | 팀장 |
| 박수민 | 팀원 |
| 문하윤 | 팀원 |
| 현광수 | 팀원 |
| 사윤진 | 팀원 |
| 양다희 | 팀원 |
