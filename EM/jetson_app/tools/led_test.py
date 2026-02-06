# led_test.py
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from uart.uart_manager import UARTManager
from uart.packet import CMD_LED_ON, CMD_LED_OFF


def main():
    print("=== LED RELAY TEST ===")
    print("1 : LED ON  (relay ON)")
    print("2 : LED OFF (relay OFF)")
    print("q : quit")
    print("======================")

    uart = UARTManager(
        port="/dev/ttyTHS1",   # 필요하면 수정
        baudrate=115200
    )

    try:
        while True:
            key = input("> ").strip()

            if key == "1":
                uart.send_cmd(CMD_LED_ON)
                print("[TEST] CMD_LED_ON sent")

            elif key == "2":
                uart.send_cmd(CMD_LED_OFF)
                print("[TEST] CMD_LED_OFF sent")

            elif key.lower() == "q":
                print("exit")
                break

            else:
                print("invalid input (use 1 / 2 / q)")

    except KeyboardInterrupt:
        print("\nexit")

    finally:
        try:
            uart.ser.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()

