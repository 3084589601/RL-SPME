#include "main.h"
#include <string.h>
uint8_t uart_rx_buf[64];
void UART_SendString(const char *msg) {
  HAL_UART_Transmit(&huart1, (uint8_t *)msg, (uint16_t)strlen(msg), HAL_MAX_DELAY);
}
