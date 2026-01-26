#include "sensor.h"
#include "ads1115.h"
#include "aht20.h"
#include "i2c.h"

// =======================
// 전역 상태
// =======================

Threshold_t g_threshold = {
    .water_min = 0.0f,
    .water_max = 100.0f,
    .ec_min    = 0.0f,
    .ec_max    = 2000.0f
};

SensorData_t g_sensor = {0};

// =======================
// 내부 유틸
// =======================

static float ads1115_to_voltage(int16_t raw)
{
    return (raw * 4.096f) / 32768.0f;
}

// =======================
// 센서 읽기
// =======================

void sensor_read_all(void)
{
    int16_t water_raw, ec_raw;

    // AHT20
    AHT20_Read(&g_sensor.temperature, &g_sensor.humidity);

    // ADS1115
    ADS1115_ReadSingleEnded(&hi2c1, 0, &water_raw);
    ADS1115_ReadSingleEnded(&hi2c1, 1, &ec_raw);

    float water_v = ads1115_to_voltage(water_raw);
    float ec_v    = ads1115_to_voltage(ec_raw);

    // 임시 환산 (지금 단계에서는 OK)
    g_sensor.water_level = (water_v / 3.3f) * 100.0f;
    g_sensor.ec          = ec_v * 1000.0f;
}

// =======================
// 임계치 체크 (다음 단계)
// =======================

void sensor_check_threshold(void)
{
    // TODO:
    // if (g_sensor.water_level < g_threshold.water_min)
    //   → EVENT_WATER_LOW
    // if (g_sensor.ec < g_threshold.ec_min)
    //   → EVENT_EC_LOW
}
