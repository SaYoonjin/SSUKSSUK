# main.py

import json
from pathlib import Path

import paho.mqtt.client as mqtt

from uart.uart_manager import UARTManager
from uart.packet import CMD_READY
from mqtt.claim_handler import handle_claim_update
from mqtt.binding_handler import handle_binding_update

from config_loader import load_json


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"


def main():
    # 1. 설정 로드
    config = load_json(CONFIG_PATH)
    setting = load_json(SETTING_PATH)

    serial = config["device"]["serial_num"]
    broker = config["mqtt"]["broker"]
    client_id = broker["client_id"] or serial

    base = f"devices/{serial}/control"

    # 2. UART 초기화
    uart = UARTManager(
        port=config["uart"]["port"],
        baudrate=config["uart"]["baudrate"]
    )

    # 3. MQTT 클라이언트 초기화
    client = mqtt.Client(client_id=client_id)

    # =========================
    # 🔑 상태 기반 구독 함수
    # =========================
    def subscribe_by_state():
        nonlocal setting

        # UNCLAIMED → claim만
        if setting["claim"]["claim_state"] == "UNCLAIMED":
            topic = f"{base}/claim"
            client.subscribe(topic, qos=1)
            print(f"[MQTT] subscribed: {topic}")
            return

        # CLAIMED → 운영 토픽
        if setting["claim"]["claim_state"] == "CLAIMED":
            uart.send_cmd(CMD_READY)

            topics = [
                f"{base}/binding",
                f"{base}/mode",
                f"{base}/upload-url",
            ]

            for t in topics:
                client.subscribe(t, qos=1)

            print("[MQTT] subscribed: binding/mode/upload-url")

    # =========================
    # MQTT 콜백
    # =========================
    def on_connect(client, userdata, flags, rc):
        print("[MQTT] connected")
        subscribe_by_state()

    def on_message(client, userdata, msg):
        nonlocal setting

        try:
            payload = json.loads(msg.payload.decode())
        except Exception:
            print("[MQTT] invalid json")
            return

        print(f"[MQTT] received: {msg.topic}")

        # =====================
        # CLAIM 처리
        # =====================
        if msg.topic == f"{base}/claim":
            try:
                ack = handle_claim_update(payload, uart)

                client.publish(
                    f"{base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False
                )

                print("[MQTT] ACK sent")

                # claim 토픽 해제
                client.unsubscribe(f"{base}/claim")
                print("[MQTT] unsubscribed claim")

                # 🔄 최신 setting 다시 로드
                setting = load_json(SETTING_PATH)

                # 🔄 상태 기준 재구독
                subscribe_by_state()

            except Exception as e:
                print(f"[ERROR] claim handling failed: {e}")

        # ( mode / upload-url 핸들러는 이후 단계에서 추가)
        if msg.topic == f"{base}/binding":
          try:
              ack = handle_binding_update(payload)
  
              client.publish(
                  f"{base}/ack",
                  json.dumps(ack),
                  qos=1,
                  retain=False
              )
  
              print("[MQTT] binding ACK sent")
  
              # 🔄 최신 setting 반영
              setting = load_json(SETTING_PATH)
  
          except Exception as e:
              print(f"[ERROR] binding handling failed: {e}")

    client.on_connect = on_connect
    client.on_message = on_message

    # 4. MQTT 연결
    client.connect(
        broker["host"],
        broker["port"],
        broker["keepalive_sec"]
    )

    client.loop_forever()


if __name__ == "__main__":
    main()
