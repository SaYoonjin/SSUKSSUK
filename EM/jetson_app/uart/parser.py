# uart/parser.py
from uart.packet import STX, ETX

class UARTParser:
    def __init__(self):
        self.buf = bytearray()
        self.expected_len = None

    def feed(self, data: bytes):
        packets = []

        for b in data:
            if not self.buf and b != STX:
                continue

            self.buf.append(b)

            if len(self.buf) == 4:
                self.expected_len = self.buf[3]

            if self.expected_len is not None:
                total_len = self.expected_len + 6
                if len(self.buf) == total_len:
                    packets.append(bytes(self.buf))
                    self.buf.clear()
                    self.expected_len = None

        return packets

