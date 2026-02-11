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
    - setting 저장 실패 시 INTERNAL_ERROR ACK
    - 항상 ACK 반환
    """

    # =========================
    # 1) payload 검증 (입력 오류)
    # =========================
    if payload.get("type") != "MODE_UPDATE":
        raise ValueError("Invalid message type")

    mode = payload.get("mode")
    if mode not in ("AUTO", "MANUAL"):
        raise ValueError("Invalid mode")

    # =========================
    # 2) 실제 상태 변경 (내부 오류 가능)
    # =========================
    try:
        setting = load_json(SETTING_PATH)

        # 멱등 처리: 이미 같은 모드
        if setting.get("mode") == mode:
            return build_ack(
                ref_payload=payload,
                status="OK"
            )

        # mode 갱신
        setting["mode"] = mode
        save_json(SETTING_PATH, setting)

    except Exception as e:
        # =========================
        # 내부 오류 → 500 ACK
        # =========================
        print(f"[ERROR][MODE] internal failure: {e}")
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="INTERNAL_ERROR"
        )

    # =========================
    # 3) 정상 처리 ACK
    # =========================
    return build_ack(
        ref_payload=payload,
        status="OK"
    )
