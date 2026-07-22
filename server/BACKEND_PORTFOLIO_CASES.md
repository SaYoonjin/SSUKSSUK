# 백엔드 직무 지원 어필 사례 정리

> 이 문서는 현재 서버 프로젝트 코드 기준으로, 백엔드 직무 지원서/면접에서 어필할 수 있는 구현 사례를 정리한 자료입니다. 성과 수치는 코드에서 확인 가능한 값(API 수, TTL, 스케줄 주기, 스레드풀 크기 등)을 우선 사용했습니다.

## 프로젝트 개요

- Spring Boot 3.5.7, Java 17 기반의 스마트 식물 관리 서버
- 주요 기술: Spring Web, Spring Security, JPA, MySQL, Redis, MQTT, AWS S3 Presigned URL, Firebase FCM, SSE, Actuator, Prometheus
- 코드 규모 기준
  - Controller 11개
  - REST/SSE/Test 포함 Mapping 39개
  - Entity 14개
  - Repository 14개
  - Service/Infra Service 계층 28개

---

## 1. MQTT 기반 IoT 메시지 수신 파이프라인 분리

### 상황

식물 재배 기기에서 센서 데이터, 이미지 분석 결과, 제어 결과, ACK 등 서로 다른 성격의 MQTT 메시지가 들어오는 구조였다. 모든 메시지를 하나의 메서드에서 처리하면 토픽 파싱, JSON 파싱, 비즈니스 로직이 뒤섞이고, 메시지 타입이 늘어날수록 장애 범위와 변경 비용이 커질 수 있었다.

### 해결방법과 그렇게 생각한 이유

MQTT 수신부를 `MqttSubscriber -> MqttEnvelope -> MqttDispatchHandler -> MqttMessageHandler` 구조로 분리했다.

- `MqttEnvelope`에서 `devices/{serial}/{telemetry|control}/{channel}` 형태의 토픽을 표준화해 serial, direction, channel, payloadJson으로 변환했다.
- `MqttDispatchHandler`는 channel 이름으로 handler를 찾아 위임하도록 했다.
- `SensorTelemetryHandler`, `ImageInferenceTelemetryHandler`, `ActionResultHandler`, `AckInboundHandler`를 각각 독립 컴포넌트로 두었다.

이렇게 설계한 이유는 MQTT 메시지 종류가 늘어나는 상황에서 if/switch가 커지는 구조보다, 채널별 handler를 추가하는 방식이 더 안전하고 확장성이 높기 때문이다. 또한 센서 처리 오류가 이미지 처리나 ACK 처리 로직에 영향을 주지 않도록 관심사를 나누는 것이 운영 중 장애 분석에도 유리하다고 판단했다.

### 성과

- 4개 MQTT 채널 처리 로직을 독립 handler로 분리했다.
- MQTT QoS 1, 자동 재연결 설정을 적용해 메시지 전달 안정성을 높였다.
- 신규 telemetry channel 추가 시 dispatcher 구조를 유지한 채 handler bean 추가만으로 확장 가능하게 만들었다.
- 토픽 파싱과 payload 파싱을 공통 envelope 단계로 모아, 각 비즈니스 handler가 도메인 로직에 집중할 수 있게 했다.

---

## 2. Redis 기반 멱등성 처리로 중복 MQTT 메시지 방어

### 상황

MQTT QoS 1은 메시지 전달 보장을 높이는 대신, 네트워크 재전송이나 클라이언트 재시도 상황에서 동일 메시지가 중복 수신될 수 있다. 센서 이상 이벤트, 이미지 분석 결과, 기기 액션 결과가 중복 처리되면 같은 알림이 여러 번 생성되거나 식물 상태가 불필요하게 반복 갱신될 수 있었다.

### 해결방법과 그렇게 생각한 이유

`RedisIdempotencyService`를 만들어 `serial:msgId`를 멱등 키로 사용했다.

- Redis `SET NX` 방식인 `setIfAbsent`를 사용해 최초 처리 여부를 원자적으로 판단했다.
- TTL은 10분으로 설정했다.
- 센서 telemetry, 이미지 inference, action-result 처리 전에 공통적으로 멱등성 검사를 수행했다.

DB unique constraint만으로 막는 방식도 가능하지만, MQTT 메시지 처리의 첫 관문에서 빠르게 중복을 걸러내는 것이 DB 부하와 트랜잭션 비용을 줄이는 데 유리하다고 판단했다. 또한 Redis TTL을 두면 영구 저장소를 오염시키지 않고 일정 시간 내 재전송만 방어할 수 있다.

### 성과

- 센서, 이미지, 액션 결과 등 3개 주요 MQTT 처리 경로에 중복 처리 방어를 적용했다.
- 중복 메시지는 DB 트랜잭션 진입 전에 차단되도록 했다.
- 멱등 키 TTL 10분을 적용해 재전송 방어와 저장공간 관리를 동시에 고려했다.

---

## 3. MQTT 제어 명령의 ACK 대기 구조 구현

### 상황

서버가 기기에 claim, binding, mode 변경 같은 제어 명령을 보낼 때 단순히 MQTT publish만 성공해도 HTTP API가 성공으로 응답하면 문제가 있었다. 실제 기기가 명령을 처리하지 못했는데 DB 상태만 변경되면 서버와 디바이스 상태가 불일치할 수 있기 때문이다.

### 해결방법과 그렇게 생각한 이유

`DeviceControlService`에서 MQTT publish 이후 ACK를 기다리는 구조를 만들었다.

- 제어 메시지마다 UUID 기반 `msg_id`를 생성했다.
- `PendingAckStore`에 `serial + msgId` 기준으로 `CompletableFuture`를 등록했다.
- `AckInboundHandler`가 `ref_msg_id`를 기준으로 pending future를 완료시킨다.
- ACK timeout은 15초로 설정했다.
- ACK가 OK가 아니면 `DEVICE_ACK_FAILED`, 시간 초과면 `DEVICE_ACK_TIMEOUT`으로 변환했다.
- pending ACK는 1초마다 sweeper가 만료 정리한다.

이 방식은 비동기 MQTT 통신을 HTTP API 관점의 성공/실패 계약으로 끌어올리는 설계다. 사용자는 기기가 실제로 명령을 받았는지 알 수 있고, 서버는 ACK 성공 이후에만 DB 상태를 바꿀 수 있다.

### 성과

- claim, mode update, binding bound/unbound 등 핵심 기기 제어 4개 흐름에 ACK 기반 성공 판정을 적용했다.
- ACK timeout 15초와 1초 주기 pending cleanup으로 무한 대기/메모리 누수를 방지했다.
- 디바이스 응답 실패는 502, timeout은 504 성격의 비즈니스 에러로 구분 가능하게 했다.

---

## 4. 센서 이벤트 open/resolve 모델과 알림 트랜잭션 설계

### 상황

센서가 이상 상태를 주기적으로 보내는 경우, 매번 새로운 이벤트와 알림을 만들면 사용자에게 같은 이상 알림이 반복되고 히스토리 데이터도 부정확해진다. 반대로 회복 신호가 왔을 때 기존 이상 이벤트를 종료하지 못하면 식물 상태가 계속 문제 상태로 남을 수 있었다.

### 해결방법과 그렇게 생각한 이유

센서 이벤트를 단순 로그가 아니라 상태 전이를 갖는 이벤트로 모델링했다.

- 모든 센서 데이터는 `SensorLog`에 저장한다.
- `ANOMALY_DETECTED`가 들어오면 같은 식물/센서 타입의 open event를 찾는다.
- open event가 없을 때만 `SensorEvent.open()`으로 새 이벤트를 만든다.
- 이미 open 상태라면 `lastLog`만 갱신하고 새 알림은 만들지 않는다.
- `RECOVERY_DONE`이 들어오면 open event를 찾아 resolve 처리한다.
- 알림 저장과 식물 상태 갱신은 같은 트랜잭션에서 처리하고, FCM 발송은 `afterCommit`에서 실행한다.

이렇게 한 이유는 로그와 이벤트의 목적이 다르기 때문이다. 로그는 모든 측정값을 남겨야 하지만, 이벤트는 사용자에게 의미 있는 상태 변화만 표현해야 한다. 또한 push 발송은 외부 시스템 호출이므로 DB commit이 성공한 뒤 실행해야 데이터와 알림의 불일치를 줄일 수 있다고 판단했다.

### 성과

- 주기 센서 로그와 이상 이벤트를 분리해 데이터 의미를 명확히 했다.
- 같은 이상 상태가 반복될 때 중복 이벤트/중복 알림 생성을 방지했다.
- 이벤트 시작/종료 시각을 남길 수 있는 구조를 만들었다.
- 센서 이상/회복 알림 모두 DB commit 이후 FCM을 발송하도록 해 트랜잭션 정합성을 강화했다.

---

## 5. S3 Presigned URL 기반 이미지 업로드 파이프라인

### 상황

재배 기기가 식물 사진을 서버로 직접 업로드하면 서버가 이미지 바이너리를 중계해야 하므로 네트워크/메모리 부담이 커진다. 또한 기기별, 식물별, 촬영 시점별로 이미지를 체계적으로 저장해야 이후 성장 히스토리 조회가 가능했다.

### 해결방법과 그렇게 생각한 이유

서버가 S3 Presigned PUT URL을 생성해 MQTT로 기기에 전달하는 구조를 만들었다.

- 하루 2회, 오전 6시와 오후 6시에 업로드 URL 발행 스케줄을 실행한다.
- 연결된 모든 식물 바인딩을 조회한 뒤 식물별로 업로드 URL 발행 작업을 비동기로 분산한다.
- 식물당 TOP/SIDE 2개 이미지 URL을 생성한다.
- S3 object key는 `plants/{plantId}/images/yyyy/MM/dd/{slot}/{view}.jpg` 형태로 구성했다.
- Presigned URL 만료 시간은 기본 900초(15분)로 설정했다.
- Content-Type은 `image/jpeg`로 고정해 업로드 계약을 명확히 했다.

서버가 파일 업로드를 직접 받는 구조보다 presigned URL 방식이 서버 부하를 줄이고, AWS S3의 업로드 경로와 권한을 짧은 시간 동안만 위임할 수 있어 더 안전하다고 판단했다.

### 성과

- 하루 2회 정기 이미지 수집 파이프라인을 구성했다.
- 식물당 1회 스케줄에 TOP/SIDE 2개 업로드 URL을 발급하도록 했다.
- Presigned URL TTL 15분으로 업로드 권한 노출 시간을 제한했다.
- 업로드 URL 생성 executor를 core 10, max 30, queue 100으로 구성해 다수 식물 발행 작업을 병렬 처리할 수 있게 했다.
- 서버가 이미지 바이너리를 직접 중계하지 않는 구조로 API 서버의 네트워크/메모리 부담을 줄였다.

---

## 6. 이미지 AI 추론 결과 저장 및 성장 그래프 집계

### 상황

기기에서 이미지 분석 결과가 들어오면 단순히 최신값만 저장하는 것으로는 부족했다. 사용자는 최근 성장 추이를 봐야 하고, 이미지 이상 징후가 있으면 알림도 받아야 했다. 또한 AI가 px 단위로 보낸 높이/너비를 실제 cm 단위로 보정해야 했다.

### 해결방법과 그렇게 생각한 이유

`ImageInferenceService`에서 이미지와 추론 결과를 분리 저장하고, 성장 그래프용 집계를 제공했다.

- active binding이 맞는지 확인해 다른 기기가 임의 plantId로 데이터를 넣지 못하게 했다.
- 이미지 URL은 `PlantImage`, 추론 결과는 `ImageInference`에 분리 저장했다.
- 높이는 `15.0 / 865.0`, 너비는 `10.0 / 344.0` 보정 계수로 cm 단위 변환 후 소수점 1자리로 반올림했다.
- confidence가 없거나 anomaly/height/width 중 최소 1개도 없으면 저장하지 않도록 validation을 두었다.
- 최근 14일 성장 그래프는 날짜별 마지막 inference 값을 native query로 조회했다.
- confidence 70 이상, anomaly 5 이상이면 이미지 이상 알림을 생성하고 commit 이후 FCM을 발송한다.

이렇게 설계한 이유는 원천 이미지와 분석 결과의 생명주기가 다르기 때문이다. 이미지 테이블과 추론 테이블을 분리하면 추후 AI 모델이 바뀌거나 같은 이미지에 대해 재추론이 필요해도 확장하기 쉽다.

### 성과

- 이미지 저장, AI 추론 저장, 식물 상태 갱신, 이상 알림을 하나의 처리 흐름으로 연결했다.
- 최근 14일 성장 그래프 데이터를 API로 제공할 수 있게 했다.
- px 기반 AI 결과를 cm 단위 도메인 값으로 보정해 사용자에게 이해 가능한 데이터로 변환했다.
- 이미지 이상 감지 기준을 confidence 70 이상, anomaly 5 이상으로 명시해 알림 조건을 코드화했다.

---

## 7. SSE + Redis Pub/Sub 기반 실시간 홈 화면 업데이트

### 상황

센서 데이터나 이미지 분석 결과로 식물 상태가 바뀌면 홈 화면도 즉시 갱신되어야 했다. 클라이언트가 주기적으로 polling하면 불필요한 API 요청이 늘고, 서버가 여러 인스턴스로 확장될 경우 특정 인스턴스에서 발생한 상태 변경을 다른 인스턴스의 SSE 연결 사용자에게 전달하기 어렵다.

### 해결방법과 그렇게 생각한 이유

`PlantStatusUpdatedEvent`를 발행하고, SSE 서비스가 transaction commit 이후 Redis Pub/Sub으로 plantId를 publish하도록 했다.

- SSE 연결은 userId 기준으로 `ConcurrentHashMap<Long, SseEmitter>`에 관리한다.
- 기존 연결이 있으면 새 연결 시 이전 emitter를 complete 처리한다.
- SSE timeout은 1시간으로 설정했다.
- 상태 변경 이벤트는 `@TransactionalEventListener(phase = AFTER_COMMIT)`에서 처리한다.
- Redis channel `plant-status-update`로 plantId를 publish한다.
- Redis message를 받은 서버는 해당 plantId의 main plant status를 조회해 연결된 user에게 `update` event를 전송한다.

이 구조를 택한 이유는 DB commit 전 데이터를 push하면 사용자 화면이 실제 저장 상태와 달라질 수 있기 때문이다. 또한 Redis Pub/Sub을 사이에 두면 상태 변경이 발생한 서버와 SSE 연결을 들고 있는 서버가 달라도 메시지를 전달할 수 있다.

### 성과

- 홈 화면 실시간 업데이트를 polling 없이 SSE로 제공했다.
- SSE 연결 timeout을 1시간으로 설정해 장시간 홈 화면 구독을 지원했다.
- Redis Pub/Sub을 적용해 다중 서버 확장 시에도 상태 변경 전파가 가능한 구조를 만들었다.
- 상태 변경 push를 commit 이후로 제한해 화면 데이터와 DB 상태의 정합성을 높였다.

---

## 8. JWT + Refresh Token Rotation 기반 인증 설계

### 상황

모바일 앱에서는 access token만 길게 유지하면 탈취 위험이 커지고, refresh token을 계속 재사용하면 유출된 refresh token으로 장기간 재발급이 가능하다. 또한 탈퇴 사용자가 남아 있는 token으로 API를 호출하는 것도 막아야 했다.

### 해결방법과 그렇게 생각한 이유

JWT access token과 DB 저장 refresh token을 분리하고, refresh 시 기존 refresh token을 revoke하는 rotation 구조를 적용했다.

- access token 만료 시간은 900초(15분)로 설정했다.
- refresh token 만료 시간은 1,209,600초(14일)로 설정했다.
- refresh 요청 시 JWT 서명/issuer/type을 검증하고 DB 저장 여부와 revoked 여부를 확인한다.
- refresh 성공 시 기존 token을 revoke하고 새 access/refresh token을 발급한다.
- logout 시 사용자 refresh token을 삭제한다.
- withdraw 시 사용자 soft delete와 refresh token revoke를 함께 수행한다.
- JWT filter에서 탈퇴 사용자 여부를 다시 확인한다.

이렇게 설계한 이유는 stateless access token의 성능 장점은 유지하되, 장기 세션 역할을 하는 refresh token은 서버에서 통제할 수 있어야 하기 때문이다. 특히 rotation은 refresh token 재사용 공격의 피해 범위를 줄이는 데 도움이 된다.

### 성과

- access token 15분, refresh token 14일 정책을 분리했다.
- refresh token 재사용을 막기 위해 refresh 시 기존 token을 revoke했다.
- logout/withdraw 시 서버 저장 refresh token을 제거 또는 revoke해 세션 통제력을 확보했다.
- 11개 controller, 39개 mapping에 대해 공통 JWT filter 기반 인증 구조를 적용했다.

---

## 9. FCM 토큰 관리와 유효하지 않은 토큰 자동 정리

### 상황

모바일 push token은 앱 재설치, 로그아웃, 기기 변경 등으로 자주 바뀐다. 유효하지 않은 token을 계속 보관하면 알림 발송 실패가 반복되고, FCM 호출 비용과 로그 노이즈가 늘어난다.

### 해결방법과 그렇게 생각한 이유

`PushService`에서 모바일 deviceId 기준으로 FCM token을 upsert하고, 발송 실패 시 invalid token을 삭제하도록 했다.

- token 등록 시 같은 mobileDeviceId가 있으면 token을 update한다.
- 신규 deviceId면 push token row를 생성한다.
- 로그인 시 mobileDeviceId가 있으면 push token과 userId를 매핑한다.
- 로그아웃 시 mobileDeviceId 기준으로 userId를 null 처리한다.
- FCM 발송 중 `MessagingErrorCode.UNREGISTERED`가 발생하면 해당 token을 삭제한다.

deviceId 기준으로 token을 갱신하면 동일 기기에서 token이 바뀌어도 row가 무한히 늘어나지 않는다. 또한 FCM이 명확히 invalid라고 알려준 token은 즉시 제거하는 것이 이후 발송 성공률과 운영 로그 품질에 유리하다.

### 성과

- deviceId 기준 FCM token upsert 구조를 구현했다.
- 사용자 로그인/로그아웃과 push token user 매핑을 연동했다.
- FCM invalid token을 자동 삭제해 반복 실패를 줄이는 구조를 만들었다.
- 알림 저장과 push 발송을 분리해, 알림 이력은 DB에 남기고 push는 외부 시스템 실패에 대응할 수 있게 했다.

---

## 10. 식물-디바이스 바인딩 정합성 확보

### 상황

스마트 화분 서비스에서는 식물, 사용자, 디바이스의 연결 상태가 핵심이다. 디바이스가 다른 사용자의 소유인데 바인딩되거나, 이미 다른 식물에 연결된 디바이스가 중복 연결되면 이후 센서 데이터와 제어 명령이 잘못된 식물로 흘러갈 수 있다.

### 해결방법과 그렇게 생각한 이유

`PlantBindingService`, `DeviceClaimService`, `DeviceBindingValidator`로 바인딩 검증과 상태 변경을 분리했다.

- bind 전 디바이스 소유자와 중복 pairing 여부를 검증한다.
- binding/unbinding 시 MQTT 명령을 보내고 ACK 성공 후 DB 상태를 변경한다.
- bind 성공 시 기존 main plant를 해제하고 새로 연결한 plant를 main으로 설정한다.
- MQTT 센서 수신 시 serial과 plantId를 검증해 비정상 메시지를 차단한다.
- claim/unclaim, bind/unbind는 별도 transaction(`REQUIRES_NEW`)으로 처리해 중간 상태를 명확히 했다.

이렇게 한 이유는 IoT 시스템에서 서버 DB 상태와 물리 디바이스 상태가 어긋나는 순간 장애가 복잡해지기 때문이다. 따라서 “검증 -> 디바이스 ACK -> DB 변경” 순서를 유지하는 것이 더 안전하다고 판단했다.

### 성과

- 디바이스 소유권, 중복 연결, active binding 검증을 서버 단에서 수행했다.
- claim/bind/unbind/mode 변경 모두 MQTT ACK 기반으로 서버 상태 변경을 통제했다.
- 식물 목록 조회 시 species/device fetch join을 사용해 N+1 가능성을 줄였다.
- 센서 데이터 수신 시 plantId와 device serial 기반 검증을 추가해 잘못된 데이터 유입을 방어했다.

---

## 11. 홈/히스토리 조회 API의 읽기 모델 최적화

### 상황

홈 화면과 히스토리 화면은 사용자가 자주 접근하는 읽기 중심 API다. Entity 관계를 단순 lazy loading에 맡기면 N+1 문제가 발생하거나, 화면에 필요한 데이터를 만들기 위해 여러 번 쿼리해야 할 수 있었다.

### 해결방법과 그렇게 생각한 이유

조회 목적에 맞는 repository query를 별도로 작성했다.

- 홈 조회는 main plant status, userPlant, characterCode를 fetch join으로 한 번에 가져온다.
- 식물 목록은 species와 device를 fetch join으로 조회한다.
- 최근 14일 이미지는 KST 기준 `[from, to)` 범위를 명확히 계산해 조회한다.
- 성장 그래프는 날짜별 마지막 inference를 native query로 집계한다.
- 센서 알림 그래프는 최근 14일을 고정 길이 배열로 만들어 데이터가 없는 날짜도 0으로 반환한다.

읽기 API는 화면 요구사항에 맞게 쿼리를 설계하는 것이 중요하다고 판단했다. 특히 그래프 API는 누락된 날짜를 클라이언트가 추론하게 두기보다 서버에서 14일치 포인트를 항상 맞춰주는 편이 프론트엔드 구현과 사용자 경험에 유리하다.

### 성과

- 최근 14일 성장 그래프, 최근 14일 센서 알림 그래프, 최근 14일 이미지 조회를 제공했다.
- 홈 화면 조회에서 fetch join으로 main plant status와 캐릭터 이미지를 함께 조회했다.
- 그래프 응답을 고정 14개 포인트 기준으로 구성해 클라이언트 렌더링 복잡도를 낮췄다.
- KST 기준 날짜 범위를 명시해 사용자 지역 기준의 일별 히스토리를 안정적으로 제공했다.

---

## 12. 운영 관측성과 배포 환경 분리

### 상황

서버가 IoT 메시지, DB 트랜잭션, 외부 서비스(S3/FCM/MQTT)를 함께 다루기 때문에 장애 발생 시 원인 파악이 어려울 수 있었다. 개발 환경과 운영 환경의 로그/SQL 설정도 다르게 가져갈 필요가 있었다.

### 해결방법과 그렇게 생각한 이유

Spring profile과 Actuator/Prometheus 설정을 적용했다.

- `application-dev.properties`와 `application-prod.properties`로 환경별 설정을 분리했다.
- 운영 profile에서는 SQL 출력과 상세 web/security log를 줄였다.
- Actuator endpoint로 `health`, `info`, `prometheus`, `metrics`를 노출했다.
- Micrometer Prometheus registry를 추가했다.
- HTTP server request percentile histogram을 활성화했다.

IoT 서버는 단순 API 서버보다 비동기 이벤트가 많기 때문에, 로그만으로는 지연이나 장애 징후를 파악하기 어렵다. 그래서 Prometheus scrape가 가능한 metric endpoint를 열어 추후 대시보드/알림으로 연결할 수 있게 했다.

### 성과

- 운영/개발 profile을 분리해 환경별 로그 정책을 다르게 가져갈 수 있게 했다.
- Prometheus metric endpoint를 제공해 모니터링 연동 기반을 마련했다.
- HTTP 요청 latency histogram을 활성화해 p95/p99 같은 지표 분석이 가능한 구조를 만들었다.
- Actuator health endpoint로 배포 후 상태 확인 자동화 기반을 확보했다.

---

## 지원서/면접에서 강조하기 좋은 한 줄 요약

- MQTT QoS 1 환경에서 Redis 멱등성 키와 ACK 대기 구조를 적용해 IoT 메시지 중복 처리와 서버-디바이스 상태 불일치 문제를 줄였다.
- 센서 로그와 이상 이벤트를 분리하고 open/resolve 모델로 설계해 반복 알림을 방지하면서 히스토리 추적성을 확보했다.
- S3 Presigned URL을 MQTT로 배포하는 방식으로 이미지 업로드를 서버 중계 없이 처리하고, 하루 2회 TOP/SIDE 이미지 수집 파이프라인을 구성했다.
- DB commit 이후 SSE/FCM을 발송하도록 설계해 사용자 알림과 저장 데이터의 정합성을 높였다.
- Redis Pub/Sub과 SSE를 결합해 실시간 홈 화면 갱신을 구현하고, 다중 서버 확장 가능성을 고려했다.
- Refresh Token Rotation과 탈퇴 사용자 차단으로 모바일 앱 인증 세션의 보안성을 강화했다.

