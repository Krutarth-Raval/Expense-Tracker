import os
import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REF_PATH = os.path.join(ROOT, "cropped_ref.png")
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")

ref = cv2.imread(REF_PATH)
h_ref, w_ref = ref.shape[:2]
gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)

_, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
char_contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
char_c = max(char_contours, key=cv2.contourArea).reshape(-1, 2)

char_mask = np.zeros_like(gray)
cv2.drawContours(char_mask, [char_c], -1, 255, -1)
roi = gray.copy()
roi[char_mask == 0] = 0
_, eyes_thresh = cv2.threshold(roi, 180, 255, cv2.THRESH_BINARY)
eye_contours, _ = cv2.findContours(eyes_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
eye_contours = sorted([c.reshape(-1, 2) for c in eye_contours if cv2.contourArea(c) > 400], key=lambda c: cv2.boundingRect(c)[0])

def smooth_pts(pts, sigma=2.5):
    x = gaussian_filter1d(pts[:, 0].astype(float), sigma, mode='wrap')
    y = gaussian_filter1d(pts[:, 1].astype(float), sigma, mode='wrap')
    return np.column_stack([x, y])

char_smooth = smooth_pts(char_c, sigma=3.5)
eyes_smooth = [smooth_pts(ec, sigma=1.2) for ec in eye_contours]

# Scale to 512x512
size = 512
scale_factor = (size * 0.88) / max(w_ref, h_ref)
offset_x = (size - w_ref * scale_factor) / 2.0
offset_y = (size - h_ref * scale_factor) / 2.0

def pts_to_svg(pts):
    scaled = pts * scale_factor + np.array([offset_x, offset_y])
    # Downsample points for cleaner SVG path while retaining smooth curve
    step = 3
    sub = scaled[::step]
    d = f"M {sub[0][0]:.1f},{sub[0][1]:.1f}"
    for pt in sub[1:]:
        d += f" L {pt[0]:.1f},{pt[1]:.1f}"
    d += " Z"
    return d

char_d = pts_to_svg(char_smooth)
eyes_d = [pts_to_svg(ec) for ec in eyes_smooth]

# Apple Squircle continuous path (512x512 with 24px inset, squircle curvature)
squircle_path = "M 256,24 C 360,24 418,32 452,66 C 486,100 494,158 494,256 C 494,354 486,412 452,446 C 418,480 360,488 256,488 C 152,488 94,480 60,446 C 26,412 18,354 18,256 C 18,158 26,100 60,66 C 94,32 152,24 256,24 Z"

# Dark Theme SVG (Apple Modern Black Liquid Glass)
svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Liquid Glass Bevel Shadow / Glow (Strict Monochrome) -->
    <filter id="glass-depth" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
    <clipPath id="squircle-clip">
      <path d="{squircle_path}"/>
    </clipPath>
  </defs>

  <!-- Deep Base Squircle -->
  <path d="{squircle_path}" fill="#080808" filter="url(#glass-depth)"/>
  
  <!-- Content clipped to squircle -->
  <g clip-path="url(#squircle-clip)">
    <!-- Liquid Glass Surface layer -->
    <rect x="0" y="0" width="512" height="512" fill="#0f0f0f" fill-opacity="0.95"/>
    
    <!-- Character Dome with subtle neutral rim -->
    <path d="{char_d}" fill="#141414" stroke="#2c2c2c" stroke-width="2.5"/>
    
    <!-- Solid White Quotation Eyes -->
    <path d="{eyes_d[0]}" fill="#ffffff"/>
    <path d="{eyes_d[1]}" fill="#ffffff"/>
    
    <!-- Apple Liquid Glass Specular Top Reflection Highlight -->
    <path d="M 64,68 C 110,40 180,28 256,28 C 332,28 402,40 448,68 C 420,54 340,44 256,44 C 172,44 92,54 64,68 Z" fill="#ffffff" fill-opacity="0.18"/>
  </g>

  <!-- Outer Glass Bevel Border -->
  <path d="{squircle_path}" fill="none" stroke="#262626" stroke-width="2" stroke-opacity="0.8"/>
  <path d="M 120,26 C 180,24 332,24 392,26" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.25"/>
</svg>
'''

# Light Theme SVG (Frosted Translucent Liquid Glass)
svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <filter id="light-glass-depth" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
    <clipPath id="squircle-clip-light">
      <path d="{squircle_path}"/>
    </clipPath>
  </defs>

  <!-- Frosted Light Base -->
  <path d="{squircle_path}" fill="#f5f5f5" filter="url(#light-glass-depth)"/>
  
  <g clip-path="url(#squircle-clip-light)">
    <rect x="0" y="0" width="512" height="512" fill="#f0f0f0" fill-opacity="0.98"/>
    
    <!-- Character Dome -->
    <path d="{char_d}" fill="#111111"/>
    
    <!-- Solid White Quotation Eyes -->
    <path d="{eyes_d[0]}" fill="#ffffff"/>
    <path d="{eyes_d[1]}" fill="#ffffff"/>
    
    <!-- Specular Highlight -->
    <path d="M 64,68 C 110,40 180,28 256,28 C 332,28 402,40 448,68 C 420,54 340,44 256,44 C 172,44 92,54 64,68 Z" fill="#ffffff" fill-opacity="0.7"/>
  </g>

  <!-- Outer Glass Border -->
  <path d="{squircle_path}" fill="none" stroke="#e0e0e0" stroke-width="2"/>
  <path d="M 120,26 C 180,24 332,24 392,26" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9"/>
</svg>
'''

# Save SVGs
with open(os.path.join(ROOT, "src", "app", "icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(OUTPUT_DIR, "logo-dark.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

with open(os.path.join(OUTPUT_DIR, "logo-light.svg"), "w", encoding="utf-8") as f:
    f.write(svg_light)

with open(os.path.join(OUTPUT_DIR, "logo.svg"), "w", encoding="utf-8") as f:
    f.write(svg_dark)

print("All vector SVG icons successfully generated!")

