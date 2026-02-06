# jetson_app/telemetry/sensor_uplink.py

import uuid
from datetime import datetime


def iso_now():
    # 로컬 시간 기준 ISO8601 (timezone 포함)
    return datetime.now().astimezone().isoformat()


def build_status(values: dict, ideal_ranges: dict):
    """
    values: {
        "temperature": float,
        "humidity": float,
        "water_level": float,
        "nutrient_conc": float
    }

    ideal_ranges: setting["binding"]["ideal_ranges"]

    status value:
      - "UP"    : value > max
      - "DOWN"  : value < min
      - "OK"    : min <= value <= max (또는 기준 없음)
    """

    status = {}

    for key, value in values.items():
        range_cfg = ideal_ranges.get(key)

        if not range_cfg:
            # 기준 없으면 OK
            status[key] = "OK"
            continue

        min_v = range_cfg.get("min")
        max_v = range_cfg.get("max")

        # min 기준
        if min_v is not None and value < min_v:
            status[key] = "DOWN"
            continue

        # max 기준
        if max_v is not None and value > max_v:
            status[key] = "UP"
            continue

        status[key] = "OK"

    return status


def build_sensor_uplink(
    *,
    serial_num: str,
    plant_id,
    values: dict,
    ideal_ranges: dict,
    event_kind: str = "PERIODIC",
    trigger_sensor_type=None
):
    """
    values = {
        "temperature": float,
        "humidity": float,
        "water_level": float,
        "nutrient_conc": float
    }
    """

    status = build_status(values, ideal_ranges)

    payload = {
        "msg_id": str(uuid.uuid4()),
        "sent_at": iso_now(),
        "serial_num": serial_num,
        "plant_id": plant_id,
        "type": "SENSOR_UPLINK",

        "event_kind": event_kind,
        "trigger_sensor_type": trigger_sensor_type,

        "values": values,
        "status": status
    }

    return payload
