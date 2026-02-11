# telemetry/image_inference.py

import cv2
import numpy as np
import uuid
import os
import sys
from datetime import datetime
from ultralytics import YOLO

_inference_singleton = None

def get_inference_engine():
    global _inference_singleton
    if _inference_singleton is None:
        _inference_singleton = PlantInference(model_dir="models")
    return _inference_singleton
    
class PlantInference:
    def __init__(self, model_dir='models'):
        """초기화: 모델 로드 (Engine > ONNX > PT 순서)"""
        self.model = self._load_model(model_dir)

    def _load_model(self, model_dir):
        if os.path.exists(os.path.join(model_dir, 'best.engine')):
            print("[INFO] Loading TensorRT Engine...")
            path = os.path.join(model_dir, 'best.engine')
        elif os.path.exists(os.path.join(model_dir, 'best.onnx')):
            print("[INFO] Loading ONNX Model...")
            path = os.path.join(model_dir, 'best.onnx')
        else:
            print("[INFO] Loading PyTorch Model...")
            path = os.path.join(model_dir, 'best.pt')
        
        return YOLO(path, task='segment')

    def _iso_now(self):
        return datetime.now().astimezone().isoformat()

    def _calculate_discoloration(self, image, mask):
        """
        마스크 영역 내의 갈변/황변 비율 계산
        """
        # 배경 제거 (식물만 남김)
        plant_only = cv2.bitwise_and(image, image, mask=mask)
        hsv = cv2.cvtColor(plant_only, cv2.COLOR_BGR2HSV)
        
        # 노란색/갈색 범위 정의 (H: 10~30, S: 40~255, V: 40~255)
        # 환경에 따라 범위 튜닝이 필요할 수 있습니다.
        lower_yellow = np.array([10, 40, 40])
        upper_yellow = np.array([30, 255, 255])
        
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        
        yellow_pixels = cv2.countNonZero(yellow_mask)
        total_pixels = cv2.countNonZero(mask)
        
        if total_pixels == 0:
            return 0.0
            
        return (yellow_pixels / total_pixels) * 100

    def _get_diagnosis(self, ratio, height):
        """
        변색률(%)에 따른 상태 진단 및 메시지 생성
        """
        if height == 0:
            return "NOT_DETECTED", "식물이 감지되지 않았습니다."

        # 요청하신 기준표 반영
        if ratio >= 15.0:
            return "DANGER", "식물 상태가 위험합니다. 병든 잎을 잘라내거나 즉각적인 조치가 필요합니다."
        elif ratio >= 10.0:
            return "WARNING", "주의! 전체 잎의 10% 정도가 변색되었습니다. 영양제나 조명 확인이 필요합니다."
        elif ratio >= 5.0:
            return "ATTENTION", "잎 색이 조금 변하고 있어요. 물이 부족하지 않은지 확인해주세요."
        else:
            return "SAFE", "(알림 없음) 식물이 아주 건강합니다."

    def run_inference(self, serial_num, plant_id, top_img_path, side_img_path, top_img_data, side_img_data, top_time, side_time):
        """
        메인 추론 실행 함수
        """
        # Side 이미지 분석 (키, 너비, 변색률)
        results = self.model(side_img_data, verbose=False)
        result = results[0]
        h, w = side_img_data.shape[:2]

        # 기본값 초기화
        metrics = {
            "height": 0.0,
            "width": 0.0,
            "confidence": 0,
            "discoloration": 0.0
        }
        
        vis_img = side_img_data.copy()

        if result.masks is not None and len(result.masks) > 0:
            # 가장 큰 객체 1개 선택
            idx = 0
            mask = result.masks.data[idx].cpu().numpy()
            mask = cv2.resize(mask, (w, h))
            mask = (mask > 0.5).astype(np.uint8) * 255

            # 1. 키/너비 측정
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                cnt = max(contours, key=cv2.contourArea)
                rect = cv2.minAreaRect(cnt)
                (cx, cy), (d1, d2), angle = rect
                metrics["height"] = round(max(d1, d2), 2)
                metrics["width"] = round(min(d1, d2), 2)
                
                # 시각화 (박스)
                box = np.int32(cv2.boxPoints(rect))
                cv2.drawContours(vis_img, [box], 0, (0, 0, 255), 2)

            # 2. 변색률 측정
            metrics["discoloration"] = self._calculate_discoloration(side_img_data, mask)
            
            # 시각화 (텍스트)
            cv2.putText(vis_img, f"Ratio: {metrics['discoloration']:.1f}%", (30, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

            metrics["confidence"] = int(result.boxes.conf[idx].item() * 100)

        # 3. 진단 결과 생성
        status_code, diag_msg = self._get_diagnosis(metrics["discoloration"], metrics["height"])

        # 4. 최종 JSON 생성
        return {
            "msg_id": str(uuid.uuid4()),
            "sent_at": self._iso_now(),
            "serial_num": serial_num,
            "plant_id": plant_id,
            "type": "IMAGE_INFERENCE",
            
            # 측정 데이터
            "height": metrics['height'],
            "width": metrics['width'],
            "anomaly": int(metrics['discoloration']), # 0~100 정수형 점수
            "symptom_enum": status_code,              # SAFE, ATTENTION, WARNING, DANGER
            "confidence": metrics['confidence'],
            
            # 사용자 알림 메시지
            "diagnosis_message": diag_msg,
            
            # 이미지 1 (TOP)
            "image_kind1": "TOP",
            "public_url1": top_img_path,
            "measured_at1": top_time,
            
            # 이미지 2 (SIDE)
            "image_kind2": "SIDE",
            "public_url2": side_img_path,
            "measured_at2": side_time
        }, vis_img