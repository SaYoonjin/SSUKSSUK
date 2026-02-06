// auto_recovery.h
#ifndef AUTO_RECOVERY_H
#define AUTO_RECOVERY_H

#include <stdint.h>
#include <stdbool.h>

#define RECOV_WATER  (1 << 0)
#define RECOV_EC     (1 << 1)

void auto_recovery_request(uint8_t sensor_mask);
void auto_recovery_fsm(void);
bool auto_recovery_is_active(void);
void auto_recovery_force_stop(void);

#endif
