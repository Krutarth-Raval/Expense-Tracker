import os
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def cubic_bezier(p0, p1, p2, p3, n=80):
    t = np.linspace(0, 1, n)[:, None]
    return ((1-t)**3 * p0 + 3*(1-t)**2*t * p1 + 3*(1-t)*t**2 * p2 + t**3 * p3)

def generate_eye_path_d(x, y, w, h):
    p_tr = np.array([x + w, y])
    p_br = np.array([x + w, y + h])
    p_bl = np.array([x + w * 0.05, y + h])
    p_ml = np.array([x + w * 0.05, y + h * 0.50])
    p_shelf = np.array([x + w * 0.52, y + h * 0.50])
    p_inner_top = np.array([x + w * 0.52, y + h * 0.30])
    p_tip = np.array([x, y + h * 0.22])
    
    c_crest = cubic_bezier(p_tip, np.array([x, y + h * 0.04]), np.array([x + w * 0.25, y]), p_tr, 60)
    c_inner = cubic_bezier(p_inner_top, np.array([x + w * 0.32, y + h * 0.30]), np.array([x + w * 0.10, y + h * 0.28]), p_tip, 60)
    
    pts = np.vstack([c_crest, [p_br], [p_bl], [p_ml], [p_shelf], [p_inner_top], c_inner])
    
    d = f"M {pts[0][0]:.2f},{pts[0][1]:.2f}"
    for pt in pts[1:]:
        d += f" L {pt[0]:.2f},{pt[1]:.2f}"
    d += " Z"
    return d

eye1_d = generate_eye_path_d(226, 222, 54, 66)
eye2_d = generate_eye_path_d(296, 218, 54, 66)

squircle_path = "M 256, 16 C 366.4, 16 422.4, 21.6 461.6, 60.8 C 500.8, 100 506.4, 156 506.4, 256 C 506.4, 356 500.8, 412 461.6, 451.2 C 422.4, 490.4 366.4, 496 256, 496 C 145.6, 496 89.6, 490.4 50.4, 451.2 C 11.2, 412 5.6, 356 5.6, 256 C 5.6, 156 11.2, 100 50.4, 60.8 C 89.6, 21.6 145.6, 16 256, 16 Z"

dome_path = "M 54, 460 C 54, 340 52, 230 105, 185 C 145, 148 190, 142 250, 142 C 325, 142 385, 185 408, 255 C 422, 320 424, 395 422, 460 Z"

# Modern Dark Liquid Glass SVG
svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Liquid Glass Ambient Shadow -->
    <filter id="liquid-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    <clipPath id="squircle-clip">
      <path d="{squircle_path}"/>
    </clipPath>
  </defs>

  <!-- Base Squircle -->
  <path d="{squircle_path}" fill="#0A0A0A" filter="url(#liquid-shadow)"/>
  
  <g clip-path="url(#squircle-clip)">
    <!-- Liquid Glass Obsidian Layer -->
    <rect x="0" y="0" width="512" height="512" fill="#0E0E0E"/>

    <!-- Organic Dome Subject -->
    <path d="{dome_path}" fill="#141414" stroke="#262626" stroke-width="1.5"/>

    <!-- Solid White Quotation Eyes -->
    <path d="{eye1_d}" fill="#FFFFFF"/>
    <path d="{eye2_d}" fill="#FFFFFF"/>

    <!-- Apple Liquid Glass Curved Specular Sheen -->
    <path d="M 40, 60 C 140, 30 372, 30 472, 60 C 360, 150 152, 150 40, 60 Z" fill="#FFFFFF" fill-opacity="0.14"/>
  </g>

  <!-- Beveled Glass Rim -->
  <path d="{squircle_path}" fill="none" stroke="#2A2A2A" stroke-width="2"/>
  <path d="M 110, 20 C 175, 16 337, 16 402, 20" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.30"/>
</svg>
'''

# Modern Light Liquid Glass SVG
svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <filter id="light-liquid-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
    <clipPath id="squircle-clip-light">
      <path d="{squircle_path}"/>
    </clipPath>
  </defs>

  <path d="{squircle_path}" fill="#F6F6F8" filter="url(#light-liquid-shadow)"/>
  
  <g clip-path="url(#squircle-clip-light)">
    <rect x="0" y="0" width="512" height="512" fill="#EDEDF0"/>

    <!-- Organic Dome Subject -->
    <path d="{dome_path}" fill="#111111"/>

    <!-- Solid White Quotation Eyes -->
    <path d="{eye1_d}" fill="#FFFFFF"/>
    <path d="{eye2_d}" fill="#FFFFFF"/>

    <!-- Specular Sheen -->
    <path d="M 40, 60 C 140, 30 372, 30 472, 60 C 360, 150 152, 150 40, 60 Z" fill="#FFFFFF" fill-opacity="0.75"/>
  </g>

  <path d="{squircle_path}" fill="none" stroke="#DCDCE0" stroke-width="2"/>
  <path d="M 110, 20 C 175, 16 337, 16 402, 20" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.95"/>
</svg>
'''

with open(os.path.join(ROOT, "src", "app", "icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(OUTPUT_DIR, "logo-dark.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(OUTPUT_DIR, "logo-light.svg"), "w", encoding="utf-8") as f:
    f.write(svg_light)

with open(os.path.join(OUTPUT_DIR, "logo.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

print("All vector SVG icons successfully generated with A1 quality!")
