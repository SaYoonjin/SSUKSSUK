# uart/threshold_sync.py

import struct
from uart.packet import CMD_SET_TH

def send_threshold(uart, ideal_ranges: dict):
    """
    ideal_ranges 예시:
    {
        "water_level": {"min": 10.0, "max": 60.0},
        "nutrient_conc": {"min": 0.0, "max": 900.0}
    }
    """

    payload = struct.pack(
        "<ffff",
        float(ideal_ranges["water_level"]["min"]),
        float(ideal_ranges["water_level"]["max"]),
        float(ideal_ranges["nutrient_conc"]["min"]),
        float(ideal_ranges["nutrient_conc"]["max"]),
    )

    uart.send_cmd(CMD_SET_TH, payload)
    print("[UART] CMD_SET_THRESHOLD sent")

