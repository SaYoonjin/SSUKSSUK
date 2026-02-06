#include "aht20.h"
#include "i2c.h"
#include "stm32f1xx_hal.h"

#define AHT_ADDR   (0x38 << 1)
#define HI2C       hi2c1

HAL_StatusTypeDef AHT20_Read(float* Temp, float* Humid)
{
    uint8_t dum[6];

    /* 1️⃣ Status read (0x71) */
    if (HAL_I2C_Mem_Read(&HI2C, AHT_ADDR, 0x71, 1, dum, 1, 100) != HAL_OK)
    {
        return HAL_ERROR;   // I2C 자체가 안 됨
    }

    /* 2️⃣ Calibration 안 돼 있으면 init */
    if (!(dum[0] & (1 << 3)))
    {
        uint8_t init_cmd[3] = {0xBE, 0x08, 0x00};
        if (HAL_I2C_Master_Transmit(&HI2C, AHT_ADDR, init_cmd, 3, 100) != HAL_OK)
        {
            return HAL_ERROR;
        }
        HAL_Delay(10);
    }

    /* 3️⃣ 측정 트리거 */
    uint8_t trig[3] = {0xAC, 0x33, 0x00};
    if (HAL_I2C_Master_Transmit(&HI2C, AHT_ADDR, trig, 3, 100) != HAL_OK)
    {
        return HAL_ERROR;
    }

    HAL_Delay(80);   // 데이터 준비 시간

    /* 4️⃣ Busy polling (❗타임아웃 필수) */
    uint32_t t_start = HAL_GetTick();
    do
    {
        if (HAL_I2C_Mem_Read(&HI2C, AHT_ADDR, 0x71, 1, dum, 1, 100) != HAL_OK)
        {
            return HAL_ERROR;
        }

        if (HAL_GetTick() - t_start > 200)
        {
            return HAL_TIMEOUT;   // 센서가 busy에서 안 풀림
        }

        HAL_Delay(2);

    } while (dum[0] & (1 << 7));

    /* 5️⃣ 데이터 읽기 */
    if (HAL_I2C_Master_Receive(&HI2C, AHT_ADDR, dum, 6, 100) != HAL_OK)
    {
        return HAL_ERROR;
    }

    /* 6️⃣ 값 계산 */
    uint32_t h20 =
        ((uint32_t)dum[1] << 12) |
        ((uint32_t)dum[2] << 4)  |
        (dum[3] >> 4);

    uint32_t t20 =
        ((uint32_t)(dum[3] & 0x0F) << 16) |
        ((uint32_t)dum[4] << 8) |
        dum[5];

    *Temp  = (t20 / 1048576.0f) * 200.0f - 50.0f;
    *Humid = (h20 / 1048576.0f) * 100.0f;

    return HAL_OK;
}
