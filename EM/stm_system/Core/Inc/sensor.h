#pragma once
#ifndef SENSOR_H
#define SENSOR_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    float water_min;
    float water_max;
    float ec_min;
    float ec_max;
} Threshold_t;

typedef struct {
    float temperature;
    float humidity;
    float water_level;
    float ec;
} SensorData_t;

extern Threshold_t g_threshold;
extern SensorData_t g_sensor;
extern uint8_t g_active_anomaly_mask;

void sensor_read_all(void);
void sensor_check_threshold(void);
void sensor_suspend_check(bool suspend);
void sensor_force_initial_check_request(void);
void sensor_reset_fsm(void);

#endif
