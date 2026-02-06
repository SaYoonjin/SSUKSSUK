// sensor.c
#include "sensor.h"
#include "protocol.h"
#include "auto_recovery.h"
#include "ads1115.h"
#include "aht20.h"
#include "i2c.h"

#include <stdbool.h>

// =======================
// 전역 상태
// =======================

typedef enum {
    SENSOR_NORMAL = 0,
    SENSOR_LOW,
    SENSOR_HIGH
} SensorAbnormalState;

static SensorAbnormalState water_state = SENSOR_NORMAL;
static SensorAbnormalState ec_state    = SENSOR_NORMAL;

// threshold
Threshold_t g_threshold = {
    .water_min = 10.0f,
    .water_max = 60.0f,
    .ec_min    = 700.0f,
    .ec_max    = 2000.0f
};

static bool sensor_force_initial_check = false;

// 외부 요청용
void sensor_force_initial_check_request(void)
{
    sensor_force_initial_check = true;
}

// ⭐ 현재 "열려 있는 anomaly" 마스크 (AUTO_RECOVERY 기준)
uint8_t g_active_anomaly_mask = 0;

static bool sensor_check_suspended = false;

// 최종 센서 값 (filtered)
SensorData_t g_sensor = {0};

// =======================
// 필터 파라미터
// =======================
#define WATER_MA_SIZE   3
#define EC_ALPHA        0.2f

// =======================
// 내부 필터 상태
// =======================

// 수위 Moving Average
static float water_ma_buf[WATER_MA_SIZE] = {0};
static uint8_t water_ma_idx = 0;
static bool water_ma_init = false;

// EC EMA
static float ec_ema = 0.0f;
static bool ec_ema_init = false;

// =======================
// 초기 anomaly 제어
// =======================
static uint8_t sensor_warmup_cnt = 0;
//static bool init_anomaly_checked = false;

// =======================
// 내부 유틸
// =======================
void sensor_suspend_check(bool suspend)
{
    sensor_check_suspended = suspend;
}

static float ads1115_to_voltage(int16_t raw)
{
    return (raw * 4.096f) / 32768.0f;
}

static float moving_average(float *buf, uint8_t size)
{
    float sum = 0.0f;
    for (uint8_t i = 0; i < size; i++) {
        sum += buf[i];
    }
    return sum / size;
}

// =======================
// 센서 읽기
// =======================

void sensor_read_all(void)
{
    static int16_t last_water_raw = 0;
    static int16_t last_ec_raw    = 0;
    static uint8_t i2c_fail_cnt   = 0;

    int16_t water_raw = last_water_raw;
    int16_t ec_raw    = last_ec_raw;

    // ---- AHT20 ----
    AHT20_Read(&g_sensor.temperature, &g_sensor.humidity);

    // ---- ADS1115 ----
    HAL_StatusTypeDef st0 =
        ADS1115_ReadSingleEnded(&hi2c1, 0, &water_raw);
    HAL_StatusTypeDef st1 =
        ADS1115_ReadSingleEnded(&hi2c1, 1, &ec_raw);

    if (st0 == HAL_OK && st1 == HAL_OK) {
        last_water_raw = water_raw;
        last_ec_raw    = ec_raw;
        i2c_fail_cnt   = 0;
    } else {
        // 실패 시 이전 값 유지
        i2c_fail_cnt++;
        if (i2c_fail_cnt >= 3) {
            HAL_I2C_DeInit(&hi2c1);
            HAL_Delay(2);
            MX_I2C1_Init();
            i2c_fail_cnt = 0;
        }
    }

    // =======================
    // RAW → 물리값 변환
    // =======================

    float water_v = ads1115_to_voltage(last_water_raw);
    float ec_v    = ads1115_to_voltage(last_ec_raw);

    float water_raw_percent = (water_v / 3.3f) * 100.0f;
    float ec_raw_ppm        = ec_v * 1000.0f;

    // =======================
    // 수위: Moving Average (3)
    // =======================

    water_ma_buf[water_ma_idx++] = water_raw_percent;
    water_ma_idx %= WATER_MA_SIZE;

    if (!water_ma_init && water_ma_idx == 0) {
        water_ma_init = true;
    }

    if (water_ma_init) {
        g_sensor.water_level =
            moving_average(water_ma_buf, WATER_MA_SIZE);
    } else {
        g_sensor.water_level = water_raw_percent;
    }

    // =======================
    // EC: EMA (α = 0.2)
    // =======================

    if (!ec_ema_init) {
        ec_ema = ec_raw_ppm;
        ec_ema_init = true;
    } else {
        ec_ema = EC_ALPHA * ec_raw_ppm +
                 (1.0f - EC_ALPHA) * ec_ema;
    }

    g_sensor.ec = ec_ema;

    if (sensor_warmup_cnt < 255) {
        sensor_warmup_cnt++;
    }
}

// =======================
// 임계치 체크 FSM
// =======================
void sensor_check_threshold(void)
{
    uint16_t t = (uint16_t)(g_sensor.temperature * 10);
    uint16_t h = (uint16_t)(g_sensor.humidity * 10);
    uint16_t ec = (uint16_t)(g_sensor.ec);
    uint16_t water = (uint16_t)(g_sensor.water_level);

    // ==================================================
    // ⭐ 1. 초기 강제 anomaly 검사 (1회)
    // ==================================================
    if (sensor_force_initial_check) {

        // WATER
        if (g_sensor.water_level < g_threshold.water_min) {
            water_state = SENSOR_LOW;
            g_active_anomaly_mask |= RECOV_WATER;
            proto_send_event_sensor(EVENT_WATER_LOW, t, h, ec, water);
        }

        // EC
        if (g_sensor.ec < g_threshold.ec_min) {
            ec_state = SENSOR_LOW;
            g_active_anomaly_mask |= RECOV_EC;
            proto_send_event_sensor(EVENT_EC_LOW, t, h, ec, water);
        }

        sensor_force_initial_check = false;
        return;
    }

    // ==================================================
    // AUTO RECOVERY 중이면 anomaly 판단 중단
    // ==================================================
    if (auto_recovery_is_active()) return;

    // ==================================================
    // WATER
    // ==================================================
    if (water_state == SENSOR_NORMAL) {
        if (g_sensor.water_level < g_threshold.water_min) {
            water_state = SENSOR_LOW;
            g_active_anomaly_mask |= RECOV_WATER;
            proto_send_event_sensor(EVENT_WATER_LOW, t, h, ec, water);
        }
    } else {
        if (g_sensor.water_level >= g_threshold.water_min &&
            g_sensor.water_level <= g_threshold.water_max) {
            water_state = SENSOR_NORMAL;
            g_active_anomaly_mask &= ~RECOV_WATER;
            proto_send_event_sensor(EVENT_WATER_RECOVERY_DONE, t, h, ec, water);
        }
    }

    // ==================================================
    // EC
    // ==================================================
    if (ec_state == SENSOR_NORMAL) {
        if (g_sensor.ec < g_threshold.ec_min) {
            ec_state = SENSOR_LOW;
            g_active_anomaly_mask |= RECOV_EC;
            proto_send_event_sensor(EVENT_EC_LOW, t, h, ec, water);
        }
    } else {
        if (g_sensor.ec >= g_threshold.ec_min &&
            g_sensor.ec <= g_threshold.ec_max) {
            ec_state = SENSOR_NORMAL;
            g_active_anomaly_mask &= ~RECOV_EC;
            proto_send_event_sensor(EVENT_NUTRI_RECOVERY_DONE, t, h, ec, water);
        }
    }
}

void sensor_reset_fsm(void)
{
    // FSM 상태 초기화
    water_state = SENSOR_NORMAL;
    ec_state    = SENSOR_NORMAL;

    // anomaly 마스크 초기화
    g_active_anomaly_mask = 0;

    // 필터 상태 초기화
    water_ma_idx  = 0;
    water_ma_init = false;
    for (int i = 0; i < WATER_MA_SIZE; i++) {
        water_ma_buf[i] = 0.0f;
    }

    ec_ema = 0.0f;
    ec_ema_init = false;

    // warmup 초기화
    sensor_warmup_cnt = 0;

    // 다음 sensor_check_threshold에서
    // 초기 anomaly 1회 검사하도록 예약
    sensor_force_initial_check = true;

    // suspend 해제
    sensor_check_suspended = false;
}

