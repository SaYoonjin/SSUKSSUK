# mqtt/upload_url_handler.py

import json
import time
import os
import cv2
from pathlib import Path
from datetime import datetime

from config_loader import load_json
from mqtt.ack_builder import build_ack
from camera.camera_manager import CameraManager, CameraError
from uploader.s3_uploader import S3Uploader, UploadError
from telemetry.image_inference import PlantInference
from telemetry.image_inference import get_inference_engine
from uart.packet import CMD_LED_OFF

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


def handle_upload_url(payload: dict, mqtt_client, telemetry_base: str, uart, led_scheduler,) -> dict:

    """
    UPLOAD_URL 처리

    1. 카메라 촬영 (TOP, SIDE)
    2. data 폴더에 저장
    3. Presigned URL로 S3 업로드
    4. IMAGE_INFERENCE 메시지 발행 (추론 포함)
    5. 업로드 후 로컬 파일 삭제
    6. ACK 반환
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
        # ===== LED 잠시 OFF (촬영용) =====
        camera = CameraManager(camera_config)

        # LED OFF 직전까지는 카메라 준비 완료
        uart.send_cmd(CMD_LED_OFF)
        led_scheduler.reset()
        time.sleep(0.4)
        
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
        # 6) IMAGE_INFERENCE 추론 및 발행
        # (주의: 이미지를 읽어야 하므로 파일 삭제보다 먼저 실행)
        # =========================
        try:
            # 1. 모델 로드
            inference_engine = get_inference_engine()

            # 2. 로컬 이미지 읽기
            side_path = captured["SIDE"]["path"]
            top_path = captured["TOP"]["path"]
            
            side_img = cv2.imread(side_path)
            top_img = cv2.imread(top_path)

            if side_img is not None:
                # 3. 추론 실행
                inference_msg, _ = inference_engine.run_inference(
                    serial_num=serial_num,
                    plant_id=plant_id,
                    top_img_path=upload_results["TOP"]["public_url"],
                    side_img_path=upload_results["SIDE"]["public_url"],
                    top_img_data=top_img if top_img is not None else side_img,
                    side_img_data=side_img,
                    top_time=upload_results["TOP"]["measured_at"],
                    side_time=upload_results["SIDE"]["measured_at"]
                )

                # 4. MQTT 발행
                mqtt_client.publish(
                    f"{telemetry_base}/image-inference",
                    json.dumps(inference_msg, ensure_ascii=False),
                    qos=1,
                    retain=False
                )
                print("[UPLOAD_URL] IMAGE_INFERENCE published (with Diagnosis)")
            else:
                print("[ERROR][UPLOAD_URL] Failed to load Side image for inference")

        except Exception as e:
            print(f"[WARNING][UPLOAD_URL] Inference failed (Skipping): {e}")

        # =========================
        # 7) 업로드 및 분석 완료 후 로컬 파일 삭제
        # =========================
        _delete_files(captured_paths)

    except CameraError as e:
        print(f"[ERROR][UPLOAD_URL] camera failure: {e}")
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="CAMERA_ERROR",
            error_message=str(e)
        )

    except UploadError as e:
        print(f"[ERROR][UPLOAD_URL] upload failure: {e}")
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="UPLOAD_ERROR",
            error_message=str(e)
        )

    except Exception as e:
        print(f"[ERROR][UPLOAD_URL] internal failure: {e}")
        _delete_files(captured_paths)
        return build_ack(
            ref_payload=payload,
            status="ERROR",
            error_code="INTERNAL_ERROR",
            error_message=str(e)
        )
    
    finally:
        # ===== LED 스케줄 복구 =====
        try:
            setting = load_json(SETTING_PATH)
            led_scheduler.apply(setting, datetime.now())
            print("[UPLOAD_URL] LED restored after capture")
        except Exception as e:
            print(f"[UPLOAD_URL][WARN] LED restore failed: {e}")
            

    # =========================
    # 8) 정상 처리 ACK
    # =========================
    return build_ack(
        ref_payload=payload,
        status="OK"
    )