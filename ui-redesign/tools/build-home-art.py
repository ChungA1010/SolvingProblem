"""Compose the factory-game picture of the home page from the game's own art.

The home page shows each mode by a still of its real scene. This one layers the game's counter scene the way the
game does: room, customer, counter. Output: home/media/factory.webp.

Usage: python tools/build-home-art.py            (needs Pillow)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "factory" / "media" / "counter-art"
OUT = ROOT / "home" / "media" / "factory.webp"
W, H = 1800, 1500                      # a little wider than tall: the page crops it to the panel
COUNTER_TOP = 0.70                     # height of the counter's top edge in the picture
ROOM_LEFT = 300                        # left edge of the room crop, in scaled pixels: board at the left, window at the right


def main() -> None:
    room = Image.open(ART / "room-garden.png").convert("RGB")
    counter = Image.open(ART / "counter-foreground.png").convert("RGBA")
    sheet = Image.open(ART / "seoyun-expressions.png").convert("RGBA")
    customer = sheet.crop((0, 0, sheet.width // 3, sheet.height))      # three expressions side by side; the first is neutral

    scale = H / room.height                                            # the room fills the height
    room = room.resize((round(room.width * scale), H), Image.LANCZOS)
    picture = room.crop((ROOM_LEFT, 0, ROOM_LEFT + W, H)).convert("RGBA")

    # The game draws the customer at about 0.76 of the room's scale.
    person = customer.resize((round(customer.width * scale * 0.76), round(customer.height * scale * 0.76)), Image.LANCZOS)
    top = round(H * COUNTER_TOP)
    picture.alpha_composite(person, ((W - person.width) // 2, top - round(person.height * 0.84)))

    desk = counter.resize((round(counter.width * scale * 0.76), round(counter.height * scale * 0.76)), Image.LANCZOS)      # a little larger than in the game, so it reaches the bottom edge
    surface = round(205 / 724 * desk.height)                           # the counter surface starts 205 px down in the 724 px art
    picture.alpha_composite(desk, ((W - desk.width) // 2, top - surface))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    picture.convert("RGB").save(OUT, "WEBP", quality=88, method=6)
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB, {W}x{H})")


if __name__ == "__main__":
    main()
