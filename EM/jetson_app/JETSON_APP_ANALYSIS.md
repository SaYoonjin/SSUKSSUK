# Jetson App Analysis Document

## 1. Project Overview

### 1.1 Purpose
스마트 수경재배 시스템의 **Edge Gateway** 역할을 하는 Python 애플리케이션.
Jetson 보드에서 실행되며, STM32 MCU와 클라우드 서버 사이의 중간 계층을 담당한다.

### 1.2 Key Responsibilities
- **UART 통신**: STM32와 시리얼 통신 (센서 데이터 수신, 제어 명령 전송)
- **MQTT 통신**: 클라우드 서버와 WebSocket/TLS 기반 MQTT 통신
- **상태 관리**: 기기 등록(Claim), 식물 바인딩(Binding), 모드(Auto/Manual) 관리
- **LED 스케줄링**: 시간대별 자동 LED 제어
- **텔레메트리**: 센서 데이터 및 이벤트 업링크

---

## 2. Folder Structure

```
jetson_app/
├── main.py                    # 메인 진입점
├── config.json                # 하드웨어/네트워크 설정 (불변)
├── setting.json               # 런타임 상태 (가변)
├── config_loader.py           # JSON 로드/저장 유틸
├── led_scheduler.py           # LED 시간대 제어
│
├── uart/                      # UART 통신 모듈
│   ├── packet.py              # 프로토콜 상수 정의
│   ├── codec.py               # 패킷 빌드/파싱
│   ├── parser.py              # 바이트 스트림 파서
│   └── uart_manager.py        # UART 관리자
│
├── mqtt/                      # MQTT 핸들러
│   ├── envelope.py            # 공통 메시지 포맷
│   ├── ack_builder.py         # ACK 메시지 빌더
│   ├── claim_handler.py       # CLAIM_UPDATE 처리
│   ├── binding_handler.py     # BINDING_UPDATE 처리
│   └── mode_handler.py        # MODE_UPDATE 처리
│
├── telemetry/                 # 텔레메트리
│   └── sensor_uplink.py       # 센서 업링크 빌더
│
├── tools/                     # 테스트 도구
│   ├── data_req_test.py
│   ├── led_test.py
│   ├── nutrip_test.py
│   └── waterp_test.py
│
└── venv/                      # Python 가상환경
```

---

## 3. Configuration Files

### 3.1 config.json (불변 설정)

```json
{
  "device": {
    "serial_num": "1420524217380"     // 기기 시리얼 번호
  },

  "mqtt": {
    "broker": {
      "host": "i14a103.p.ssafy.io",   // MQTT 브로커 주소
      "port": 443,                     // WebSocket TLS 포트
      "keepalive_sec": 60
    },
    "transport": "websockets",
    "ws_path": "/mqtt",
    "tls": { "enabled": true }
  },

  "uart": {
    "port": "/dev/ttyTHS1",           // Jetson UART 포트
    "baudrate": 115200
  }
}
```

### 3.2 setting.json (런타임 상태)

```json
{
  "claim": {
    "claim_state": "UNCLAIMED | CLAIMED",
    "user_id": null | "user-uuid"
  },

  "binding": {
    "binding_state": "UNBOUND | BOUND",
    "plant_id": null | "plant-uuid",
    "species": null | "토마토",
    "led_time": {
      "start": null | 9,              // LED ON 시작 시간 (hour)
      "end": null | 21                // LED OFF 시간 (hour)
    },
    "ideal_ranges": {
      "water_level": { "min": 30, "max": 100 },
      "nutrient_conc": { "min": 800, "max": 1200 },
      "temperature": { "min": 18, "max": 28 },
      "humidity": { "min": 50, "max": 80 }
    }
  },

  "mode": "AUTO | MANUAL",

  "anomaly_state": {
    "open": {
      "WATER_LEVEL": false,
      "NUTRIENT_CONC": false,
      "TEMPERATURE": false,
      "HUMIDITY": false
    }
  }
}
```

---

## 4. UART Communication

### 4.1 Protocol (STM32 ↔ Jetson)

```
[STX][TYPE][SUBTYPE][LEN][PAYLOAD...][CHK][ETX]
 0xAA  1B     1B      1B    0~32B     1B  0x55
```

**Checksum:** `TYPE ^ SUBTYPE ^ LEN ^ PAYLOAD[0] ^ ... ^ PAYLOAD[n]`

### 4.2 Command Definitions (packet.py)

| Type | Subtype | Name | Direction |
|------|---------|------|-----------|
| 0x01 | 0x01 | CMD_READY | Jetson→STM |
| 0x01 | 0x02 | CMD_REQ_SENSOR | Jetson→STM |
| 0x01 | 0x03 | CMD_LED_ON | Jetson→STM |
| 0x01 | 0x04 | CMD_LED_OFF | Jetson→STM |
| 0x01 | 0x07 | CMD_PUMP_WATER | Jetson→STM |
| 0x01 | 0x08 | CMD_PUMP_NUTRI | Jetson→STM |
| 0x01 | 0x09 | CMD_PUMP_WATER_STOP | Jetson→STM |
| 0x01 | 0x0A | CMD_PUMP_NUTRI_STOP | Jetson→STM |
| 0x01 | 0x0B | CMD_SET_TH | Jetson→STM |
| 0x01 | 0x0C | CMD_PING | Jetson→STM |
| 0x01 | 0x0D | CMD_PONG | STM→Jetson |
| 0x02 | 0x01 | DATA_SENSOR | STM→Jetson |
| 0x03 | 0x01 | EVENT_WATER_LOW | STM→Jetson |
| 0x03 | 0x02 | EVENT_EC_LOW | STM→Jetson |
| 0x03 | 0x03 | EVENT_RECOVERY_DONE | STM→Jetson |

### 4.3 UARTManager API

```python
class UARTManager:
    def __init__(self, port="/dev/ttyTHS1", baudrate=115200)

    def send_cmd(self, cmd_subtype, payload=b"")
        # CMD 패킷 전송

    def poll(self) -> list[dict]
        # 수신 패킷 목록 반환
        # [{"type": 0x02, "subtype": 0x01, "payload": bytes}, ...]
```

### 4.4 Threshold Payload (CMD_SET_TH)

```python
payload = struct.pack(
    "<ffff",
    water_min,      # float (4 bytes)
    water_max,      # float (4 bytes)
    nutrient_min,   # float (4 bytes)
    nutrient_max    # float (4 bytes)
)  # Total: 16 bytes, Little-Endian
```

---

## 5. MQTT Communication

### 5.1 Topics

| Direction | Topic Pattern | Description |
|-----------|---------------|-------------|
| Subscribe | `devices/{serial}/control/claim` | Claim 상태 변경 |
| Subscribe | `devices/{serial}/control/binding` | Binding 상태 변경 |
| Subscribe | `devices/{serial}/control/mode` | Mode 변경 |
| Subscribe | `devices/{serial}/control/upload-url` | 이미지 업로드 URL |
| Publish | `devices/{serial}/telemetry/sensors` | 센서 데이터 업링크 |
| Publish | `devices/{serial}/telemetry/ack` | ACK 응답 |

### 5.2 Message Types

#### CLAIM_UPDATE (서버 → 기기)
```json
{
  "msg_id": "uuid",
  "type": "CLAIM_UPDATE",
  "serial_num": "1420524217380",
  "claim_state": "CLAIMED",
  "user_id": "user-uuid",
  "mode": "AUTO"
}
```

#### BINDING_UPDATE (서버 → 기기)
```json
{
  "msg_id": "uuid",
  "type": "BINDING_UPDATE",
  "serial_num": "1420524217380",
  "plant_id": "plant-uuid",
  "binding_state": "BOUND",
  "species": "토마토",
  "led_time": { "start": 9, "end": 21 },
  "ideal_ranges": {
    "water_level": { "min": 30, "max": 100 },
    "nutrient_conc": { "min": 800, "max": 1200 }
  }
}
```

#### MODE_UPDATE (서버 → 기기)
```json
{
  "msg_id": "uuid",
  "type": "MODE_UPDATE",
  "serial_num": "1420524217380",
  "mode": "MANUAL"
}
```

#### SENSOR_UPLINK (기기 → 서버)
```json
{
  "msg_id": "uuid",
  "sent_at": "2026-01-30T10:30:00+09:00",
  "serial_num": "1420524217380",
  "plant_id": "plant-uuid",
  "type": "SENSOR_UPLINK",
  "event_kind": "PERIODIC | ANOMALY_DETECTED | RECOVERY_DONE",
  "trigger_sensor_type": null | "WATER_LEVEL" | "NUTRIENT_CONC",
  "values": {
    "temperature": 25.3,
    "humidity": 65.0,
    "water_level": 45.0,
    "nutrient_conc": 950.0
  },
  "status": {
    "temperature": "OK",
    "humidity": "OK",
    "water_level": "OK",
    "nutrient_conc": "BAD"
  }
}
```

#### ACK (기기 → 서버)
```json
{
  "msg_id": "ack-uuid",
  "sent_at": "2026-01-30T10:30:00+09:00",
  "serial_num": "1420524217380",
  "type": "ACK",
  "ref_msg_id": "original-msg-uuid",
  "ref_type": "CLAIM_UPDATE",
  "status": "OK | ERROR",
  "error_code": null | "INTERNAL_ERROR"
}
```

---

## 6. State Machine

### 6.1 Claim States

```
┌───────────────┐   CLAIM_UPDATE    ┌───────────────┐
│   UNCLAIMED   │ ───────────────→  │    CLAIMED    │
│               │                   │               │
│ - 서버 대기    │ ←─────────────── │ - 운영 토픽 구독 │
│ - claim만 구독 │   CLAIM_UPDATE   │ - 바인딩 가능   │
└───────────────┘   (unclaim)       └───────────────┘
```

### 6.2 Binding States

```
┌───────────────┐   BINDING_UPDATE   ┌───────────────┐
│    UNBOUND    │ ───────────────→   │     BOUND     │
│               │                    │               │
│ - LED OFF     │ ←────────────────  │ - LED 스케줄 적용│
│ - 펌프 정지    │   BINDING_UPDATE  │ - 센서 업링크   │
│ - 센서 무시    │   (unbind)        │ - 임계값 적용   │
└───────────────┘                    └───────────────┘
```

### 6.3 Full State Diagram

```
UNCLAIMED ──claim──→ CLAIMED
    │                    │
    │                    ├──bind──→ BOUND (운영 중)
    │                    │              │
    │                    ├←─unbind─────┘
    │                    │
    └←──────unclaim──────┘
```

---

## 7. Main Loop Flow

```python
main()
├── 1. Load config.json, setting.json
├── 2. Initialize UART, send CMD_READY
├── 3. Initialize LEDScheduler
├── 4. Connect MQTT (WebSocket TLS)
│
└── while True:  (200ms interval)
    │
    ├── [BOUND 상태] LED 스케줄 체크 (분 단위)
    │   └── led_scheduler.apply(setting, now)
    │
    ├── [부팅/바인딩 직후] 초기 센서 1회 요청
    │   └── uart.send_cmd(CMD_REQ_SENSOR)
    │
    ├── UART 수신 처리
    │   ├── DATA_SENSOR (0x02, 0x01)
    │   │   └── SENSOR_UPLINK 발행 (PERIODIC)
    │   │
    │   └── TYPE_EVENT (0x03, *)
    │       ├── EVENT_WATER_LOW → ANOMALY_DETECTED
    │       ├── EVENT_EC_LOW → ANOMALY_DETECTED
    │       └── EVENT_RECOVERY_DONE → RECOVERY_DONE
    │
    └── 정기 센서 요청 (매시 정각)
        └── uart.send_cmd(CMD_REQ_SENSOR)
```

---

## 8. LED Scheduler

### 8.1 Logic

```python
class LEDScheduler:
    def apply(self, setting, now):
        # BOUND 상태가 아니면 LED OFF
        if binding_state != "BOUND":
            return self._off()

        # 시간대 확인
        start = led_time["start"]  # e.g., 9
        end = led_time["end"]      # e.g., 21

        if _in_window(now.hour, start, end):
            self._on()
        else:
            self._off()
```

### 8.2 Time Window Logic

```python
def _in_window(hour, start, end):
    if start < end:
        # 같은 날: 9~21 → 9 <= hour < 21
        return start <= hour < end
    else:
        # 자정 걸침: 21~9 → hour >= 21 OR hour < 9
        return hour >= start or hour < end
```

---

## 9. MQTT Handlers

### 9.1 claim_handler.py

| 상태 | 동작 |
|------|------|
| CLAIMED | user_id 저장, mode 설정 |
| UNCLAIMED | 전체 초기화 (binding, ideal_ranges 리셋) |

**UNCLAIMED 시 추가 동작 (main.py):**
- `CMD_LED_OFF` 전송
- `CMD_PUMP_WATER_STOP` 전송
- `CMD_PUMP_NUTRI_STOP` 전송

### 9.2 binding_handler.py

| 상태 | 동작 |
|------|------|
| BOUND | species, led_time, ideal_ranges 저장 → `CMD_SET_TH` 전송 |
| UNBOUND | binding 정보 초기화 |

**BOUND 시 STM32 전송:**
```python
payload_th = struct.pack("<ffff",
    water_min, water_max,
    nutrient_min, nutrient_max
)
uart.send_cmd(CMD_SET_TH, payload_th)
```

### 9.3 mode_handler.py

| Mode | Description |
|------|-------------|
| AUTO | 자동 제어 (임계값 기반 이벤트) |
| MANUAL | 수동 제어 (서버 명령만) |

---

## 10. Telemetry

### 10.1 Sensor Uplink Trigger

| Event Kind | Trigger | Source |
|------------|---------|--------|
| PERIODIC | 매시 정각 | main.py 스케줄러 |
| ANOMALY_DETECTED | 임계값 이탈 | STM32 EVENT_WATER_LOW/EC_LOW |
| RECOVERY_DONE | 정상 복귀 | STM32 EVENT_RECOVERY_DONE |

### 10.2 Status Calculation

```python
def build_status(values, ideal_ranges):
    for key, value in values.items():
        min_v = ideal_ranges[key]["min"]
        max_v = ideal_ranges[key]["max"]

        if value < min_v or value > max_v:
            status[key] = "BAD"
        else:
            status[key] = "OK"
```

---

## 11. Dependencies

### 11.1 Python Packages

```
paho-mqtt       # MQTT 클라이언트
pyserial        # UART 통신
```

### 11.2 Module Dependencies

```
main.py
├── uart.packet (상수)
├── uart.uart_manager (UARTManager)
├── mqtt.claim_handler
├── mqtt.binding_handler
├── mqtt.mode_handler
├── telemetry.sensor_uplink
├── led_scheduler (LEDScheduler)
└── config_loader (load_json, save_json)

mqtt/claim_handler.py
├── config_loader
└── mqtt.ack_builder

mqtt/binding_handler.py
├── config_loader
├── mqtt.ack_builder
└── uart.packet (CMD_SET_TH)

mqtt/ack_builder.py
└── mqtt.envelope

uart/uart_manager.py
├── uart.parser (UARTParser)
└── uart.codec (build_packet, parse_packet)
```

---

## 12. Error Handling

### 12.1 Config Error

```python
class ConfigError(Exception):
    pass

# 사용처:
# - 파일 없음
# - JSON 파싱 실패
# - 저장 실패
```

### 12.2 MQTT Handler Error

```python
# 내부 오류 발생 시
return build_ack(
    ref_payload=payload,
    status="ERROR",
    error_code="INTERNAL_ERROR"
)
```

### 12.3 UART Error

```python
except serial.SerialException as e:
    print(f"[UART] read error: {e}")
    return []  # 빈 리스트 반환
```

---

## 13. Shutdown Sequence

```python
finally:
    # 1. LED OFF
    led_scheduler.reset()
    uart.send_cmd(CMD_LED_OFF)

    # 2. 펌프 정지
    uart.send_cmd(CMD_PUMP_WATER_STOP)
    uart.send_cmd(CMD_PUMP_NUTRI_STOP)

    # 3. MQTT 종료
    client.loop_stop()
    client.disconnect()
```

---

## 14. Quick Reference

### 14.1 Run Application

```bash
cd /home/orin/jetson_app
source venv/bin/activate
python main.py
```

### 14.2 Test Commands

```bash
# LED 테스트
python tools/led_test.py

# 펌프 테스트
python tools/waterp_test.py
python tools/nutrip_test.py

# 센서 요청 테스트
python tools/data_req_test.py
```

### 14.3 Key Files to Modify

| Purpose | File |
|---------|------|
| 기기 시리얼/MQTT 설정 | config.json |
| 런타임 상태 확인 | setting.json |
| 센서 주기 변경 | config.json → scheduler |
| 새 명령 추가 | uart/packet.py |

---

## 15. Communication Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloud Server                            │
│                                                                 │
│  MQTT Broker (wss://i14a103.p.ssafy.io:443/mqtt)               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │  devices/{serial}/control/*       │ (Subscribe)
          │  devices/{serial}/telemetry/*     │ (Publish)
          └─────────────────┬─────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                       Jetson App (Python)                       │
│                                                                 │
│  - MQTT Client (paho-mqtt, WebSocket TLS)                      │
│  - State Manager (config.json, setting.json)                   │
│  - LED Scheduler                                                │
│  - Sensor Uplink Builder                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │  UART (/dev/ttyTHS1, 115200bps)   │
          │  Protocol: [STX][T][S][L][P][C][ETX]│
          └─────────────────┬─────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     STM32F103RBT6 (MCU)                         │
│                                                                 │
│  - Sensor Reading (AHT20, ADS1115)                             │
│  - Relay Control (LED, Water Pump, Nutrient Pump)              │
│  - Threshold Monitoring & Event Generation                      │
└─────────────────────────────────────────────────────────────────┘
```
