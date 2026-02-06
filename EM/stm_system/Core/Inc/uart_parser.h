// uart_parser.h
#pragma once

#include <stdint.h>
#include <stdbool.h>

void uart_rx_byte(uint8_t byte);
void uart_process(void);
void uart_poll(void);
void auto_recovery_fsm(void);
