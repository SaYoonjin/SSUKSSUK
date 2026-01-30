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

Threshold_t g_threshold = {
    .water_min = 10.0f,
    .water_max = 60.0f,
    .ec_min    = 0.0f,
    .ec_max    = 2000.0f
};

static bool sensor_check_suspended = false;

SensorData_t g_sensor = {0};

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

    // AHT20
    AHT20_Read(&g_sensor.temperature, &g_sensor.humidity);

    HAL_StatusTypeDef st0 =
        ADS1115_ReadSingleEnded(&hi2c1, 0, &water_raw);
    HAL_StatusTypeDef st1 =
        ADS1115_ReadSingleEnded(&hi2c1, 1, &ec_raw);

    if (st0 == HAL_OK && st1 == HAL_OK) {
        last_water_raw = water_raw;
        last_ec_raw    = ec_raw;
        i2c_fail_cnt   = 0;
    } else {
        // ❗ 실패 시 값 갱신 안 함
        i2c_fail_cnt++;
        if (i2c_fail_cnt >= 3) {
            // I2C 재초기화 (최후 방어)
            HAL_I2C_DeInit(&hi2c1);
            HAL_Delay(2);
            MX_I2C1_Init();
            i2c_fail_cnt = 0;
        }
    }

    float water_v = ads1115_to_voltage(last_water_raw);
    float ec_v    = ads1115_to_voltage(last_ec_raw);

    g_sensor.water_level = (water_v / 3.3f) * 100.0f;
    g_sensor.ec          = ec_v * 1000.0f;
}

// =======================
// 임계치 체크
// =======================
void sensor_check_threshold(void)
{
    if (sensor_check_suspended) return;
    if (auto_recovery_is_active()) return;

    uint16_t temp_x10 = (uint16_t)(g_sensor.temperature * 10.0f);
    uint16_t humi_x10 = (uint16_t)(g_sensor.humidity * 10.0f);
    uint16_t ec       = (uint16_t)(g_sensor.ec);
    uint16_t water    = (uint16_t)(g_sensor.water_level);

    // ---- WATER ----
    if (water_state == SENSOR_NORMAL) {
        if (g_sensor.water_level < g_threshold.water_min) {
            water_state = SENSOR_LOW;
            proto_send_event_sensor(EVENT_WATER_LOW, temp_x10, humi_x10, ec, water);
        } else if (g_sensor.water_level > g_threshold.water_max) {
            water_state = SENSOR_HIGH;
            proto_send_event_sensor(EVENT_WATER_HIGH, temp_x10, humi_x10, ec, water);
        }
    } else {
        if (g_sensor.water_level >= g_threshold.water_min &&
            g_sensor.water_level <= g_threshold.water_max) {
            water_state = SENSOR_NORMAL;
            proto_send_event_sensor(EVENT_WATER_RECOVERY_DONE, temp_x10, humi_x10, ec, water);
        }
    }

    // ---- EC ----
    if (ec_state == SENSOR_NORMAL) {
        if (g_sensor.ec < g_threshold.ec_min) {
            ec_state = SENSOR_LOW;
            proto_send_event_sensor(EVENT_EC_LOW, temp_x10, humi_x10, ec, water);
        } else if (g_sensor.ec > g_threshold.ec_max) {
            ec_state = SENSOR_HIGH;
            proto_send_event_sensor(EVENT_EC_HIGH, temp_x10, humi_x10, ec, water);
        }
    } else {
        if (g_sensor.ec >= g_threshold.ec_min &&
            g_sensor.ec <= g_threshold.ec_max) {
            ec_state = SENSOR_NORMAL;
            proto_send_event_sensor(EVENT_NUTRI_RECOVERY_DONE, temp_x10, humi_x10, ec, water);
        }
    }
}
