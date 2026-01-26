# mqtt/claim_handler.py

from pathlib import Path
from config_loader import load_json, save_json
from uart.packet import CMD_READY
from mqtt.envelope import build_envelope, generate_msg_id
from mqtt.ack_builder import build_ack

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_claim_update(payload: dict, uart) -> dict:
    """
    UNCLAIMED 상태에서 CLAIM_UPDATE 처리
    - setting.json 업데이트
    - STM32 CMD_READY 전송
    - 공통 Envelope 기반 ACK 생성
    """

    # 1️⃣ payload 기본 검증
    if payload.get("type") != "CLAIM_UPDATE":
        raise ValueError("Invalid message type")

    if payload.get("claim_state") != "CLAIMED":
        raise ValueError("Invalid claim_state")

    # 2️⃣ setting.json 로드
    setting = load_json(SETTING_PATH)

    if setting["claim"]["claim_state"] == "CLAIMED":
        raise ValueError("Already claimed")

    # 3️⃣ setting.json 업데이트
    setting["claim"]["claim_state"] = "CLAIMED"
    setting["claim"]["user_id"] = payload.get("user_id")

    setting["mode"] = payload.get("mode", "MANUAL")

    save_json(SETTING_PATH, setting)

    # 4️⃣ STM32 READY 전송
    uart.send_cmd(CMD_READY)
    
    # 5️⃣ ACK 생성 (공통 Envelope 규칙)
    ack = build_ack(
			ref_payload=payload,
			status="OK"
			)

    return ack

