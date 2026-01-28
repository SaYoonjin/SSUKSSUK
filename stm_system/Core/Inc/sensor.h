// sensor.h
#pragma once
#ifndef SENSOR_H
#define SENSOR_H

#include <stdint.h>

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

//typedef struct {
//    int16_t water_raw_min;
//    int16_t water_raw_max;
//
//    int16_t ec_raw_min;
//    int16_t ec_raw_max;
//} Threshold_t;

//typedef struct {
//    float temperature;
//    float humidity;
//
//    int16_t water_raw;
//    int16_t ec_raw;
//
//    // (나중에 쓰고 싶으면 유지해도 됨)
//    // float water_level;
//    // float ec;
//} SensorData_t;

extern Threshold_t g_threshold;
extern SensorData_t g_sensor;

void sensor_read_all(void);
void sensor_check_threshold(void);

#endif
