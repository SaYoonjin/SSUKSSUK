# jetson_app/telemetry/sensor_uplink.py

import uuid
from datetime import datetime

def iso_now():
    # 로컬 시간 기준 ISO8601 (timezone 포함)
    return datetime.now().astimezone().isoformat()


def build_sensor_uplink(
    *,
    serial_num: str,
    plant_id,
    values: dict,
    event_kind: str = "PERIODIC",
    trigger_sensor_type = None
):
    """
    values = {
        "temperature": float,
        "humidity": float,
        "water_level": float,
        "nutrient_conc": float
    }
    """

    payload = {
        "msg_id": str(uuid.uuid4()),
        "sent_at": iso_now(),
        "serial_num": serial_num,
        "plant_id": plant_id,
        "type": "SENSOR_UPLINK",

        "event_kind": event_kind,
        "trigger_sensor_type": trigger_sensor_type,

        "values": values,

        # P0: status는 전부 OK로 고정 (나중에 threshold 로직 붙임)
        "status": {
            "temperature": "OK",
            "humidity": "OK",
            "water_level": "OK",
            "nutrient_conc": "OK"
        }
    }

    return payload

