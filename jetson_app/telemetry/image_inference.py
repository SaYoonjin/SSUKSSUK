# telemetry/image_inference.py

import uuid
from datetime import datetime


def iso_now() -> str:
    """로컬 시간 기준 ISO8601"""
    return datetime.now().astimezone().isoformat()


def build_image_inference(
    *,
    serial_num: str,
    plant_id,
    image_top: dict,
    image_side: dict,
    # === TODO: 추론 기능 구현 시 아래 필드 채우기 ===
    # 현재 모델이 없어 모든 추론 필드는 null로 반환
    # - height: 식물 높이 (float)
    # - width: 식물 너비 (float)
    # - anomaly: 이상치 점수 (int)
    # - symptom_enum: 증상 열거형 (str) 예: "LEAF_YELLOWING"
    # - confidence: 신뢰도 (int)
    height=None,
    width=None,
    anomaly=None,
    symptom_enum=None,
    confidence=None
) -> dict:
    """
    IMAGE_INFERENCE 메시지 빌드

    Args:
        serial_num: 기기 시리얼 번호
        plant_id: 식물 ID
        image_top: {"public_url": "...", "measured_at": "..."}
        image_side: {"public_url": "...", "measured_at": "..."}

    Returns:
        IMAGE_INFERENCE 메시지 dict
    """
    return {
        "msg_id": str(uuid.uuid4()),
        "sent_at": iso_now(),
        "serial_num": serial_num,
        "plant_id": plant_id,
        "type": "IMAGE_INFERENCE",

        # === 추론 결과 (TODO: 모델 구현 후 채우기) ===
        "height": height,
        "width": width,
        "anomaly": anomaly,
        "symptom_enum": symptom_enum,
        "confidence": confidence,

        # TOP 이미지
        "image_kind1": "TOP",
        "public_url1": image_top.get("public_url"),
        "measured_at1": image_top.get("measured_at"),

        # SIDE 이미지
        "image_kind2": "SIDE",
        "public_url2": image_side.get("public_url"),
        "measured_at2": image_side.get("measured_at"),
    }
