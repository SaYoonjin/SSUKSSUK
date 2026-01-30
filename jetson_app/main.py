# main.py

import json
import time
import struct
from pathlib import Path
from datetime import datetime

import paho.mqtt.client as mqtt

from uart.packet import (
    CMD_READY,
    CMD_REQ_SENSOR,
    TYPE_EVENT,
    EVENT_WATER_LOW,
    EVENT_EC_LOW,
    EVENT_RECOVERY_DONE,
    CMD_LED_OFF,
    CMD_PUMP_WATER_STOP,
    CMD_PUMP_NUTRI_STOP
)

from uart.uart_manager import UARTManager
from mqtt.claim_handler import handle_claim_update
from mqtt.binding_handler import handle_binding_update
from mqtt.mode_handler import handle_mode_update
from mqtt.upload_url_handler import handle_upload_url

from telemetry.sensor_uplink import build_sensor_uplink
from led_scheduler import LEDScheduler
from config_loader import load_json


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"


def main():
    # 초기 센서 1회 전송 제어
    boot_sensor_sent = False

    # MQTT 연결 플래그
    mqtt_connected = False

    # ==========================================================
    # 1. 설정 로드
    # ==========================================================
    config = load_json(CONFIG_PATH)
    setting = load_json(SETTING_PATH)

    serial = config["device"]["serial_num"]
    broker = config["mqtt"]["broker"]
    client_id = broker["client_id"] or serial

    control_base = f"devices/{serial}/control"
    telemetry_base = f"devices/{serial}/telemetry"

    # ==========================================================
    # 2. UART / LED 초기화 + READY (부팅 시 1회)
    # ==========================================================
    uart = UARTManager(
        port=config["uart"]["port"],
        baudrate=config["uart"]["baudrate"],
    )

    uart.send_cmd(CMD_READY)
    print("[UART] CMD_READY sent (boot)")

    led_scheduler = LEDScheduler(uart)

    # ==========================================================
    # 3. MQTT 초기화
    # ==========================================================
    client = mqtt.Client(
        client_id=client_id,
        transport="websockets",
    )

    # ==========================================================
    # 상태 기반 구독
    # ==========================================================
    def subscribe_by_state():
        nonlocal setting
    
        # claim은 항상 구독
        topic = f"{control_base}/claim"
        client.subscribe(topic, qos=1)
        print(f"[MQTT] subscribed: {topic}")
    
        # CLAIMED일 때만 운영 토픽 추가 구독
        if setting["claim"]["claim_state"] == "CLAIMED":
            topics = [
                f"{control_base}/binding",
                f"{control_base}/mode",
                f"{control_base}/upload-url",
            ]
    
            for t in topics:
                client.subscribe(t, qos=1)
    
            print("[MQTT] subscribed: binding/mode/upload-url")



    # ==========================================================
    # MQTT 콜백
    # ==========================================================
    def on_connect(_client, _userdata, _flags, rc):
        nonlocal mqtt_connected, setting

        if rc == 0:
            mqtt_connected = True
            print("[MQTT] connected")

            setting = load_json(SETTING_PATH)
            subscribe_by_state()
        else:
            print(f"[MQTT] connect failed rc={rc}")

    def on_message(_client, _userdata, msg):
        nonlocal setting, boot_sensor_sent

        if not msg.payload:
            return

        try:
            payload = json.loads(msg.payload.decode())
        except Exception:
            print(f"[MQTT][WARN] invalid json ignored: {msg.topic}")
            return
    
        topic = msg.topic
        
        try:
            # ======================================================
            # CLAIM_UPDATE
            # ======================================================
            if topic == f"{control_base}/claim":
                ack = handle_claim_update(payload, uart)
                client.publish(
                    f"{telemetry_base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False,
                )
    
                setting = load_json(SETTING_PATH)
                subscribe_by_state()
    
                if setting["claim"]["claim_state"] == "UNCLAIMED":
                    print("[CLAIM] UNCLAIMED → LED OFF, PUMP STOP")
    
                    boot_sensor_sent = False
                    uart.send_cmd(CMD_LED_OFF)
                    uart.send_cmd(CMD_PUMP_WATER_STOP)
                    uart.send_cmd(CMD_PUMP_NUTRI_STOP)
    
            # ======================================================
            # BINDING_UPDATE
            # ======================================================
            elif topic == f"{control_base}/binding":
                ack = handle_binding_update(payload, uart)
                client.publish(
                    f"{telemetry_base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False,
                )
    
                setting = load_json(SETTING_PATH)
    
                if setting["binding"]["binding_state"] == "BOUND":
                    print("[BINDING] BOUND → LED schedule apply")
                    boot_sensor_sent = False
                    last_led_min = None
                    led_scheduler.reset() 
                    led_scheduler.apply(setting, datetime.now())
    
                else:  # UNBOUND
                    print("[BINDING] UNBOUND → LED OFF, PUMP STOP")
                    boot_sensor_sent = False
                    last_led_min = None
                    led_scheduler.reset()
                    
                    uart.send_cmd(CMD_LED_OFF) 
                    uart.send_cmd(CMD_PUMP_WATER_STOP)
                    uart.send_cmd(CMD_PUMP_NUTRI_STOP)
    
            # ======================================================
            # MODE_UPDATE
            # ======================================================
            elif topic == f"{control_base}/mode":
                ack = handle_mode_update(payload)
                client.publish(
                    f"{telemetry_base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False,
                )
                setting = load_json(SETTING_PATH)

            # ======================================================
            # UPLOAD_URL
            # ======================================================
            elif topic == f"{control_base}/upload-url":
                ack = handle_upload_url(
                    payload,
                    mqtt_client=client,
                    telemetry_base=telemetry_base
                )
                client.publish(
                    f"{telemetry_base}/ack",
                    json.dumps(ack),
                    qos=1,
                    retain=False,
                )

            else:
                # 예상 못 한 토픽은 그냥 무시
                print(f"[MQTT][WARN] unexpected topic ignored: {topic}")
        except Exception as e:
            # 어떤 handler에서든 예외 발생 시 여기서 삼킨다
            print(f"[MQTT][ERROR] message handling failed, ignored: {e}")

    client.on_connect = on_connect
    client.on_message = on_message

    # ==========================================================
    # 4. MQTT 연결
    # ==========================================================
    if config["mqtt"]["tls"]["enabled"]:
        client.tls_set()
        client.tls_insecure_set(True)

    client.ws_set_options(
        path=config["mqtt"].get("ws_path", "/mqtt")
    )

    client.connect(
        broker["host"],
        broker["port"],
        broker["keepalive_sec"],
    )

    client.loop_start()

    last_hour_sent = None
    last_led_min = None

    try:
        while True:
            now = datetime.now()

            claim_state = setting["claim"]["claim_state"]
            binding_state = setting["binding"]["binding_state"]

            # ==================================================
            # LED 스케줄 (BOUND 상태만)
            # ==================================================
            if binding_state == "BOUND" and last_led_min != now.minute:
                led_scheduler.apply(setting, now)
                last_led_min = now.minute

            # ==================================================
            # 부팅 / 바인딩 직후 초기 센서 1회
            # ==================================================
            if (
                mqtt_connected
                and not boot_sensor_sent
                and claim_state == "CLAIMED"
                and binding_state == "BOUND"
            ):
                uart.send_cmd(CMD_REQ_SENSOR)
                boot_sensor_sent = True
                print("[INIT] CMD_REQ_SENSOR sent")

            # ==================================================
            # UART 수신 처리
            # ==================================================
            packets = uart.poll()
            ideal_ranges = setting.get("binding", {}).get("ideal_ranges", {})

            for pkt in packets:
                pkt_type = pkt["type"]
                pkt_sub = pkt["subtype"]
                raw = pkt["payload"]

                # ---------------- SENSOR (BOUND일 때만 uplink) ----------------
                if pkt_type == 0x02 and pkt_sub == 0x01:
                    if binding_state != "BOUND" or claim_state != "CLAIMED":
                        continue

                    temp_x10, humi_x10, ec, water = struct.unpack("<HHHH", raw)

                    uplink = build_sensor_uplink(
                        serial_num=serial,
                        plant_id=setting["binding"]["plant_id"],
                        values={
                            "temperature": temp_x10 / 10.0,
                            "humidity": humi_x10 / 10.0,
                            "water_level": float(water),
                            "nutrient_conc": float(ec),
                        },
                        ideal_ranges=ideal_ranges,
                        event_kind="PERIODIC",
                        trigger_sensor_type=None,
                    )

                    client.publish(
                        f"{telemetry_base}/sensors",
                        json.dumps(uplink),
                        qos=1,
                        retain=False,
                    )
                    print("[MQTT] SENSOR_UPLINK sent")

                # ---------------- EVENT (절대 수정 안 함) ----------------
                elif pkt_type == TYPE_EVENT:
                    temp_x10, humi_x10, ec, water = struct.unpack("<HHHH", raw)

                    if pkt_sub == EVENT_WATER_LOW:
                        kind, trigger = "ANOMALY_DETECTED", "WATER_LEVEL"
                    elif pkt_sub == EVENT_EC_LOW:
                        kind, trigger = "ANOMALY_DETECTED", "NUTRIENT_CONC"
                    elif pkt_sub == EVENT_RECOVERY_DONE:
                        kind, trigger = "RECOVERY_DONE", None
                    else:
                        continue

                    uplink = build_sensor_uplink(
                        serial_num=serial,
                        plant_id=setting["binding"]["plant_id"],
                        values={
                            "temperature": temp_x10 / 10.0,
                            "humidity": humi_x10 / 10.0,
                            "water_level": float(water),
                            "nutrient_conc": float(ec),
                        },
                        ideal_ranges=ideal_ranges,
                        event_kind=kind,
                        trigger_sensor_type=trigger,
                    )

                    if mqtt_connected and claim_state == "CLAIMED":
                        client.publish(
                            f"{telemetry_base}/sensors",
                            json.dumps(uplink),
                            qos=1,
                            retain=False,
                        )
                        print("[MQTT] EVENT uplink sent", kind)

            # ==================================================
            # 정기 센서 (1시간)
            # ==================================================
            if (
                claim_state == "CLAIMED"
                and binding_state == "BOUND"
                and now.minute == 0
                and last_hour_sent != now.hour
            ):
                uart.send_cmd(CMD_REQ_SENSOR)
                last_hour_sent = now.hour
                print(f"[SCHED] CMD_REQ_SENSOR sent at {now.strftime('%H:%M')}")

            time.sleep(0.2)

    except KeyboardInterrupt:
        print("[SYSTEM] KeyboardInterrupt")

    finally:
        print("[SHUTDOWN] LED OFF, PUMP STOP")
        try:
            led_scheduler.reset() 
            uart.send_cmd(CMD_LED_OFF)
            uart.send_cmd(CMD_PUMP_WATER_STOP)
            uart.send_cmd(CMD_PUMP_NUTRI_STOP)
        except Exception:
            pass

        client.loop_stop()
        client.disconnect()
        print("[SYSTEM] main.py terminated cleanly")


if __name__ == "__main__":
    main()
