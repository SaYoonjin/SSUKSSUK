# mqtt/upload_url_handler.py

import json
import os
from pathlib import Path
from datetime import datetime

from config_loader import load_json
from mqtt.ack_builder import build_ack
from camera.camera_manager import CameraManager, CameraError
from uploader.s3_uploader import S3Uploader, UploadError
from telemetry.image_inference import build_image_inference

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"


def _delete_files(paths: list):
    """로컬 파일 삭제"""
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
                print(f"[UPLOAD_URL] deleted: {p}")
        except Exception as e:
            print(f"[UPLOAD_URL] failed to delete {p}: {e}")


def handle_upload_url(payload: dict, mqtt_client, telemetry_base: str) -> dict:
    """
    UPLOAD_URL 처리

    1. 카메라 촬영 (TOP, SIDE)
    2. data 폴더에 저장
    3. Presigned URL로 S3 업로드
    4. 업로드 후 로컬 파일 삭제
    5. IMAGE_INFERENCE 메시지 발행
    6. ACK 반환

    Args:
        payload: UPLOAD_URL 메시지
        mqtt_client: MQTT 클라이언트 (IMAGE_INFERENCE 발행용)
        telemetry_base: telemetry 베이스 토픽 (예: "devices/{serial}/telemetry")

    Returns:
        ACK dict
    """

    captured_paths = []  # 촬영된 파일 경로 (삭제용)

    try:
        # =========================
        # 1) payload 검증
        # =========================
        if payload.get("type") != "UPLOAD_URL":
            raise ValueError("Invalid message type")

        items = payload.get("items")
        if not items or not isinstance(items, list):
            raise ValueError("Missing or invalid items")

        # items에서 TOP/SIDE 추출
        url_map = {}
        for item in items:
            view_type = item.get("view_type")
            if view_type in ("TOP", "SIDE"):
                url_map[view_type] = {
                    "upload_url": item.get("upload_url"),
                    "object_key": item.get("object_key"),
                    "headers": item.get("headers", {"Content-Type": "image/jpeg"})
                }

        if "TOP" not in url_map or "SIDE" not in url_map:
            raise ValueError("Missing TOP or SIDE in items")

        plant_id = payload.get("plant_id")
        serial_num = payload.get("serial_num")

        # =========================
        # 2) config 로드
        # =========================
        config = load_json(CONFIG_PATH)

        data_dir = Path(config["storage"]["data_dir"])
        camera_config = config.get("camera", {})
        upload_config = config.get("upload", {})

        # =========================
        # 3) 저장 경로 생성
        # =========================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_dir = data_dir / "images" / str(plant_id or "unknown") / timestamp

        # =========================
        # 4) 카메라 촬영
        # =========================
        camera = CameraManager(camera_config)
        captured = camera.capture_both(save_dir)

        captured_paths = [captured["TOP"]["path"], captured["SIDE"]["path"]]
        print(f"[UPLOAD_URL] captured: {captured_paths}")

        # =========================
        # 5) S3 업로드
        # =========================
        uploader = S3Uploader(upload_config)

        upload_results = {}

        for view_type in ["TOP", "SIDE"]:
            local_path = captured[view_type]["path"]
            captured_at = captured[view_type]["captured_at"]
            url_info = url_map[view_type]

            public_url = uploader.upload(
                file_path=local_path,
                presigned_url=url_info["upload_url"],
                headers=url_info["headers"]
            )

            # object_key를 public_url로 사용 (서버가 제공한 경로)
            upload_results[view_type] = {
                "public_url": url_info["object_key"],
                "measured_at": captured_at
            }

        print(f"[UPLOAD_URL] uploaded to S3")

        # =========================
        # 6) 업로드 성공 후 로컬 파일 삭제
        # =========================
        _delete_files(captured_paths)

        # =========================
        # 7) IMAGE_INFERENCE 발행
        # =========================
        # === TODO: 추론 구현 후 아래 부분 수정 ===
        # 현재는 촬영/업로드만 수행하고 추론은 생략
        # inference_result = model.predict(captured_paths)
        # 아래 필드들을 채워넣기:
        # - height, width, anomaly, symptom_enum, confidence

        inference_msg = build_image_inference(
            serial_num=serial_num,
            plant_id=plant_id,
            image_top=upload_results["TOP"],
            image_side=upload_results["SIDE"],
            # 추론 필드는 null
            height=None,
            width=None,
            anomaly=None,
            symptom_enum=None,
            confidence=None
        )

        mqtt_client.publish(
            f"{telemetry_base}/image-inference",
            json.dumps(inference_msg),
            qos=1,
            retain=False
        )

        print("[UPLOAD_URL] IMAGE_INFERENCE published")

    except CameraError as e:
        print(f"[ERROR][UPLOAD_URL] camera failure: {e}")
        # 카메라 에러 시에도 촬영된 파일 삭제
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="CAMERA_ERROR",
            error_message=str(e)
        )

    except UploadError as e:
        print(f"[ERROR][UPLOAD_URL] upload failure: {e}")
        # 업로드 실패 시에도 로컬 파일 삭제
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="UPLOAD_ERROR",
            error_message=str(e)
        )

    except Exception as e:
        print(f"[ERROR][UPLOAD_URL] internal failure: {e}")
        # 기타 에러 시에도 로컬 파일 삭제
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="INTERNAL_ERROR",
            error_message=str(e)
        )

    # =========================
    # 8) 정상 처리 ACK
    # =========================
    return build_ack(
        ref_payload=payload,
        status="OK"
    )
