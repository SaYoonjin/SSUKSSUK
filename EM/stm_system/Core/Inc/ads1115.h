#ifndef __ADS1115_H
#define __ADS1115_H

#include "stm32f1xx_hal.h"

#define ADS1115_ADDR       (0x48 << 1)   // ADDR = GND
#define ADS1115_REG_CONV   0x00
#define ADS1115_REG_CONFIG 0x01

HAL_StatusTypeDef ADS1115_ReadSingleEnded(
    I2C_HandleTypeDef *hi2c,
    uint8_t channel,
    int16_t *result
);
#endif // __ADS1115_H
