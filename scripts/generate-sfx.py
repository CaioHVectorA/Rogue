"""Original procedural SFX. Run with Python 3; no packages or external assets."""

import math
from pathlib import Path
import random
import struct
import wave

output = Path(__file__).resolve().parents[1] / "public" / "sfx"
output.mkdir(parents=True, exist_ok=True)
rng = random.Random(123)
sounds = [("shot", 600, .07), ("kill", 240, .13), ("pickup", 1100, .09),
          ("skill", 140, .3), ("hurt", 90, .2), ("boss", 65, .65)]

for name, frequency, duration in sounds:
    samples = []
    rate = 22050
    for index in range(int(rate * duration)):
        time = index / rate
        progress = time / duration
        pitch = frequency * (1 + progress * .5 if name == "pickup" else 1 - progress * .65)
        noise = .35 if name in ("shot", "kill", "hurt", "boss") else .05
        signal = math.sin(2 * math.pi * pitch * time) * .65 + (rng.random() * 2 - 1) * noise
        signal *= min(1, time * 1000) * (1 - progress) ** 2
        samples.append(struct.pack("<h", int(signal * 16000)))
    with wave.open(str(output / f"{name}.wav"), "wb") as sound:
        sound.setnchannels(1)
        sound.setsampwidth(2)
        sound.setframerate(rate)
        sound.writeframes(b"".join(samples))
