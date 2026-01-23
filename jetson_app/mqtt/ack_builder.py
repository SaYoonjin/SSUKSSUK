# mqtt/ack_builder.py

from typing import Optional
from mqtt.envelope import build_envelope, generate_msg_id


VALID_STATUS = {
    "OK",
    "DROPPED_DUPLICATE",
    "DROPPED_OLD_SEQ",
    "ERROR",
}


def build_ack(
    *,
    ref_payload: dict,
    status: str,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
) -> dict:
    """
    ACK 메시지 생성 (디바이스 → 서버)

    ref_payload: ACK의 대상이 되는 원본 메시지(payload)
    status: OK | DROPPED_DUPLICATE | DROPPED_OLD_SEQ | ERROR
    """

    if status not in VALID_STATUS:
        raise ValueError(f"Invalid ACK status: {status}")

    ack = build_envelope(
        msg_id=generate_msg_id("ack"),
        msg_type="ACK",
        serial_num=ref_payload["serial_num"],
        plant_id=ref_payload.get("plant_id"),
    )

    ack.update({
        "ref_msg_id": ref_payload["msg_id"],
        "ref_type": ref_payload["type"],
        "status": status,
        "error_code": error_code,
        "error_message": error_message,
    })

    return ack

