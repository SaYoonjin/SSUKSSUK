#include "uart_parser.h"
#include "protocol.h"
#include "sensor.h"
#include <string.h>
#include <stdio.h>

static uint8_t rx_buf[64];
static uint8_t idx = 0;
static uint8_t expected_len = 0;
static bool stm_ready = false;

static void handle_packet(uint8_t type, uint8_t subtype,
                          const uint8_t *payload, uint8_t len);


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

    else if (type == TYPE_CMD && subtype == CMD_SET_TH) {
        if (len == sizeof(Threshold_t)) {
            memcpy(&g_threshold, payload, sizeof(Threshold_t));

            proto_send(
				TYPE_CMD,
				CMD_SET_TH,
				(uint8_t *)&g_threshold,
				sizeof(Threshold_t)
			);
        }
    }

}
