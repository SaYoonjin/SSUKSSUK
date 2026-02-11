# uart/codec.py
from uart.packet import *

def calc_checksum(type_, subtype, length, payload: bytes):
    chk = type_ ^ subtype ^ length
    for b in payload:
        chk ^= b
    return chk & 0xFF


def build_packet(type_, subtype, payload=b""):
    length = len(payload)
    chk = calc_checksum(type_, subtype, length, payload)
    return bytes([STX, type_, subtype, length]) + payload + bytes([chk, ETX])


def parse_packet(raw: bytes):
    """
    raw: STX부터 ETX까지 한 프레임
    """
    if len(raw) < 6:
        return None

    if raw[0] != STX or raw[-1] != ETX:
        return None

    type_ = raw[1]
    subtype = raw[2]
    length = raw[3]
    payload = raw[4:4+length]
    chk = raw[4+length]

    if calc_checksum(type_, subtype, length, payload) != chk:
        return None

    return {
        "type": type_,
        "subtype": subtype,
        "payload": payload
    }

