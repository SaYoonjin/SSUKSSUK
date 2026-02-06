// protocol.c
#include "protocol.h"
#include <string.h>

/*
 * 프레임 포맷
 *
 * [STX][TYPE][SUBTYPE][LEN][PAYLOAD...][CHK][ETX]
 */

/* ================================
 * Checksum (XOR)
 * ================================ */
uint8_t proto_checksum(
    uint8_t type,
    uint8_t subtype,
    uint8_t len,
    const uint8_t *payload
)
{
    uint8_t chk = type ^ subtype ^ len;
    for (uint8_t i = 0; i < len; i++)
    {
        chk ^= payload[i];
    }
    return chk;
}

/* ================================
 * Little-endian u16 pack
 * ================================ */
void proto_pack_u16_le(uint8_t *dst, uint16_t v)
{
    dst[0] = (uint8_t)(v & 0xFF);
    dst[1] = (uint8_t)(v >> 8);
}

/* ================================
 * Low-level send
 * ================================ */
HAL_StatusTypeDef proto_send(
    uint8_t type,
    uint8_t subtype,
    const uint8_t *payload,
    uint8_t len
)
{
    uint8_t frame[PROTO_MAX_PAYLOAD + 6];
    uint8_t idx = 0;

    frame[idx++] = STX;
    frame[idx++] = type;
    frame[idx++] = subtype;
    frame[idx++] = len;

    if (len > 0 && payload != NULL)
    {
        memcpy(&frame[idx], payload, len);
        idx += len;
    }

    frame[idx++] = proto_checksum(type, subtype, len, payload);
    frame[idx++] = ETX;

    return HAL_UART_Transmit(
        &huart3,
        frame,
        idx,
        HAL_MAX_DELAY
    );
}

/* ================================
 * PONG 응답
 * ================================ */
HAL_StatusTypeDef proto_send_pong(void)
{
    return proto_send(
        TYPE_CMD,
        CMD_PONG,
        NULL,
        0
    );
}

/* ================================
 * SENSOR DATA 전송
 * payload:
 *  temp_x10  (uint16)
 *  humi_x10  (uint16)
 *  ec        (uint16)
 *  water     (uint16)
 * ================================ */
HAL_StatusTypeDef proto_send_sensor_data(
    uint16_t temp_x10,
    uint16_t humi_x10,
    uint16_t ec,
    uint16_t water
)
{
    uint8_t payload[8];

    proto_pack_u16_le(&payload[0], temp_x10);
    proto_pack_u16_le(&payload[2], humi_x10);
    proto_pack_u16_le(&payload[4], ec);
    proto_pack_u16_le(&payload[6], water);

    return proto_send(
        TYPE_DATA,
        DATA_SENSOR,
        payload,
        sizeof(payload)
    );
}

HAL_StatusTypeDef proto_send_event_sensor(
    uint8_t event_subtype,
    uint16_t temp_x10,
    uint16_t humi_x10,
    uint16_t ec,
    uint16_t water
)
{
    uint8_t payload[8];

    proto_pack_u16_le(&payload[0], temp_x10);
    proto_pack_u16_le(&payload[2], humi_x10);
    proto_pack_u16_le(&payload[4], ec);
    proto_pack_u16_le(&payload[6], water);

    return proto_send(
        TYPE_EVENT,
        event_subtype,
        payload,
        sizeof(payload)
    );
}

