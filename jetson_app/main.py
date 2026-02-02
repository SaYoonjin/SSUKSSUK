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
    TYPE_DATA,
    DATA_SENSOR,

    EVENT_WATER_LOW,
    EVENT_WATER_HIGH,
    EVENT_EC_LOW,
    EVENT_EC_HIGH,

    EVENT_WATER_RECOVERY_DONE,
    EVENT_NUTRI_RECOVERY_DONE,

    EVENT_WATER_ACTION_SUCCESS,
    EVENT_NUTRI_ACTION_SUCCESS,

    EVENT_WATER_PUMP_FAIL,
    EVENT_NUTRI_PUMP_FAIL,
    EVENT_SENSOR_FAIL,

    CMD_LED_OFF,
    CMD_PUMP_WATER_STOP,
    CMD_PUMP_NUTRI_STOP,
    CMD_AUTO_RECOVERY,
)


from uart.uart_manager import UARTManager
from mqtt.claim_handler import handle_claim_update
from mqtt.binding_handler import handle_binding_update
from mqtt.mode_handler import handle_mode_update
from mqtt.upload_url_handler import handle_upload_url

from telemetry.sensor_uplink import build_sensor_uplink
from telemetry.action_uplink import build_action_uplink
from led_scheduler import LEDScheduler
from config_loader import load_json


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
SETTING_PATH = BASE_DIR / "setting.json"

def bump_seq(setting: dict, key: str):
    setting["seq"][key] += 1

    # 즉시 파일에 반영 (중요)
    with open(SETTING_PATH, "w") as f:
        json.dump(setting, f, indent=2)

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
        client.subscribe(f"{control_base}/claim", qos=1)
        print(f"[MQTT] subscribed: claim")
    
        # CLAIMED일 때만 운영 토픽 추가 구독
        if setting["claim"]["claim_state"] == "CLAIMED":
            client.subscribe(f"{control_base}/binding", qos=1)
            client.subscribe(f"{control_base}/mode", qos=1)
            client.subscribe(f"{control_base}/upload-url", qos=1)
    
            print("[MQTT] subscribed: binding, mode, upload-url")

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
                client.publish(f"{telemetry_base}/ack", json.dumps(ack), qos=1)
    
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
                client.publish(f"{telemetry_base}/ack", json.dumps(ack), qos=1)
    
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
                client.publish(f"{telemetry_base}/ack", json.dumps(ack), qos=1)
                setting = load_json(SETTING_PATH)

            # ======================================================
            # UPLOAD_URL
            # ======================================================
            elif topic == f"{control_base}/upload-url":
                # ACK은 보내지 않음, IMAGE_INFERENCE만 발행 (handler 내부에서 처리)
                handle_upload_url(
                    payload,
                    mqtt_client=client,
                    telemetry_base=telemetry_base
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
            mode = setting["mode"]

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
                if pkt_type == TYPE_DATA and pkt_sub == DATA_SENSOR:
                    if binding_state != "BOUND" or claim_state != "CLAIMED":
                        continue
                    
                    temp_x10, humi_x10, ec, water = struct.unpack("<HHHH", raw)
                    
                    bump_seq(setting, "SENSOR_UPLINK")
                    
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

                    client.publish(f"{telemetry_base}/sensors", json.dumps(uplink), qos=1)
                    print("[MQTT] SENSOR_UPLINK sent")
                    continue

                # ================= EVENT =================
                if pkt_type != TYPE_EVENT:
                    continue
                
                if binding_state != "BOUND" or claim_state != "CLAIMED":
                    continue

                # ---- ACTION SUCCESS ----
                if pkt_sub in (EVENT_WATER_ACTION_SUCCESS, EVENT_NUTRI_ACTION_SUCCESS):
                    action_type = (
                        "WATER_ADD"
                        if pkt_sub == EVENT_WATER_ACTION_SUCCESS
                        else "NUTRI_ADD"
                    )
                    
                    bump_seq(setting, "ACTION_RESULT")

                    action_uplink = build_action_uplink(
                        serial_num=serial,
                        plant_id=setting["binding"]["plant_id"],
                        action_type=action_type,
                        result_status="SUCCESS",
                        error_code=None,
                        error_message=None,
                    )
                
                    client.publish(
                        f"{telemetry_base}/action-result",
                        json.dumps(action_uplink),
                        qos=1,
                    )
                    print("[ACTION_RESULT] SUCCESS sent:", action_type)
                    continue

                    
                # ---- RECOVERY DONE ----
                if pkt_sub in (EVENT_WATER_RECOVERY_DONE, EVENT_NUTRI_RECOVERY_DONE):
                    trigger = (
                        "WATER_LEVEL"
                        if pkt_sub == EVENT_WATER_RECOVERY_DONE
                        else "NUTRIENT_CONC"
                    )
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
                        event_kind="RECOVERY_DONE",
                        trigger_sensor_type=trigger,
                    )
                
                    client.publish(
                        f"{telemetry_base}/sensors",
                        json.dumps(uplink),
                        qos=1,
                    )
                    print("[EVENT] RECOVERY_DONE sent:", trigger)
                    continue

                    
                # ---- ACTION FAIL ----
                if pkt_sub in (
                    EVENT_WATER_PUMP_FAIL,
                    EVENT_NUTRI_PUMP_FAIL,
                ):
                    if pkt_sub == EVENT_WATER_PUMP_FAIL:
                        action_type = "WATER_ADD"
                    elif pkt_sub == EVENT_NUTRI_PUMP_FAIL:
                        action_type = "NUTRI_ADD"
                    else:
                        continue
                    
                    bump_seq(setting, "ACTION_RESULT")
                
                    action_uplink = build_action_uplink(
                        serial_num=serial,
                        plant_id=setting["binding"]["plant_id"],
                        action_type=action_type,
                        result_status="FAIL",
                        error_code=int(pkt_sub),
                        error_message="auto recovery failed",
                    )
                
                    client.publish(
                        f"{telemetry_base}/action-result",
                        json.dumps(action_uplink),
                        qos=1,
                    )
                    print("[ACTION_RESULT] FAIL sent:", action_type)
                    continue
                    
                if pkt_sub == EVENT_SENSOR_FAIL:
                    print("[WARN] SENSOR_FAIL ignored (not an action result)")
                    continue
                
                # ---- WATER / EC LOW or HIGH ----
                if pkt_sub not in (
                    EVENT_WATER_LOW, 
                    EVENT_WATER_HIGH, 
                    EVENT_EC_LOW, 
                    EVENT_EC_HIGH,
                ):
                    continue
                
                bump_seq(setting, "SENSOR_UPLINK")
                
                if pkt_sub in (EVENT_WATER_LOW, EVENT_WATER_HIGH):
                    trigger = "WATER_LEVEL"
                else:
                    trigger = "NUTRIENT_CONC"

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
                    event_kind="ANOMALY_DETECTED",
                    trigger_sensor_type=trigger,
                )
                client.publish(
                    f"{telemetry_base}/sensors",
                    json.dumps(uplink),
                    qos=1,
                )
                print("[EVENT] ANOMALY_DETECTED sent:", trigger)
                    
                # AUTO면 센서 이벤트마다 허가(STM이 내부에서 개별 처리/무시/큐잉)
                is_low_event = pkt_sub in (EVENT_WATER_LOW, EVENT_EC_LOW)

                if mode == "AUTO" and is_low_event:
                    uart.send_cmd(CMD_AUTO_RECOVERY)
                    print("[AUTO] CMD_AUTO_RECOVERY sent for", trigger)

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
