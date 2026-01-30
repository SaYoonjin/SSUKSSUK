// auto_recovery.h
#pragma once
#include <stdbool.h>
#include <stdint.h>

void auto_recovery_init(void);

/* CMD_AUTO_RECOVERY 수신 시 호출 */
void auto_recovery_start_if_needed(void);

/* main loop에서 주기적으로 호출 */
void auto_recovery_fsm(void);

/* 자동조치 진행 중인지 여부 */
bool auto_recovery_is_active(void);
