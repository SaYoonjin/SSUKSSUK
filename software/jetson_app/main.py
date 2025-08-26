# main.py

import json
import paho.mqtt.client as mqtt
from pathlib import Path

from uart.uart_manager import UARTManager
from mqtt.claim_handler import handle_claim_update
from config_loader import load_json
from uart.packet import CMD_READY 

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"


def main():
    # 1. 설정 로드
    config = load_json(CONFIG_PATH)
    setting = load_json(SETTING_PATH)

    serial = config["device"]["serial_num"]
    broker = config["mqtt"]["broker"]

    client_id = broker["client_id"] or f"device-{serial}"

    # 2. UART 초기화
    uart = UARTManager(
        port=config["uart"]["port"],
        baudrate=config["uart"]["baudrate"]
    )

    # 3. MQTT 클라이언트 초기화
    client = mqtt.Client(client_id=client_id)

    def on_connect(client, userdata, flags, rc):
        print("[MQTT] connected")

        # UNCLAIMED 상태에서는 claim만 구독
        if setting["claim"]["claim_state"] == "UNCLAIMED":
            topic = f"devices/{serial}/control/claim"
            client.subscribe(topic, qos=1)
            print(f"[MQTT] subscribed: {topic}")
            
        # main.py (초기화 구간)
        elif setting["claim"]["claim_state"] == "CLAIMED":
            uart.send_cmd(CMD_READY)


    def on_message(client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
        except Exception:
            print("[MQTT] invalid json")
            return

        print(f"[MQTT] received: {msg.topic}")

        # CLAIM 처리
        if msg.topic.endswith("/control/claim"):
            try:
                ack = handle_claim_update(payload, uart)

                ack_topic = f"devices/{serial}/control/ack"
                client.publish(
                    ack_topic,
                    json.dumps(ack),
                    qos=1,
                    retain=False
                )

                print("[MQTT] ACK sent")

                # claim 이후 claim 토픽 unsubscribe
                client.unsubscribe(f"devices/{serial}/control/claim")
                print("[MQTT] unsubscribed claim")

            except Exception as e:
                print(f"[ERROR] claim handling failed: {e}")

    client.on_connect = on_connect
    client.on_message = on_message

    # 4. MQTT 연결
    client.connect(broker["host"], broker["port"], broker["keepalive_sec"])
    client.loop_forever()


if __name__ == "__main__":
    main()

