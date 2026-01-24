from pathlib import Path
import time
from struct import pack
from config_loader import load_json, save_json
from mqtt.ack_builder import build_ack
from uart.packet import CMD_SET_TH
from uart.packet import CMD_REQ_SENSOR

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_binding_update(payload: dict, uart):
    """
    BINDING_UPDATE 처리

    동작:
    - setting.json 갱신
    - STM32에 CMD_SET_TH 전송 (항상)
    - 신규 바인딩일 때만 ACK 생성

    return:
      ack (dict | None)
    """

    # 1️⃣ payload 검증
    if payload.get("type") != "BINDING_UPDATE":
        raise ValueError("Invalid message type")

    binding_state = payload.get("binding_state")
    if binding_state not in ("BOUND", "UNBOUND"):
        raise ValueError("Invalid binding_state")

    # 2️⃣ 기존 setting 로드
    setting = load_json(SETTING_PATH)

    prev_plant_id = setting["binding"].get("plant_id")
    new_plant_id = payload.get("plant_id")

    # 신규 바인딩 여부 판단
    is_new_binding = (binding_state == "BOUND" and prev_plant_id != new_plant_id)

    # 3️⃣ setting.json 갱신
    if binding_state == "BOUND":
        setting["binding"]["plant_id"] = new_plant_id
        setting["binding"]["binding_state"] = "BOUND"
        setting["binding"]["species"] = payload.get("species")

        for key, value in payload.get("ideal_ranges", {}).items():
            if key in setting["binding"]["ideal_ranges"]:
                setting["binding"]["ideal_ranges"][key]["min"] = value.get("min")
                setting["binding"]["ideal_ranges"][key]["max"] = value.get("max")

    else:  # UNBOUND
        setting["binding"]["plant_id"] = None
        setting["binding"]["binding_state"] = "UNBOUND"
        setting["binding"]["species"] = None

        for key in setting["binding"]["ideal_ranges"]:
            setting["binding"]["ideal_ranges"][key]["min"] = None
            setting["binding"]["ideal_ranges"][key]["max"] = None

    save_json(SETTING_PATH, setting)

    # 4️⃣ STM32 threshold 전송 (BOUND일 때만)
    if binding_state == "BOUND":
        ir = setting["binding"]["ideal_ranges"]

        payload_th = pack(
            "<ffff",
            ir["water_level"]["min"],
            ir["water_level"]["max"],
            ir["nutrient_conc"]["min"],
            ir["nutrient_conc"]["max"],
        )

        uart.send_cmd(CMD_SET_TH, payload_th)
        print("[UART] CMD_SET_THRESHOLD sent")
        
        time.sleep(0.05)
        
        uart.send_cmd(CMD_REQ_SENSOR)
        print("[UART] CMD_REQ_SENSOR sent (initial sensing)")

    # 5️⃣ ACK는 "신규 바인딩"일 때만
    if is_new_binding:
        ack = build_ack(ref_payload=payload, status="OK")
        return ack
    else:
        return None
