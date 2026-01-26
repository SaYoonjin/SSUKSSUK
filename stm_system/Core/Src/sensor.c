// sensor.c
#include "sensor.h"
#include "protocol.h"
#include "ads1115.h"
#include "aht20.h"
#include "i2c.h"

#include <stdbool.h>


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

static bool water_abnormal = false;
static bool ec_abnormal = false;



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
    uint16_t temp_x10 = (uint16_t)(g_sensor.temperature * 10.0f);
    uint16_t humi_x10 = (uint16_t)(g_sensor.humidity * 10.0f);
    uint16_t ec       = (uint16_t)(g_sensor.ec);
    uint16_t water    = (uint16_t)(g_sensor.water_level);

    /* ===============================
     * WATER LEVEL
     * =============================== */

    // 정상 → 이상
    if (!water_abnormal && g_sensor.water_level < g_threshold.water_min)
    {
        water_abnormal = true;

        proto_send_event_sensor(
            EVENT_WATER_LOW,
            temp_x10, humi_x10, ec, water
        );
    }

    // 이상 → 정상
    else if (water_abnormal && g_sensor.water_level >= g_threshold.water_min)
    {
        water_abnormal = false;

        proto_send_event_sensor(
            EVENT_RECOVERY_DONE,
            temp_x10, humi_x10, ec, water
        );
    }

    /* ===============================
     * EC
     * =============================== */

    // 정상 → 이상
    if (!ec_abnormal && g_sensor.ec < g_threshold.ec_min)
    {
        ec_abnormal = true;

        proto_send_event_sensor(
            EVENT_EC_LOW,
            temp_x10, humi_x10, ec, water
        );
    }

    // 이상 → 정상
    else if (ec_abnormal && g_sensor.ec >= g_threshold.ec_min)
    {
        ec_abnormal = false;

        proto_send_event_sensor(
            EVENT_RECOVERY_DONE,
            temp_x10, humi_x10, ec, water
        );
    }
}
