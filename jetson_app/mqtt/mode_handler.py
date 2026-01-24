# mqtt/mode_handler.py

from pathlib import Path
from config_loader import load_json, save_json
from mqtt.ack_builder import build_ack

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_mode_update(payload: dict) -> dict:
    """
    MODE_UPDATE 처리
    - setting.json의 mode 갱신
    - ACK 반환
    """

    if payload.get("type") != "MODE_UPDATE":
        raise ValueError("Invalid message type")

    mode = payload.get("mode")
    if mode not in ("AUTO", "MANUAL"):
        raise ValueError("Invalid mode")

    setting = load_json(SETTING_PATH)

    # 이미 같은 모드면 ACK만 (멱등)
    if setting.get("mode") == mode:
        return build_ack(ref_payload=payload, status="OK")

    # mode 갱신
    setting["mode"] = mode
    save_json(SETTING_PATH, setting)

    ack = build_ack(
        ref_payload=payload,
        status="OK"
    )

    return ack
