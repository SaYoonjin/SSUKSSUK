# jetson_app/telemetry/action_uplink.py

from mqtt.envelope import build_envelope, generate_msg_id


def build_action_uplink(
    *,
    serial_num: str,
    plant_id,
    action_type: str,
    result_status: str,
    error_code=None,
    error_message=None,
):
    """
    ACTION_RESULT uplink builder

    action_type:
      - "WATER_ADD"
      - "NUTRI_ADD"

    result_status:
      - "SUCCESS"
      - "FAIL"
    """

    envelope = build_envelope(
        msg_id=generate_msg_id("action"),
        msg_type="ACTION_RESULT",
        serial_num=serial_num,
        plant_id=plant_id,
    )

    payload = {
        **envelope,
        "action_type": action_type,
        "result_status": result_status,
        "error_code": error_code,
        "error_message": error_message,
    }

    return payload

