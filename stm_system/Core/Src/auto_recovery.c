// auto_recovery.c
#include "auto_recovery.h"
#include "sensor.h"
#include "protocol.h"

#include "gpio.h"
#include "stm32f1xx_hal.h"

typedef enum {
    AR_IDLE = 0,

    AR_WATER_PUMP_ON,
    AR_WATER_WAIT_SETTLE,
    AR_WATER_CHECK,

    AR_EC_PUMP_ON,
    AR_EC_WAIT_AFTER_ON,
    AR_EC_CHECK,
} AutoRecoveryState;

static AutoRecoveryState ar_state = AR_IDLE;
static uint32_t ar_tick = 0;
static uint8_t ar_ec_retry = 0;
static bool ar_active = false;

bool auto_recovery_is_active(void)
{
    return ar_active;
}

static void auto_recovery_finish(void)
{
    HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_SET);
    HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_SET);

    ar_state = AR_IDLE;
    ar_active = false;
    sensor_suspend_check(false);
}

void auto_recovery_start_if_needed(void)
{
    if (ar_state != AR_IDLE) return;

    if (g_sensor.water_level < g_threshold.water_min) {
        ar_active = true;
        sensor_suspend_check(true);

        HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_RESET);
        ar_state = AR_WATER_PUMP_ON;
        ar_tick = HAL_GetTick();
        return;
    }

    if (g_sensor.ec < g_threshold.ec_min) {
        ar_active = true;
        sensor_suspend_check(true);

        ar_ec_retry = 0;
        HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET);
        ar_state = AR_EC_PUMP_ON;
        ar_tick = HAL_GetTick();
    }
}

static float read_water_avg(void)
{
    float sum = 0;
    for (int i = 0; i < 5; i++) {
        sensor_read_all();
        sum += g_sensor.water_level;
        HAL_Delay(30);
    }
    return sum / 5.0f;
}

void auto_recovery_fsm(void)
{
    uint32_t now = HAL_GetTick();

    switch (ar_state)
    {
        case AR_WATER_PUMP_ON:
            if (now - ar_tick >= 10000) {
                HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_SET);
                ar_state = AR_WATER_WAIT_SETTLE;
                ar_tick = now;
            }
            break;

        case AR_WATER_WAIT_SETTLE:
            if (now - ar_tick >= 3000) {
                ar_state = AR_WATER_CHECK;
            }
            break;

        case AR_WATER_CHECK: {
            float water_avg = read_water_avg();
            if (water_avg >= g_threshold.water_min) {
                proto_send_event_sensor(EVENT_WATER_ACTION_SUCCESS,
                    (uint16_t)(g_sensor.temperature * 10),
                    (uint16_t)(g_sensor.humidity * 10),
                    (uint16_t)(g_sensor.ec),
                    (uint16_t)(water_avg));
            } else {
                proto_send_event_sensor(EVENT_WATER_PUMP_FAIL,
                    (uint16_t)(g_sensor.temperature * 10),
                    (uint16_t)(g_sensor.humidity * 10),
                    (uint16_t)(g_sensor.ec),
                    (uint16_t)(water_avg));
            }
            auto_recovery_finish();
            break;
        }

        default:
            auto_recovery_finish();
            break;
    }
}
