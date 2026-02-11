# mqtt/claim_handler.py

from pathlib import Path
from config_loader import load_json, save_json
from mqtt.ack_builder import build_ack

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_claim_update(payload: dict, uart) -> dict:
    """
    CLAIM_UPDATE 처리 (CLAIMED / UNCLAIMED 모두)

    - setting.json 업데이트
    - CLAIMED일 때만 STM32 CMD_READY 전송
    - setting 저장 실패 시 INTERNAL_ERROR ACK
    - 항상 ACK 반환
    """

    # =========================
    # 1) payload 검증 (입력 오류)
    # =========================
    if payload.get("type") != "CLAIM_UPDATE":
        raise ValueError("Invalid message type")

    claim_state = payload.get("claim_state")
    if claim_state not in ("CLAIMED", "UNCLAIMED"):
        raise ValueError("Invalid claim_state")

    # =========================
    # 2) 실제 상태 변경 (내부 오류 가능)
    # =========================
    try:
        setting = load_json(SETTING_PATH)

        if claim_state == "CLAIMED":
            # 멱등 허용
            setting["claim"]["claim_state"] = "CLAIMED"
            setting["claim"]["user_id"] = payload.get("user_id")

            # mode가 null일 수도 있으니 fallback
            setting["mode"] = (
                payload.get("mode")
                or setting.get("mode")
                or "MANUAL"
            )

            save_json(SETTING_PATH, setting)


        else:  # UNCLAIMED
            # 기기 해제 시 전체 안전 초기화
            setting["claim"]["claim_state"] = "UNCLAIMED"
            setting["claim"]["user_id"] = None
            setting["mode"] = "AUTO"  # 정책값

            setting["binding"]["binding_state"] = "UNBOUND"
            setting["binding"]["plant_id"] = None
            setting["binding"]["species"] = None
            setting["binding"]["led_time"]["start"] = None
            setting["binding"]["led_time"]["end"] = None

            for k in setting["binding"]["ideal_ranges"]:
                setting["binding"]["ideal_ranges"][k]["min"] = None
                setting["binding"]["ideal_ranges"][k]["max"] = None

            save_json(SETTING_PATH, setting)

            # 여기서 안전 명령 필요하면 추가 가능
            # uart.send_cmd(CMD_LED_OFF)
            # uart.send_cmd(CMD_PUMP_STOP)

    except Exception as e:
        # =========================
        # 🚨 내부 오류 → 500 ACK
        # =========================
        print(f"[ERROR][CLAIM] internal failure: {e}")
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
