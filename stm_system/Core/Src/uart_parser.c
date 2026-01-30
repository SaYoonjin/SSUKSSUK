#include "uart_parser.h"
#include "protocol.h"
#include "sensor.h"
#include "gpio.h"   // GPIO 제어용
#include <string.h>
#include <stdio.h>

static uint8_t rx_buf[64];
static uint8_t idx = 0;
static uint8_t expected_len = 0;
static bool stm_ready = false;

static void handle_packet(uint8_t type, uint8_t subtype,
                          const uint8_t *payload, uint8_t len);

//typedef enum {
//    AUTO_IDLE,
//    AUTO_WATER_ACT,
//    AUTO_EC_ACT,
//    AUTO_EC_WAIT
//} AutoState_t;
//
//
//static AutoState_t auto_state = AUTO_IDLE;
//static uint8_t ec_retry_count = 0;
//static uint32_t action_tick = 0;
//
//void auto_recovery_fsm(void)
//{
//    uint32_t now = HAL_GetTick();
//
//    uint16_t temp_x10 = (uint16_t)(g_sensor.temperature * 10.0f);
//	uint16_t humi_x10 = (uint16_t)(g_sensor.humidity * 10.0f);
//	uint16_t ec       = (uint16_t)(g_sensor.ec);
//	uint16_t water    = (uint16_t)(g_sensor.water_level);
//
//    // WATER
//    if (auto_state == AUTO_WATER_ACT) {
//        if (now - action_tick >= 10000) { // 10초
//            HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_SET);
//
//            if (g_sensor.water_level >= g_threshold.water_min) {
//            	uint16_t temp_x10 = (uint16_t)(g_sensor.temperature * 10.0f);
//            	uint16_t humi_x10 = (uint16_t)(g_sensor.humidity * 10.0f);
//            	uint16_t ec       = (uint16_t)(g_sensor.ec);
//            	uint16_t water    = (uint16_t)(g_sensor.water_level);
//
//            	proto_send_event_sensor(
//            	    EVENT_WATER_ACTION_SUCCESS,
//            	    temp_x10, humi_x10, ec, water
//            	);
//
//                auto_state = AUTO_IDLE;
//            } else {
//                proto_send_event_sensor(
//                    EVENT_WATER_PUMP_FAIL,
//                    temp_x10, humi_x10, ec, water
//                );
//                auto_state = AUTO_IDLE;   // ★ 중요
//            }
//        }
//    }
//
//    // EC
//    if (auto_state == AUTO_EC_ACT) {
//        if (now - action_tick >= 1000) { // 1초
//            HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_SET);
//            auto_state = AUTO_EC_WAIT;
//            action_tick = now;
//        }
//    }
//
//    if (auto_state == AUTO_EC_WAIT) {
//        if (now - action_tick >= 1000) {
//            if (g_sensor.ec >= g_threshold.ec_min) {
//            	uint16_t temp_x10 = (uint16_t)(g_sensor.temperature * 10.0f);
//            	uint16_t humi_x10 = (uint16_t)(g_sensor.humidity * 10.0f);
//            	uint16_t ec       = (uint16_t)(g_sensor.ec);
//            	uint16_t water    = (uint16_t)(g_sensor.water_level);
//
//            	proto_send_event_sensor(
//            	    EVENT_NUTRI_ACTION_SUCCESS,
//            	    temp_x10, humi_x10, ec, water
//            	);
//
//                auto_state = AUTO_IDLE;
//            } else if (++ec_retry_count >= 5) {
//                proto_send_event_sensor(
//                    EVENT_NUTRI_PUMP_FAIL,
//                    temp_x10, humi_x10, ec, water
//                );
//                auto_state = AUTO_IDLE;   // ★ 중요
//            } else {
//                auto_state = AUTO_EC_ACT;
//                HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET);
//                action_tick = now;
//            }
//        }
//    }
//}


void uart_poll(void)
{
    uint8_t byte;

    // RXNE 플래그 확인
    if (__HAL_UART_GET_FLAG(&huart3, UART_FLAG_RXNE))
    {
        // 수신 데이터 읽기
        byte = (uint8_t)(huart3.Instance->DR & 0xFF);

        // 바이트 단위 파서로 전달
        uart_rx_byte(byte);
    }
}

void uart_rx_byte(uint8_t byte)
{
    if (idx == 0 && byte != STX)
        return;

    rx_buf[idx++] = byte;

    if (idx == 4)
        expected_len = rx_buf[3];

    // frame: STX(1) + TYPE(1) + SUB(1) + LEN(1) + PAYLOAD + CHK(1) + ETX(1)
    if (idx >= 6 && idx == expected_len + 6) {
        uart_process();
        idx = 0;
    }
}

void uart_process(void)
{
    // 기본 검증
    if (rx_buf[0] != STX) return;
    if (rx_buf[expected_len + 5] != ETX) return;

    uint8_t type    = rx_buf[1];
    uint8_t subtype = rx_buf[2];
    uint8_t len     = rx_buf[3];
    uint8_t *payload= &rx_buf[4];
    uint8_t chk     = rx_buf[4 + len];

    // checksum 검증
    if (proto_checksum(type, subtype, len, payload) != chk)
        return;

    handle_packet(type, subtype, payload, len);
}

void handle_packet(uint8_t type, uint8_t subtype,
                   const uint8_t *payload, uint8_t len)
{
    // READY는 항상 허용
    if (type == TYPE_CMD && subtype == CMD_READY) {
        stm_ready = true;
        return;
    }

    // READY 전에는 아무 것도 안 함
    if (!stm_ready) {
        return;
    }

    if (type == TYPE_CMD && subtype == CMD_PING) {
        proto_send_pong();
    }
    else if (type == TYPE_CMD && subtype == CMD_REQ_SENSOR) {

        uint16_t temp_x10  = (uint16_t)(g_sensor.temperature * 10.0f);
        uint16_t humi_x10  = (uint16_t)(g_sensor.humidity * 10.0f);
        uint16_t ec        = (uint16_t)(g_sensor.ec);
        uint16_t water     = (uint16_t)(g_sensor.water_level);

        proto_send_sensor_data(
            temp_x10,
            humi_x10,
            ec,
            water
        );
    }

    else if (type == TYPE_CMD && subtype == CMD_LED_ON) {
        // Active LOW 릴레이 기준 (켜기), GPIO output level: high
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);
        // Reset -> low -> 릴레이 ON -> NO 닫힘
    }

    else if (type == TYPE_CMD && subtype == CMD_LED_OFF) {
        // 끄기
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
    }

    else if (type == TYPE_CMD && subtype == CMD_AUTO_RECOVERY) {
//
//        if (auto_state != AUTO_IDLE)
//            return;
//
//        // WATER DOWN만 처리
//        if (g_sensor.water_level < g_threshold.water_min) {
//            auto_state = AUTO_WATER_ACT;
//            HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_RESET);
//            action_tick = HAL_GetTick();
//        }
//
//        // EC DOWN만 처리
//        else if (g_sensor.ec < g_threshold.ec_min) {
//            auto_state = AUTO_EC_ACT;
//            ec_retry_count = 0;
//            HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET);
//            action_tick = HAL_GetTick();
//        }
//
//        // UP 상황이면 아무 것도 안 함 (명세)
    }


    // [테스트용] 펌프 두개 작동&중지 테스트용임 이거 실제 사용하지 않음
    else if(type==TYPE_CMD && subtype == CMD_PUMP_WATER) {
    	HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_RESET);
    }
    // [테스트용] 펌프 두개 작동&중지 테스트용임 이거 실제 사용하지 않음
    else if(type==TYPE_CMD && subtype == CMD_PUMP_WATER_STOP) {
        	HAL_GPIO_WritePin(WATER_PUMP_GPIO_Port, WATER_PUMP_Pin, GPIO_PIN_SET);
    }
    // [테스트용] 펌프 두개 작동&중지 테스트용임 이거 실제 사용하지 않음
    else if(type==TYPE_CMD && subtype == CMD_PUMP_NUTRI) {
		HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_RESET);
	}
    // [테스트용] 펌프 두개 작동&중지 테스트용임 이거 실제 사용하지 않음
	else if(type==TYPE_CMD && subtype == CMD_PUMP_NUTRI_STOP) {
		HAL_GPIO_WritePin(NUTRI_PUMP_GPIO_Port, NUTRI_PUMP_Pin, GPIO_PIN_SET);
	}
}

