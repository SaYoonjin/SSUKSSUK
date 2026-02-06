# config_loader.py

import json
import os
from pathlib import Path
from typing import Dict


class ConfigError(Exception):
    """Config / Setting 파일 관련 예외"""
    pass


def load_json(path: Path) -> Dict:
    """
    JSON 파일 로드
    - 파일 없음 / JSON 깨짐 → 예외 발생
    """
    if not path.exists():
        raise ConfigError(f"Config file not found: {path}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON format: {path}") from e
    except Exception as e:
        raise ConfigError(f"Failed to load config: {path}") from e


def save_json(path: Path, data: Dict):
    """
    JSON 파일 저장 (atomic write)
    - tmp 파일에 먼저 쓰고 rename
    - 전원 차단 시 파일 깨짐 방지
    """
    path = Path(path)
    tmp_path = path.with_suffix(path.suffix + ".tmp")

    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())

        # atomic replace
        tmp_path.replace(path)

    except Exception as e:
        raise ConfigError(f"Failed to save config: {path}") from e

