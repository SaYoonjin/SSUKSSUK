// protocol.h
#pragma once
#include <stdint.h>
#include "usart.h"   // huart3 사용

#define STX 0xAA
#define ETX 0x55

// TYPE
#define TYPE_CMD   0x01
#define TYPE_DATA  0x02
#define TYPE_EVENT 0x03

// CMD SUBTYPE
#define CMD_READY           0x01
#define CMD_REQ_SENSOR      0x02
#define CMD_LED_ON          0x03
#define CMD_LED_OFF         0x04
//#define CMD_SET_MODE_AUTO   0x05
//#define CMD_SET_MODE_MANUAL 0x06
#define CMD_PUMP_WATER      0x07
#define CMD_PUMP_NUTRI      0x08
#define CMD_PUMP_WATER_STOP	0x09
#define CMD_PUMP_NUTRI_STOP	0x0A
//#define CMD_SET_TH		    0x0B
#define CMD_PING            0x0C
#define CMD_PONG            0x0D
#define CMD_AUTO_RECOVERY	0x0E
#define CMD_CLOSE 0x0F

// DATA SUBTYPE
#define DATA_SENSOR         0x01

// EVENT SUBTYPE
#define EVENT_WATER_LOW     0x01
#define EVENT_EC_LOW        0x02
#define EVENT_WATER_HIGH     0x03
#define EVENT_EC_HIGH        0x04
#define EVENT_WATER_RECOVERY_DONE 0x05
#define EVENT_NUTRI_RECOVERY_DONE 0x06
#define EVENT_SENSOR_FAIL   	0x07
#define EVENT_WATER_PUMP_FAIL	0x08
#define EVENT_NUTRI_PUMP_FAIL	0x09
#define EVENT_WATER_ACTION_SUCCESS	0x0A
#define EVENT_NUTRI_ACTION_SUCCESS 0x0B

// 최대 payload 길이(필요시 늘리기)
#define PROTO_MAX_PAYLOAD   32

typedef struct {
	uint8_t type;
	uint8_t subtype;
	uint8_t len;
	uint8_t payload[PROTO_MAX_PAYLOAD];
} proto_msg_t;

HAL_StatusTypeDef proto_send_event_sensor(uint8_t event_subtype,
		uint16_t temp_x10, uint16_t humi_x10, uint16_t ec, uint16_t water);

// 공통 유틸
uint8_t proto_checksum(uint8_t type, uint8_t subtype, uint8_t len,
		const uint8_t *payload);
void proto_pack_u16_le(uint8_t *dst, uint16_t v);

// 전송 (USART3 사용)
HAL_StatusTypeDef proto_send(uint8_t type, uint8_t subtype,
		const uint8_t *payload, uint8_t len);

// 자주 쓰는 메시지 헬퍼
HAL_StatusTypeDef proto_send_pong(void);

HAL_StatusTypeDef proto_send_sensor_data(uint16_t temp_x10, uint16_t humi_x10,
		uint16_t ec, uint16_t water);
