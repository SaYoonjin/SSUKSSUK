# uploader/s3_uploader.py

import requests
from pathlib import Path
import time


class UploadError(Exception):
    """S3 업로드 관련 예외"""
    pass


class S3Uploader:
    """Presigned URL을 사용한 S3 업로더"""

    def __init__(self, config: dict):
        """
        config: config.json["upload"]
        {
            "timeout_sec": 30,
            "retry_count": 3,
            "retry_delay_sec": 1
        }
        """
        self.timeout = config.get("timeout_sec", 30)
        self.retry_count = config.get("retry_count", 3)
        self.retry_delay = config.get("retry_delay_sec", 1)

    def upload(self, file_path: str, presigned_url: str, headers: dict = None) -> str:
        """
        파일을 Presigned URL로 S3에 업로드

        Args:
            file_path: 로컬 파일 경로
            presigned_url: S3 Presigned PUT URL
            headers: HTTP 헤더 (예: {"Content-Type": "image/jpeg"})

        Returns:
            object_key (presigned URL에서 쿼리스트링 제거한 경로)

        Raises:
            UploadError: 업로드 실패 시 (재시도 후에도 실패)
        """
        path = Path(file_path)

        if not path.exists():
            raise UploadError(f"File not found: {file_path}")

        with open(path, "rb") as f:
            data = f.read()

        if headers is None:
            headers = {"Content-Type": "image/jpeg"}

        last_error = None

        for attempt in range(self.retry_count):
            try:
                response = requests.put(
                    presigned_url,
                    data=data,
                    headers=headers,
                    timeout=self.timeout
                )

                if response.status_code in (200, 204):
                    # presigned URL에서 쿼리스트링 제거하여 object_key 반환
                    object_url = presigned_url.split("?")[0]
                    return object_url

                last_error = UploadError(
                    f"Upload failed: HTTP {response.status_code} - {response.text[:100]}"
                )

            except requests.RequestException as e:
                last_error = UploadError(f"Upload failed: {e}")

            if attempt < self.retry_count - 1:
                print(f"[S3] upload retry {attempt + 1}/{self.retry_count}")
                time.sleep(self.retry_delay)

        raise last_error
