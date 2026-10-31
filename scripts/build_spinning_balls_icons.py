import os
import cv2
import numpy as np
import base64
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_PATH = os.path.join(ROOT, "public", "image.png")
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("1. Loading new source image:", SRC_PATH)
raw_img = Image.open(SRC_PATH).convert("RGBA")
raw_arr = np.array(raw_img)

# Crop the 340x340 squircle area
x_start, y_start, crop_w, crop_h = 198, 198, 340, 340
crop = raw_arr[y_start:y_start+crop_h, x_start:x_start+crop_w].copy()
h, w = crop.shape[:2]

# Build accurate squircle mask
gray = cv2.cvtColor(crop[:, :, :3], cv2.COLOR_RGB2GRAY)
_, thresh = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY)
for corner in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
    if thresh[corner[1], corner[0]] == 0:
        cv2.floodFill(thresh, None, corner, 128)

outside = (thresh == 128)
squircle_mask_raw = (~outside).astype(np.float32)

# Anti-alias mask with Gaussian blur
squircle_mask = cv2.GaussianBlur(squircle_mask_raw, (3, 3), 0.75)

# Extract authentic droplet alpha
# Inside squircle, background is pure white (255)
y, x = np.ogrid[:h, :w]
dist_from_center = np.sqrt((x - w/2.0)**2 + (y - h/2.0)**2)
center_mask = (dist_from_center < 125).astype(np.float32)

# Droplets alpha: where pixel is dark inside center mask
droplet_alpha = np.clip((255.0 - gray) / 255.0, 0.0, 1.0) * center_mask

# A. Build Master Light Mode Icon (1024x1024)
# Pure white squircle with authentic black droplets & motion blur
light_rgba = np.full((h, w, 4), 255, dtype=np.uint8)
for c in range(3):
    # In light mode, droplets are black (0,0,0)
    light_rgba[:, :, c] = np.clip(255.0 * (1.0 - droplet_alpha), 0, 255).astype(np.uint8)
light_rgba[:, :, 3] = (squircle_mask * 255.0).astype(np.uint8)
master_light = Image.fromarray(light_rgba).resize((1024, 1024), Image.Resampling.LANCZOS)

# B. Build Master Dark Mode Icon (1024x1024)
# Obsidian dark squircle with liquid glass sheen and pure white droplets
dark_rgb = np.full((h, w, 3), 13.0, dtype=np.float32)

# Specular top edge sheen
top_sheen = np.clip(1.0 - (y / 70.0), 0.0, 1.0) * 48.0
dark_rgb += top_sheen[:, :, np.newaxis]

# Delicate 1px border highlight
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
eroded = cv2.erode(squircle_mask_raw, kernel)
edge = np.clip(squircle_mask_raw - eroded, 0.0, 1.0)
dark_rgb += (edge * 38.0)[:, :, np.newaxis]

# Blend pure white droplets (255, 255, 255)
for c in range(3):
    dark_rgb[:, :, c] = dark_rgb[:, :, c] * (1.0 - droplet_alpha) + 255.0 * droplet_alpha

dark_rgba = np.zeros((h, w, 4), dtype=np.uint8)
dark_rgba[:, :, :3] = np.clip(dark_rgb, 0, 255).astype(np.uint8)
dark_rgba[:, :, 3] = (squircle_mask * 255.0).astype(np.uint8)
master_dark = Image.fromarray(dark_rgba).resize((1024, 1024), Image.Resampling.LANCZOS)

# C. Save Isolated Spinning Balls (for Animated Splash Screen & Component)
balls_black = np.zeros((h, w, 4), dtype=np.uint8)
balls_black[:, :, :3] = 0
balls_black[:, :, 3] = (droplet_alpha * 255.0).astype(np.uint8)
balls_black_img = Image.fromarray(balls_black).resize((512, 512), Image.Resampling.LANCZOS)
balls_black_img.save(os.path.join(OUTPUT_DIR, "spinning-balls-black.png"))

balls_white = np.zeros((h, w, 4), dtype=np.uint8)
balls_white[:, :, :3] = 255
balls_white[:, :, 3] = (droplet_alpha * 255.0).astype(np.uint8)
balls_white_img = Image.fromarray(balls_white).resize((512, 512), Image.Resampling.LANCZOS)
balls_white_img.save(os.path.join(OUTPUT_DIR, "spinning-balls-white.png"))

# Save Master Public Icons
print("Exporting Web, PWA and Next.js Icons...")
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-dark.png"))
master_light.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-light.png"))

# Next.js App Router icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "icon.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "apple-icon.png"))

# PWA Icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-512.png"))
master_dark.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-192.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "apple-touch-icon.png"))

# Maskable icon (safe 10% padding)
maskable = Image.new("RGBA", (512, 512), (13, 13, 13, 255))
scaled_inner = master_dark.resize((410, 410), Image.Resampling.LANCZOS)
maskable.paste(scaled_inner, (51, 51), scaled_inner)
maskable.save(os.path.join(OUTPUT_DIR, "icon-maskable.png"))

# D. Crisp Multi-Resolution Favicons (16, 32, 48)
print("Generating multi-resolution favicon.ico...")
fav_16 = master_dark.resize((16, 16), Image.Resampling.LANCZOS)
fav_32 = master_dark.resize((32, 32), Image.Resampling.LANCZOS)
fav_48 = master_dark.resize((48, 48), Image.Resampling.LANCZOS)

fav_16.save(os.path.join(ROOT, "src", "app", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])
fav_16.save(os.path.join(ROOT, "public", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])

# E. High-Resolution Vector SVGs
print("Writing SVG logos...")
with open(os.path.join(OUTPUT_DIR, "icon-dark.png"), "rb") as f:
    b64_dark = base64.b64encode(f.read()).decode("utf-8")
with open(os.path.join(OUTPUT_DIR, "icon-light.png"), "rb") as f:
    b64_light = base64.b64encode(f.read()).decode("utf-8")
with open(os.path.join(OUTPUT_DIR, "spinning-balls-black.png"), "rb") as f:
    b64_balls_black = base64.b64encode(f.read()).decode("utf-8")
with open(os.path.join(OUTPUT_DIR, "spinning-balls-white.png"), "rb") as f:
    b64_balls_white = base64.b64encode(f.read()).decode("utf-8")

svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_dark}" x="0" y="0" width="512" height="512"/>
</svg>
'''
svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_light}" x="0" y="0" width="512" height="512"/>
</svg>
'''
svg_balls_black = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_balls_black}" x="0" y="0" width="512" height="512"/>
</svg>
'''
svg_balls_white = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_balls_white}" x="0" y="0" width="512" height="512"/>
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
with open(os.path.join(OUTPUT_DIR, "spinning-balls-black.svg"), "w", encoding="utf-8") as f:
    f.write(svg_balls_black)
with open(os.path.join(OUTPUT_DIR, "spinning-balls-white.svg"), "w", encoding="utf-8") as f:
    f.write(svg_balls_white)

# F. Android Capacitor Mipmaps & Splash
android_res = os.path.join(ROOT, "android", "app", "src", "main", "res")
if os.path.exists(android_res):
    print("Generating Android mipmaps and adaptive icons...")
    mipmap_targets = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }
    for folder, (dim, fg_dim) in mipmap_targets.items():
        folder_path = os.path.join(android_res, folder)
        os.makedirs(folder_path, exist_ok=True)

        # Standard Launcher Icon
        resized_icon = master_dark.resize((dim, dim), Image.Resampling.LANCZOS)
        resized_icon.save(os.path.join(folder_path, "ic_launcher.png"))

        # Round Launcher Icon
        circle_mask = Image.new("L", (dim, dim), 0)
        draw_c = ImageDraw.Draw(circle_mask)
        draw_c.ellipse((0, 0, dim - 1, dim - 1), fill=255)
        round_icon = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        round_icon.paste(resized_icon, (0, 0), circle_mask)
        round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"))

        # Adaptive Foreground (centered on transparent canvas)
        fg = Image.new("RGBA", (fg_dim, fg_dim), (0, 0, 0, 0))
        inner_dim = int(fg_dim * 0.72)
        inner_icon = master_dark.resize((inner_dim, inner_dim), Image.Resampling.LANCZOS)
        pos = (fg_dim - inner_dim) // 2
        fg.paste(inner_icon, (pos, pos), inner_icon)
        fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"))

    # Android Splash Screen
    splash_bg = Image.new("RGBA", (1280, 1920), (5, 5, 5, 255))
    splash_logo = master_dark.resize((360, 360), Image.Resampling.LANCZOS)
    splash_bg.paste(splash_logo, ((1280 - 360) // 2, (1920 - 360) // 2), splash_logo)

    drawable_folders = ["drawable", "drawable-port-hdpi", "drawable-port-mdpi", "drawable-port-xhdpi", "drawable-port-xxhdpi", "drawable-port-xxxhdpi"]
    for df in drawable_folders:
        df_path = os.path.join(android_res, df)
        if os.path.exists(df_path):
            splash_bg.save(os.path.join(df_path, "splash.png"))

# G. Clean up old preview files from public/
old_files = [
    "icons_dark_authentic.png",
    "icons_light_authentic.png",
    "isolated_icon.png",
    "preview_dark_authentic.png",
    "preview_dark_test.png",
    "preview_light_test.png",
    "raw_crop.png",
    "test_light.png",
    "cropped_new_icon.png",
    "test_master_light.png",
    "test_master_dark.png",
    "isolated_droplets_black.png",
    "isolated_droplets_white.png",
]
for f_name in old_files:
    f_path = os.path.join(ROOT, "public", f_name)
    if os.path.exists(f_path):
        os.remove(f_path)

print("SUCCESS: All new application icons and spinning balls assets created cleanly!")
