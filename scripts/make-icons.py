"""Writes icons/icon-{192,512}.png: a 2x2 key grid, bottom-right key orange."""
import struct
import zlib
from pathlib import Path

BG = (28, 28, 28)
KEY = (60, 60, 60)
ORANGE = (232, 146, 12)


def pixel(x, y, size):
    pad, gap = size * 0.2, size * 0.05
    cell = (size - 2 * pad - gap) / 2
    for row in range(2):
        for col in range(2):
            x0 = pad + col * (cell + gap)
            y0 = pad + row * (cell + gap)
            if x0 <= x < x0 + cell and y0 <= y < y0 + cell:
                return ORANGE if (row, col) == (1, 1) else KEY
    return BG


def png(size):
    rows = b''.join(
        b'\0' + bytes(c for x in range(size) for c in pixel(x, y, size))
        for y in range(size)
    )

    def chunk(kind, data):
        body = kind + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body))

    header = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header)
            + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


out = Path(__file__).resolve().parent.parent / 'icons'
out.mkdir(exist_ok=True)
for size in (192, 512):
    (out / f'icon-{size}.png').write_bytes(png(size))
