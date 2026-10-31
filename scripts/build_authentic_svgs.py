import os
import base64

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DARK_PNG = os.path.join(ROOT, "public", "icons", "icon-dark.png")
LIGHT_PNG = os.path.join(ROOT, "public", "icons", "icon-light.png")

with open(DARK_PNG, "rb") as f:
    b64_dark = base64.b64encode(f.read()).decode("utf-8")

with open(LIGHT_PNG, "rb") as f:
    b64_light = base64.b64encode(f.read()).decode("utf-8")

svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_dark}" x="0" y="0" width="512" height="512"/>
</svg>
'''

svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_light}" x="0" y="0" width="512" height="512"/>
</svg>
'''

with open(os.path.join(ROOT, "src", "app", "icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(ROOT, "public", "icons", "logo-dark.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(ROOT, "public", "icons", "logo-light.svg"), "w", encoding="utf-8") as f:
    f.write(svg_light)

with open(os.path.join(ROOT, "public", "icons", "logo.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

print("Authentic SVG files successfully written!")
