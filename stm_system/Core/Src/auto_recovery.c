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

static uint8_t pending_recovery_mask = 0;
static uint8_t running_recovery_mask = 0;  // 현재 진행 중인 센서 마스크
static AutoRecoveryState ar_state = AR_IDLE;
static uint32_t ar_tick = 0;
static uint8_t ar_ec_retry = 0;
static bool ar_active = false;

static void auto_recovery_start_if_needed(void);

static inline void pump_water_on(void)
{
    HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_RESET);
}

static inline void pump_water_off(void)
{
    HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_SET);
}

static inline void pump_nutri_on(void)
{
    HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET);
}

static inline void pump_nutri_off(void)
{
    HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_SET);
}

bool auto_recovery_is_active(void)
{
    return ar_active;
}

void auto_recovery_request(uint8_t sensor_mask)
{
    // 현재 진행 중이거나 이미 pending인 센서는 제외
    uint8_t new_mask = sensor_mask & ~pending_recovery_mask & ~running_recovery_mask;
    if (new_mask == 0) return;

    pending_recovery_mask |= new_mask;

    if (!ar_active && ar_state == AR_IDLE) {
        auto_recovery_start_if_needed();
    }
}

void auto_recovery_start_if_needed(void)
{
    if (ar_state != AR_IDLE) return;

    if ((pending_recovery_mask & RECOV_WATER) &&
        g_sensor.water_level < g_threshold.water_min) {

        pending_recovery_mask &= ~RECOV_WATER;
        running_recovery_mask = RECOV_WATER;  // 현재 WATER 진행 중 표시
        ar_active = true;
        sensor_suspend_check(true);

        pump_water_on();
        ar_state = AR_WATER_PUMP_ON;
        ar_tick = HAL_GetTick();
        return;

    }

    if ((pending_recovery_mask & RECOV_EC) &&
        g_sensor.ec < g_threshold.ec_min) {

        pending_recovery_mask &= ~RECOV_EC;
        running_recovery_mask = RECOV_EC;  // 현재 EC 진행 중 표시
        ar_active = true;
        // sensor_suspend_check(true);

        ar_ec_retry = 0;
        pump_nutri_on();
        ar_state = AR_EC_PUMP_ON;
        ar_tick = HAL_GetTick();
        return;
    }
}

static void auto_recovery_finish(void)
{
    pump_water_off();
    pump_nutri_off();

    ar_state = AR_IDLE;
    ar_active = false;
    running_recovery_mask = 0;  // 진행 중 마스크 해제
    sensor_suspend_check(false);

    // ⭐ pending_mask가 남아있으면 다음 작업 시작
    if (pending_recovery_mask != 0) {
        auto_recovery_start_if_needed();
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
        // =======================
        // WATER
        // =======================
        case AR_WATER_PUMP_ON:
            if (now - ar_tick >= 4000) {
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

        // =======================
        // EC (NUTRIENT)
        // =======================
        case AR_EC_PUMP_ON:
            // 1초 ON
            if (now - ar_tick >= 700) {
                HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_SET); // OFF
                ar_state = AR_EC_WAIT_AFTER_ON;
                ar_tick = now;
            }
            break;

        case AR_EC_WAIT_AFTER_ON:
            // 30초 대기 후 재측정
            if (now - ar_tick >= 30000) {
                ar_state = AR_EC_CHECK;
            }
            break;

        case AR_EC_CHECK:
            // 재측정(여기서 한 번 더 읽고 판단)
            sensor_read_all();

            if (g_sensor.ec >= g_threshold.ec_min) {
                proto_send_event_sensor(EVENT_NUTRI_ACTION_SUCCESS,
                    (uint16_t)(g_sensor.temperature * 10),
                    (uint16_t)(g_sensor.humidity * 10),
                    (uint16_t)(g_sensor.ec),
                    (uint16_t)(g_sensor.water_level));
                auto_recovery_finish();
            } else {
                ar_ec_retry++;
                if (ar_ec_retry >= 5) {
                    // 5번 시도 후 실패
                    proto_send_event_sensor(EVENT_NUTRI_PUMP_FAIL,
                        (uint16_t)(g_sensor.temperature * 10),
                        (uint16_t)(g_sensor.humidity * 10),
                        (uint16_t)(g_sensor.ec),
                        (uint16_t)(g_sensor.water_level));
                    auto_recovery_finish();
                } else {
                    // 다시 700ms ON 반복
                    HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET); // ON
                    ar_state = AR_EC_PUMP_ON;
                    ar_tick = now;
                }
            }
            break;

        default:
            auto_recovery_finish();
            break;
    }
}

void auto_recovery_force_stop(void)
{
    pump_water_off();
    pump_nutri_off();

    ar_state = AR_IDLE;
    ar_active = false;
    pending_recovery_mask = 0;
    running_recovery_mask = 0;
    ar_ec_retry = 0;

    sensor_suspend_check(false);
}
