# led_scheduler.py
from datetime import datetime
from uart.packet import CMD_LED_ON, CMD_LED_OFF


class LEDScheduler:
    def __init__(self, uart):
        self.uart = uart
        self.last_state = None  # "ON" | "OFF"
        
    def reset(self):
        # 외부에서 LED 상태를 강제로 바꿨을 때 호출
        self.last_state = None

    def _in_window(self, hour, start, end):
        if start is None or end is None:
            return False
        if start == end:
            return False
        if start < end:
            return start <= hour < end
        else:
            return hour >= start or hour < end

    def apply(self, setting: dict, now: datetime | None = None):
        if now is None:
            now = datetime.now()

        binding = setting.get("binding", {})
        if binding.get("binding_state") != "BOUND":
            self._off()
            return

        led = binding.get("led_time", {})
        start = led.get("start")
        end = led.get("end")

        should_on = self._in_window(now.hour, start, end)

        if should_on:
            self._on()
        else:
            self._off()

    def _on(self):
        if self.last_state == "ON":
            return
        self.uart.send_cmd(CMD_LED_ON)
        print("[LED] CMD_LED_ON sent")
        self.last_state = "ON"

    def _off(self):
        if self.last_state == "OFF":
            return
        self.uart.send_cmd(CMD_LED_OFF)
        print("[LED] CMD_LED_OFF sent")
        self.last_state = "OFF"

