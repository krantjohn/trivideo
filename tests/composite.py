import sys
from PIL import Image

def composite(base_path, overlay_path, out_path, x, y):
    base = Image.open(base_path).convert("RGBA")
    overlay = Image.open(overlay_path).convert("RGBA")
    base.paste(overlay, (int(x), int(y)))
    base.save(out_path)
    print(f"Successfully composited {out_path} at ({x}, {y})")

if __name__ == "__main__":
    if len(sys.argv) >= 6:
        composite(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    else:
        print("Usage: python composite.py <base> <overlay> <out> <x> <y>")
