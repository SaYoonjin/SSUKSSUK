# uart/uart_manager.py
import serial
from uart.parser import UARTParser
from uart.codec import build_packet, parse_packet

class UARTManager:
    def __init__(self, port="/dev/ttyTHS1", baudrate=115200):
        self.ser = serial.Serial(port, baudrate, timeout=0.1)
        self.parser = UARTParser()

    def send_cmd(self, cmd_subtype, payload=b""):
        pkt = build_packet(0x01, cmd_subtype, payload)
        self.ser.write(pkt)
        # print("[TX]", pkt)

    def poll(self):
      try:
          data = self.ser.read(64)
      except serial.SerialException as e:
          print(f"[UART] read error: {e}")
          return []
  
      if not data:
          return []
  
      frames = self.parser.feed(data)
      packets = []
  
      for f in frames:
          pkt = parse_packet(f)
          if pkt:
              packets.append(pkt)
  
      return packets