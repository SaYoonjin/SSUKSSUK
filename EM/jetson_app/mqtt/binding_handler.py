# mqtt/binding_handler.py

from pathlib import Path
import time

from config_loader import load_json, save_json
from mqtt.ack_builder import build_ack

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_binding_update(payload: dict, uart):
    """
    BINDING_UPDATE 처리 (BOUND / UNBOUND 모두)

    정책:
    - plant_id 정합성 검증 ❌ (서버 책임)
    - setting.json 무조건 반영
    - BOUND일 때만 STM32 제어
    - 내부 오류만 ERROR ACK
    """

    # =========================
    # 1) payload 기본 검증
    # =========================
    if payload.get("type") != "BINDING_UPDATE":
        raise ValueError("Invalid message type")

    binding_state = payload.get("binding_state")
    if binding_state not in ("BOUND", "UNBOUND"):
        raise ValueError("Invalid binding_state")

    incoming_plant_id = payload.get("plant_id")

    try:
        # =========================
        # 2) 기존 setting 로드
        # =========================
        setting = load_json(SETTING_PATH)

        # =========================
        # 3) setting.json 갱신
        # =========================
        if binding_state == "BOUND":
            setting["binding"]["plant_id"] = incoming_plant_id
            setting["binding"]["binding_state"] = "BOUND"
            setting["binding"]["species"] = payload.get("species")

            # ideal_ranges 반영
            for key, value in payload.get("ideal_ranges", {}).items():
                if key in setting["binding"]["ideal_ranges"]:
                    setting["binding"]["ideal_ranges"][key]["min"] = value.get("min")
                    setting["binding"]["ideal_ranges"][key]["max"] = value.get("max")

            # led_time 반영
            led_time = payload.get("led_time") or {}
            setting["binding"]["led_time"]["start"] = led_time.get("start")
            setting["binding"]["led_time"]["end"] = led_time.get("end")

            save_json(SETTING_PATH, setting)

            time.sleep(0.05)


        else:  # UNBOUND
            setting["binding"]["plant_id"] = None
            setting["binding"]["binding_state"] = "UNBOUND"
            setting["binding"]["species"] = None

            for key in setting["binding"]["ideal_ranges"]:
                setting["binding"]["ideal_ranges"][key]["min"] = None
                setting["binding"]["ideal_ranges"][key]["max"] = None

            setting["binding"]["led_time"]["start"] = None
            setting["binding"]["led_time"]["end"] = None

            save_json(SETTING_PATH, setting)

            # STM32 안전 제어는 main.py에서 처리
            # (LED OFF / PUMP STOP)

    except Exception as e:
        print(f"[ERROR][BINDING] internal failure: {e}")
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="INTERNAL_ERROR"
        )

    # =========================
    # 5) 정상 처리 ACK
    # =========================
    return build_ack(
        ref_payload=payload,
        status="OK"
    )
