# STM32 System Analysis Document

## 1. Project Overview

### 1.1 Hardware Target
- **MCU**: STM32F103RBT6 (STM32F1 Series)
- **Package**: LQFP64
- **Core**: ARM Cortex-M3
- **Flash**: 128KB
- **RAM**: 20KB
- **Clock**: 8MHz HSI (Internal)

### 1.2 Project Purpose
스마트 수경재배 시스템의 임베디드 컨트롤러로, 센서 데이터 수집 및 액추에이터 제어를 담당한다.

**주요 기능:**
- 온습도 센서 (AHT20) 읽기
- 수위/EC 센서 (ADS1115 ADC) 읽기
- LED 조명 릴레이 제어
- 물 펌프 릴레이 제어
- 영양분 펌프 릴레이 제어
- Jetson (상위 컨트롤러)과 UART 통신

---

## 2. Folder Structure

```
stm_system/
├── Core/
│   ├── Inc/                    # Header files
│   │   ├── ads1115.h          # ADS1115 ADC driver
│   │   ├── aht20.h            # AHT20 sensor driver
│   │   ├── gpio.h             # GPIO configuration
│   │   ├── i2c.h              # I2C peripheral
│   │   ├── main.h             # Main defines & GPIO labels
│   │   ├── protocol.h         # UART protocol definitions
│   │   ├── sensor.h           # Sensor data structures
│   │   ├── stm32f1xx_hal_conf.h
│   │   ├── stm32f1xx_it.h     # Interrupt handlers
│   │   ├── uart_parser.h      # UART packet parser
│   │   └── usart.h            # USART peripheral
│   ├── Src/                    # Source files
│   │   ├── ads1115.c          # ADS1115 driver implementation
│   │   ├── aht20.c            # AHT20 driver implementation
│   │   ├── gpio.c             # GPIO initialization
│   │   ├── i2c.c              # I2C initialization
│   │   ├── main.c             # Main application
│   │   ├── protocol.c         # Protocol send functions
│   │   ├── sensor.c           # Sensor reading & threshold
│   │   ├── stm32f1xx_hal_msp.c
│   │   ├── stm32f1xx_it.c     # Interrupt handlers
│   │   ├── syscalls.c         # System calls
│   │   ├── sysmem.c           # Memory management
│   │   ├── system_stm32f1xx.c # System initialization
│   │   ├── uart_parser.c      # UART packet parser
│   │   └── usart.c            # USART initialization
│   └── Startup/
│       └── startup_stm32f103rbtx.s  # Startup assembly
├── Drivers/                    # STM32 HAL & CMSIS
│   └── ...
├── stm_system.ioc             # STM32CubeMX config
├── STM32F103RBTX_FLASH.ld     # Linker script
└── .cproject, .project        # IDE config
```

---

## 3. Pin Configuration

### 3.1 GPIO Outputs (Relay Control)
| Pin | Label | Function | Initial State | Logic |
|-----|-------|----------|---------------|-------|
| PB0 | LED | LED 조명 릴레이 | HIGH (OFF) | Active LOW |
| PB1 | WATER_PUMP | 물 펌프 릴레이 | HIGH (OFF) | Active LOW |
| PB10 | NUTRI_PUMP | 영양분 펌프 릴레이 | HIGH (OFF) | Active LOW |

**Relay Logic:**
- `GPIO_PIN_SET` (HIGH) → 릴레이 OFF
- `GPIO_PIN_RESET` (LOW) → 릴레이 ON

### 3.2 I2C (Sensor Communication)
| Pin | Function |
|-----|----------|
| PB6 | I2C1_SCL |
| PB7 | I2C1_SDA |

- **Speed**: 100kHz (Standard Mode)
- **Connected Devices**:
  - AHT20 (0x38): 온습도 센서
  - ADS1115 (0x48): 16-bit ADC

### 3.3 USART3 (Jetson Communication)
| Pin | Function |
|-----|----------|
| PC10 | USART3_TX |
| PC11 | USART3_RX |

- **Baud Rate**: 115200
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None
- **Mode**: TX/RX, Interrupt-driven

### 3.4 Debug (SWD)
| Pin | Function |
|-----|----------|
| PA13 | SWDIO |
| PA14 | SWCLK |

---

## 4. Communication Protocol

### 4.1 Frame Format
```
[STX][TYPE][SUBTYPE][LEN][PAYLOAD...][CHK][ETX]
  1B   1B     1B      1B    0~32B     1B   1B
```

| Field | Value | Description |
|-------|-------|-------------|
| STX | 0xAA | Start of frame |
| TYPE | 1B | Message type |
| SUBTYPE | 1B | Message subtype |
| LEN | 1B | Payload length (0~32) |
| PAYLOAD | 0~32B | Data |
| CHK | 1B | XOR checksum |
| ETX | 0x55 | End of frame |

### 4.2 Checksum Calculation
```c
uint8_t checksum = TYPE ^ SUBTYPE ^ LEN;
for (i = 0; i < LEN; i++) {
    checksum ^= PAYLOAD[i];
}
```

### 4.3 Message Types

#### TYPE = 0x01 (CMD) - Commands
| SUBTYPE | Name | Direction | Payload | Description |
|---------|------|-----------|---------|-------------|
| 0x01 | CMD_READY | Jetson→STM | - | STM 초기화 완료, 통신 시작 |
| 0x02 | CMD_REQ_SENSOR | Jetson→STM | - | 센서 데이터 요청 |
| 0x03 | CMD_LED_ON | Jetson→STM | - | LED 켜기 |
| 0x04 | CMD_LED_OFF | Jetson→STM | - | LED 끄기 |
| 0x07 | CMD_PUMP_WATER | Jetson→STM | - | 물 펌프 켜기 |
| 0x08 | CMD_PUMP_NUTRI | Jetson→STM | - | 영양분 펌프 켜기 |
| 0x09 | CMD_PUMP_WATER_STOP | Jetson→STM | - | 물 펌프 끄기 |
| 0x0A | CMD_PUMP_NUTRI_STOP | Jetson→STM | - | 영양분 펌프 끄기 |
| 0x0B | CMD_SET_TH | Jetson→STM | Threshold_t (16B) | 임계값 설정 |
| 0x0C | CMD_PING | Jetson→STM | - | Ping 요청 |
| 0x0D | CMD_PONG | STM→Jetson | - | Pong 응답 |
| 0x0E | CMD_AUTO_RECOVERY | Jetson→STM | - | 자동 복구 모드 |

#### TYPE = 0x02 (DATA) - Data
| SUBTYPE | Name | Direction | Payload | Description |
|---------|------|-----------|---------|-------------|
| 0x01 | DATA_SENSOR | STM→Jetson | 8B | 센서 데이터 |

**DATA_SENSOR Payload (8 bytes, Little-Endian):**
```
[temp_x10][humi_x10][ec][water]
   2B        2B      2B   2B
```
- temp_x10: 온도 × 10 (예: 253 = 25.3°C)
- humi_x10: 습도 × 10 (예: 650 = 65.0%)
- ec: EC 값 (μS/cm)
- water: 수위 (%)

#### TYPE = 0x03 (EVENT) - Events
| SUBTYPE | Name | Direction | Payload | Description |
|---------|------|-----------|---------|-------------|
| 0x01 | EVENT_WATER_LOW | STM→Jetson | 8B (sensor) | 수위 낮음 경고 |
| 0x02 | EVENT_EC_LOW | STM→Jetson | 8B (sensor) | EC 낮음 경고 |
| 0x03 | EVENT_RECOVERY_DONE | STM→Jetson | 8B (sensor) | 정상 복귀 |
| 0x04 | EVENT_SENSOR_FAIL | STM→Jetson | - | 센서 오류 |
| 0x05 | EVENT_PUMP_FAIL | STM→Jetson | - | 펌프 오류 |

---

## 5. Data Structures

### 5.1 Threshold_t (16 bytes)
```c
typedef struct {
    float water_min;   // 수위 최소값 (%)
    float water_max;   // 수위 최대값 (%)
    float ec_min;      // EC 최소값 (μS/cm)
    float ec_max;      // EC 최대값 (μS/cm)
} Threshold_t;
```

**Default Values:**
```c
Threshold_t g_threshold = {
    .water_min = 0.0f,
    .water_max = 100.0f,
    .ec_min    = 0.0f,
    .ec_max    = 2000.0f
};
```

### 5.2 SensorData_t
```c
typedef struct {
    float temperature;  // 온도 (°C)
    float humidity;     // 습도 (%)
    float water_level;  // 수위 (%)
    float ec;           // EC (μS/cm)
} SensorData_t;
```

---

## 6. Sensor Drivers

### 6.1 AHT20 (온습도 센서)

**I2C Address:** 0x38

**API:**
```c
HAL_StatusTypeDef AHT20_Read(float* Temp, float* Humid);
```

**동작 순서:**
1. Status 읽기 (0x71)
2. Calibration 확인 (bit 3)
3. 측정 트리거 (0xAC, 0x33, 0x00)
4. 80ms 대기
5. Busy polling (bit 7, timeout 200ms)
6. 6바이트 데이터 읽기
7. 온도/습도 계산

**계산식:**
```c
humidity = (h20 / 1048576.0f) * 100.0f;
temperature = (t20 / 1048576.0f) * 200.0f - 50.0f;
```

### 6.2 ADS1115 (16-bit ADC)

**I2C Address:** 0x48 (ADDR = GND)

**API:**
```c
HAL_StatusTypeDef ADS1115_ReadSingleEnded(
    I2C_HandleTypeDef *hi2c,
    uint8_t channel,    // 0~3
    int16_t *result
);
```

**설정:**
- PGA: ±4.096V
- Mode: Single-shot
- Data Rate: 128 SPS
- Comparator: Disabled

**채널 매핑:**
| Channel | Sensor | 계산 |
|---------|--------|------|
| 0 | Water Level | (voltage / 3.3) × 100% |
| 1 | EC | voltage × 1000 μS/cm |

**전압 변환:**
```c
float voltage = (raw * 4.096f) / 32768.0f;
```

---

## 7. Main Loop Flow

```
main()
├── HAL_Init()
├── SystemClock_Config()     // 8MHz HSI
├── MX_GPIO_Init()           // GPIO 초기화 (릴레이 OFF)
├── MX_USART3_UART_Init()    // UART 115200
├── MX_I2C1_Init()           // I2C 100kHz
├── HAL_UART_Receive_IT()    // 인터럽트 수신 시작
│
└── while(1)
    ├── sensor_read_all()         // AHT20 + ADS1115 읽기
    ├── sensor_check_threshold()  // 임계값 체크 & 이벤트 발생
    ├── uart_poll() × 10          // UART 폴링 (추가 처리)
    └── HAL_Delay(300)            // 300ms 대기
```

**Loop Period:** ~400ms+ (센서 읽기 시간 포함)

---

## 8. UART Communication Flow

### 8.1 Reception (Interrupt + Polling)

```
HAL_UART_RxCpltCallback()
    └── uart_rx_byte(byte)
        ├── STX 체크 (0xAA)
        ├── 버퍼에 저장
        ├── idx=4 → LEN 추출
        └── idx == LEN+6 → uart_process()
```

### 8.2 Packet Processing

```
uart_process()
├── STX/ETX 검증
├── Checksum 검증
└── handle_packet(type, subtype, payload, len)
    │
    ├── [CMD_READY] → stm_ready = true
    │
    ├── (if !stm_ready) → return
    │
    ├── [CMD_PING] → proto_send_pong()
    ├── [CMD_REQ_SENSOR] → proto_send_sensor_data()
    ├── [CMD_SET_TH] → memcpy(&g_threshold, payload)
    ├── [CMD_LED_ON] → GPIO_PIN_RESET (Active LOW)
    ├── [CMD_LED_OFF] → GPIO_PIN_SET
    ├── [CMD_PUMP_WATER] → GPIO_PIN_RESET
    ├── [CMD_PUMP_WATER_STOP] → GPIO_PIN_SET
    ├── [CMD_PUMP_NUTRI] → GPIO_PIN_RESET
    └── [CMD_PUMP_NUTRI_STOP] → GPIO_PIN_SET
```

### 8.3 Threshold Check Logic

```
sensor_check_threshold()
│
├── Water Level
│   ├── 정상→이상 (< water_min)
│   │   └── EVENT_WATER_LOW 전송
│   └── 이상→정상 (>= water_min)
│       └── EVENT_RECOVERY_DONE 전송
│
└── EC
    ├── 정상→이상 (< ec_min)
    │   └── EVENT_EC_LOW 전송
    └── 이상→정상 (>= ec_min)
        └── EVENT_RECOVERY_DONE 전송
```

---

## 9. Memory Map (Linker Script)

| Region | Start | Size | Usage |
|--------|-------|------|-------|
| FLASH | 0x08000000 | 128KB | Code, Constants |
| RAM | 0x20000000 | 20KB | Data, BSS, Heap, Stack |

| Section | Location |
|---------|----------|
| .isr_vector | FLASH (0x08000000) |
| .text | FLASH |
| .rodata | FLASH |
| .data | RAM (init from FLASH) |
| .bss | RAM (zero-initialized) |
| Heap | RAM (0x200 = 512B) |
| Stack | RAM (0x400 = 1KB) |

---

## 10. Interrupt Handlers

| Handler | Source | Action |
|---------|--------|--------|
| SysTick_Handler | SysTick | HAL_IncTick() |
| USART3_IRQHandler | USART3 RX | HAL_UART_IRQHandler() → RxCpltCallback |
| HardFault_Handler | Fault | while(1) |
| MemManage_Handler | MPU | while(1) |
| BusFault_Handler | Bus Error | while(1) |
| UsageFault_Handler | Instruction | while(1) |

---

## 11. Clock Configuration

```
┌─────────────┐
│   HSI 8MHz  │ (Internal RC Oscillator)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SYSCLK    │ = 8 MHz
└──────┬──────┘
       │
       ├──► AHB   = 8 MHz (÷1)
       ├──► APB1  = 8 MHz (÷1)
       └──► APB2  = 8 MHz (÷1)
```

- PLL: Not used
- External Crystal: Not used

---

## 12. Usage Notes

### 12.1 Communication Sequence
1. Jetson이 `CMD_READY` 전송
2. STM이 `stm_ready = true` 설정
3. 이후 다른 명령 수신 가능

### 12.2 Relay Control (Active LOW)
```c
// LED 켜기
HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);

// LED 끄기
HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
```

### 12.3 Sensor Read Timing
- AHT20: ~100ms (80ms 측정 + polling)
- ADS1115: ~20ms (10ms × 2 채널)
- Total: ~120ms per sensor_read_all()

### 12.4 Global Variables
```c
extern Threshold_t g_threshold;   // 임계값 설정
extern SensorData_t g_sensor;     // 최신 센서 데이터
extern UART_HandleTypeDef huart3; // UART 핸들
extern I2C_HandleTypeDef hi2c1;   // I2C 핸들
```

---

## 13. File Dependencies

```
main.c
├── main.h
│   └── stm32f1xx_hal.h
├── i2c.h
│   └── hi2c1 (extern)
├── usart.h
│   └── huart3 (extern)
├── gpio.h
├── sensor.h
│   ├── g_threshold
│   └── g_sensor
└── uart_parser.h

sensor.c
├── sensor.h
├── protocol.h
├── ads1115.h
├── aht20.h
└── i2c.h

uart_parser.c
├── uart_parser.h
├── protocol.h
├── sensor.h
└── gpio.h

protocol.c
├── protocol.h
└── usart.h (huart3)
```

---

## 14. Build Information

- **IDE**: STM32CubeIDE
- **Toolchain**: GCC ARM
- **HAL Version**: STM32Cube FW_F1 V1.8.6
- **CubeMX Version**: 6.15.0

---

## 15. Quick Reference

### Commands to STM (Jetson → STM)
| Action | Frame (Hex) |
|--------|-------------|
| Ready | `AA 01 01 00 00 55` |
| Ping | `AA 01 0C 00 0D 55` |
| Request Sensor | `AA 01 02 00 03 55` |
| LED ON | `AA 01 03 00 02 55` |
| LED OFF | `AA 01 04 00 05 55` |
| Water Pump ON | `AA 01 07 00 06 55` |
| Water Pump OFF | `AA 01 09 00 08 55` |
| Nutri Pump ON | `AA 01 08 00 09 55` |
| Nutri Pump OFF | `AA 01 0A 00 0B 55` |

### Responses from STM (STM → Jetson)
| Event | Frame Pattern |
|-------|---------------|
| Pong | `AA 01 0D 00 [CHK] 55` |
| Sensor Data | `AA 02 01 08 [8B payload] [CHK] 55` |
| Water Low | `AA 03 01 08 [8B payload] [CHK] 55` |
| EC Low | `AA 03 02 08 [8B payload] [CHK] 55` |
| Recovery | `AA 03 03 08 [8B payload] [CHK] 55` |
