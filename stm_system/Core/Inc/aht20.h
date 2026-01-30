#pragma once
#include "stm32f1xx_hal.h"


HAL_StatusTypeDef AHT20_Read(float* Temp, float* Humid);
