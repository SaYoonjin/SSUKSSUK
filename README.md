# 🌱 SsukSsuk (쑥쑥)

**SsukSsuk(쑥쑥)**은 IoT 센서와 이미지 AI를 활용해 반려식물의 상태를 실시간으로 분석하고,  
이상 상황 발생 시 사용자에게 즉시 알림을 제공하는 **AIoT 기반 반려식물 스마트 관리 서비스**입니다.

센서 데이터와 이미지 분석 결과를 이벤트 단위로 관리하며,  
MQTT 기반 디바이스 통신과 FCM 푸시 알림을 통해  
식물의 이상 감지부터 복구 알림까지 하나의 흐름으로 제공합니다.

## 🛠 주요 기능
### 1. 반려식물 등록 및 관리
- 사용자는 반려식물을 등록하고, 식물 종(species) 정보를 기반으로 관리 가능
- 각 식물은 하나의 디바이스와 연결되며, 연결 상태를 통해 실시간 데이터 수신

### 2. IoT 센서 데이터 수집
- 온도, 습도 등 센서 데이터를 MQTT를 통해 서버로 수집
- 수집된 센서 데이터는 로그로 저장되며, 기준치를 벗어날 경우 이상 이벤트로 처리

### 3. 이미지 기반 이상 감지
- 디바이스에서 업로드된 식물 이미지를 AI 모델로 분석
- 변색 비율, 신뢰도(confidence)를 기준으로 이상 여부 판단
- 이상 감지 시 이미지 분석 이력 및 이벤트 생성

### 4. 이벤트 기반 이상 / 복구 처리
- 센서·이미지 이상 발생 시 이벤트를 OPEN 상태로 생성
- 동일 이벤트 중복 발생 시 단일 이벤트로 관리
- 정상 상태로 복구되면 RESOLVE 처리

### 5. 실시간 알림 시스템
- 이상 발생 및 복구 시 Notification 도메인을 통해 알림 생성
- Firebase Cloud Messaging(FCM)을 활용해 모바일 푸시 알림 전송
- 알림 이력은 DB에 저장되어 사용자 알림 목록에서 확인 가능

### 6. 디바이스 연동 및 제어
- MQTT 토픽 기반 디바이스 등록 및 상태 동기화
- 디바이스 모드 변경, 이미지 업로드 URL 전달 등 서버 → 디바이스 제어 지원


## 기능 명세서

<img width="1097" height="931" alt="image" src="https://github.com/user-attachments/assets/e7ce19e4-5886-4d7b-9b80-e8d23f2c28dc" />

## 화면설계서

![image.png](attachment:491b3c49-6141-4c26-922c-bb1b1535ef47:image.png)

## DB설계

![ERD (1).png](attachment:348302ee-1c0a-411b-b1aa-c3460ce6f1ff:ERD_(1).png)

## API 설계

### 백엔트 - 프론트엔드 API
<img width="1366" height="762" alt="image" src="https://github.com/user-attachments/assets/d1ca37ed-9d34-4c3a-bce2-df6af274379f" />
<img width="951" height="649" alt="image" src="https://github.com/user-attachments/assets/ba8fbe12-b784-4cdb-9e35-b6856a439e58" />
<img width="1064" height="757" alt="image" src="https://github.com/user-attachments/assets/12cb2b8f-52f7-4e43-851a-829a6db10754" />

### 백엔드 - 디바이스 API
<img width="990" height="376" alt="image" src="https://github.com/user-attachments/assets/cc932073-6785-4d0f-bdc4-39aac0a1be7c" />

## 🧩 기술 스택

- **Backend**: Java, Spring Boot, Spring Data JPA, Spring Security
- **Database**: MySQL
- **Messaging**: MQTT
- **Infra**: AWS EC2, RDS
- **Notification**: Firebase Cloud Messaging (FCM)

