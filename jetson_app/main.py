# main.py

import json
import time
import struct
from pathlib import Path
from datetime import datetime, timedelta

import paho.mqtt.client as mqtt

from uart.uart_manager import UARTManager
from uart.packet import CMD_READY
from uart.packet import CMD_REQ_SENSOR
from mqtt.claim_handler import handle_claim_update
from mqtt.binding_handler import handle_binding_update
from mqtt.mode_handler import handle_mode_update

from telemetry.sensor_uplink import build_sensor_uplink

from config_loader import load_json


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"


def is_new_hour(now, last_hour):
    if last_hour is None:
        return True
    return now.hour != last_hour


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
    client = mqtt.Client(
        client_id=client_id,
        # transport=broker.get("transport", "tcp")
        transport="websockets"
    )


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
        if rc == 0:
            print("[MQTT] connected")
            subscribe_by_state()
        else:
            print(f"[MQTT] connect failed rc={rc}")


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

        # ( upload-url 핸들러는 이후 단계에서 추가)
        elif msg.topic == f"{base}/binding":
          try:
              ack = handle_binding_update(payload, uart)
      
              if ack:
                  client.publish(
                      f"{base}/ack",
                      json.dumps(ack),
                      qos=1,
                      retain=False
                  )
                  print("[MQTT] binding ACK sent (new binding)")
              else:
                  print("[INFO] binding re-applied (retain, no ACK)")
      
              # 🔄 최신 setting 반영
              setting = load_json(SETTING_PATH)
      
          except Exception as e:
              print(f"[ERROR] binding handling failed: {e}")
                
        # =====================
        # ✅ MODE_UPDATE 처리
        # =====================
        elif msg.topic == f"{base}/mode":
            try:
                ack = handle_mode_update(payload)
    
                client.publish(
                    f"{base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False
                )
    
                print(f"[MQTT] MODE_UPDATE ACK sent ({payload.get('mode')})")
    
                # 🔄 최신 setting 반영
                setting = load_json(SETTING_PATH)
    
            except Exception as e:
                print(f"[ERROR] mode handling failed: {e}")


    client.on_connect = on_connect
    client.on_message = on_message

    # 4. MQTT 연결
    # TLS 설정 (443 + WSS)
    if config["mqtt"]["tls"]["enabled"]:
        client.tls_set()
        client.tls_insecure_set(True)
    
    # WebSocket path
    client.ws_set_options(
        path=config["mqtt"].get("ws_path", "/mqtt")
    )
    
    client.on_connect = on_connect
    client.on_message = on_message
    
    client.connect(
        broker["host"],
        broker["port"],
        broker["keepalive_sec"]
    )
    
    last_hour_sent = None
    
    client.loop_start()

    try:
        while True:

            # =========================
            # 1️⃣ UART 수신 처리
            # =========================
            packets = uart.poll()
    
            for pkt in packets:
                if pkt["type"] == 0x02 and pkt["subtype"] == 0x01:
                    raw = pkt["payload"]
    
                    temp_x10, humi_x10, ec, water = struct.unpack("<HHHH", raw)
    
                    values = {
                        "temperature": temp_x10 / 10.0,
                        "humidity": humi_x10 / 10.0,
                        "water_level": float(water),
                        "nutrient_conc": float(ec),
                    }
    
                    uplink = build_sensor_uplink(
                        serial_num=serial,
                        plant_id=setting["binding"]["plant_id"],
                        values=values,
                        event_kind="PERIODIC",
                        trigger_sensor_type=None
                    )
    
                    client.publish(
                        f"devices/{serial}/telemetry/sensors",
                        json.dumps(uplink),
                        qos=1,
                        retain=False
                    )
    
                    print("[MQTT] SENSOR_UPLINK sent")
    
            # =========================
            # 2️⃣ 정각 스케줄러
            # =========================
            now = datetime.now()

            if (
                setting["binding"]["binding_state"] == "BOUND"
                and now.minute == 0
                and last_hour_sent != now.hour
            ):
                uart.send_cmd(CMD_REQ_SENSOR)
                last_hour_sent = now.hour
    
                print(f"[SCHED] CMD_REQ_SENSOR sent at {now.strftime('%H:%M')}")
    
            # =========================
            # 3️⃣ 루프 속도 제한
            # =========================
            time.sleep(0.2)
    
    except KeyboardInterrupt:
        print("exit")


if __name__ == "__main__":
    main()
