from pathlib import Path
from config_loader import load_json, save_json
from mqtt.ack_builder import build_ack

BASE_DIR = Path(__file__).resolve().parent.parent
SETTING_PATH = BASE_DIR / "setting.json"


def handle_binding_update(payload: dict) -> dict:
    """
    BINDING_UPDATE 처리
    - setting.json의 binding 섹션 갱신
    - 공통 ACK 반환
    """

    # 1️⃣ payload 기본 검증
    if payload.get("type") != "BINDING_UPDATE":
        raise ValueError("Invalid message type")

    binding_state = payload.get("binding_state")
    if binding_state not in ("BOUND", "UNBOUND"):
        raise ValueError("Invalid binding_state")

    # 2️⃣ setting.json 로드
    setting = load_json(SETTING_PATH)

    # 3️⃣ binding 처리
    if binding_state == "BOUND":
        setting["binding"]["plant_id"] = payload["plant_id"]
        setting["binding"]["binding_state"] = "BOUND"
        setting["binding"]["species"] = payload.get("species")

        # ideal_ranges 부분 업데이트 (부분만!)
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

    # 4️⃣ setting.json 저장 (atomic)
    save_json(SETTING_PATH, setting)

    # 5️⃣ ACK 생성 (공통 빌더 사용)
    ack = build_ack(
        ref_payload=payload,
        status="OK"
    )

    return ack

