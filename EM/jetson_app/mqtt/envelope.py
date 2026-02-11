# mqtt/envelope.py

from datetime import datetime, timezone, timedelta
from uuid import uuid4
from typing import Optional

KST = timezone(timedelta(hours=9))


def now_kst_iso() -> str:
    """KST 기준 ISO8601 timestamp"""
    return datetime.now(KST).isoformat()


def generate_msg_id(prefix: Optional[str] = None) -> str:
    """
    msg_id 생성 (신규 메시지용)
    - 재전송 시에는 이 함수를 쓰지 말고 기존 msg_id를 재사용해야 함
    """
    uid = str(uuid4())
    return f"{prefix}-{uid}" if prefix else uid


def build_envelope(
    *,
    msg_id: str,
    msg_type: str,
    serial_num: str,
    plant_id=None
) -> dict:
    """
    공통 Envelope 생성

    ⚠️ msg_id는 반드시 외부에서 주입
    (멱등성 보장 책임은 caller에 있음)
    """
    return {
        "msg_id": msg_id,
        "sent_at": now_kst_iso(),
        "serial_num": serial_num,
        "plant_id": plant_id,
        "type": msg_type
    }

