# tools/data_req_test.py
import sys
from pathlib import Path
import time
import struct

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from uart.uart_manager import UARTManager
from uart.packet import CMD_READY, CMD_REQ_SENSOR


def main():
    uart = UARTManager("/dev/ttyTHS1", 115200)

    # STM32 READY
    uart.send_cmd(CMD_READY)
    print("[TEST] CMD_READY sent")

    time.sleep(0.5)

    try:
        while True:
            # 센서 요청
            uart.send_cmd(CMD_REQ_SENSOR)
            print("[TEST] CMD_REQ_SENSOR sent")

            t0 = time.time()
            while time.time() - t0 < 1.0:
                packets = uart.poll()
                for pkt in packets:
                    if pkt["type"] == 0x02 and pkt["subtype"] == 0x01:
                        raw = pkt["payload"]
                        temp_x10, humi_x10, ec, water = struct.unpack("<HHHH", raw)

                        print(
                            f"[SENSOR] "
                            f"T={temp_x10/10:.1f}°C | "
                            f"H={humi_x10/10:.1f}% | "
                            f"W={water:.1f}% | "
                            f"EC={ec:.1f}"
                        )
                        break

                time.sleep(0.05)

            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[TEST] exit")

if __name__ == "__main__":
    main()

