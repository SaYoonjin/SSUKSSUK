# camera/camera_manager.py

import cv2
from pathlib import Path
from datetime import datetime
from typing import Dict


class CameraError(Exception):
    """카메라 관련 예외"""
    pass


class CameraManager:
    """듀얼 USB 카메라 관리자"""

    def __init__(self, config: dict):
        """
        config: config.json["camera"]
        {
            "top": {"device_id": 0, "width": 1920, "height": 1080},
            "side": {"device_id": 1, "width": 1920, "height": 1080},
            "capture_timeout_sec": 5
        }
        """
        self.top_config = config.get("top", {"device_id": 0, "width": 1920, "height": 1080})
        self.side_config = config.get("side", {"device_id": 1, "width": 1920, "height": 1080})
        self.timeout = config.get("capture_timeout_sec", 5)

    def capture_both(self, save_dir: Path) -> Dict[str, dict]:
        """
        TOP/SIDE 카메라로 촬영 후 저장

        Returns:
            {
                "TOP": {"path": "/path/to/top.jpg", "captured_at": "2026-01-30T10:00:00+09:00"},
                "SIDE": {"path": "/path/to/side.jpg", "captured_at": "2026-01-30T10:00:01+09:00"}
            }

        Raises:
            CameraError: 카메라 열기/촬영 실패 시
        """
        save_dir = Path(save_dir)
        save_dir.mkdir(parents=True, exist_ok=True)

        result = {}

        for name, cfg in [("TOP", self.top_config), ("SIDE", self.side_config)]:
            path, captured_at = self._capture_single(
                device_id=cfg["device_id"],
                width=cfg["width"],
                height=cfg["height"],
                save_path=save_dir / f"{name.lower()}.jpg"
            )
            result[name] = {
                "path": str(path),
                "captured_at": captured_at
            }

        return result

    def _capture_single(
        self,
        device_id: int,
        width: int,
        height: int,
        save_path: Path
    ) -> tuple:
        """
        단일 카메라 촬영

        Returns:
            (save_path, captured_at_iso)

        Raises:
            CameraError
        """
        cap = cv2.VideoCapture(device_id)

        if not cap.isOpened():
            raise CameraError(f"Failed to open camera {device_id}")

        try:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

            ret, frame = cap.read()
            captured_at = datetime.now().astimezone().isoformat()

            if not ret or frame is None:
                raise CameraError(f"Failed to capture from camera {device_id}")

            cv2.imwrite(str(save_path), frame)

            return save_path, captured_at

        finally:
            cap.release()
