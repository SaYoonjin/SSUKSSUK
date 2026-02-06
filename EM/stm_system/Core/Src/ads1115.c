// ads1115.c
#include "ads1115.h"

HAL_StatusTypeDef ADS1115_ReadSingleEnded(
    I2C_HandleTypeDef *hi2c,
    uint8_t channel,
    int16_t *result
)
{
    if (channel > 3) return HAL_ERROR;

    uint16_t config = 0;

    // OS=1 (start single conversion)  ★이게 핵심
    config |= (1 << 15);

    // MUX: single-ended AINx vs GND (100~111)
    // A0:100, A1:101, A2:110, A3:111
    config |= (uint16_t)((0x04 + channel) << 12);

    // PGA: ±4.096V (3.3V 시스템에서 무난)
    config |= (uint16_t)(0x01 << 9);

    // MODE: single-shot
    config |= (1 << 8);

    // DR: 128 SPS
    config |= (uint16_t)(0x04 << 5);

    // COMP_QUE: disable comparator (11)
    config |= 0x0003;

    uint8_t tx[3];
    tx[0] = ADS1115_REG_CONFIG;
    tx[1] = (uint8_t)(config >> 8);
    tx[2] = (uint8_t)(config & 0xFF);

    if (HAL_I2C_Master_Transmit(hi2c, ADS1115_ADDR, tx, 3, 100) != HAL_OK)
        return HAL_ERROR;

    // 변환 대기(128SPS면 8ms 정도). 넉넉히 10ms.
    HAL_Delay(10);

    uint8_t reg = ADS1115_REG_CONV;
    if (HAL_I2C_Master_Transmit(hi2c, ADS1115_ADDR, &reg, 1, 100) != HAL_OK)
        return HAL_ERROR;

    uint8_t rx[2];
    if (HAL_I2C_Master_Receive(hi2c, ADS1115_ADDR, rx, 2, 100) != HAL_OK)
        return HAL_ERROR;

    *result = (int16_t)((rx[0] << 8) | rx[1]);
    return HAL_OK;
}
