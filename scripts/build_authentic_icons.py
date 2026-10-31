import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_PATH = os.path.join(ROOT, "public", "image.png")
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Load authentic source image
raw_img = Image.open(SRC_PATH).convert("RGB")
raw_arr = np.array(raw_img)

# Crop squircle icon box (xmin=184, ymin=112, xmax=495, ymax=423) -> 312x312
crop = raw_arr[112:424, 184:496].astype(np.float32)
h, w = crop.shape[:2]
cx, cy = (w - 1) / 2.0, (h - 1) / 2.0

# Generate mathematical Apple squircle superellipse mask (continuous curvature n=4.5)
y, x = np.ogrid[:h, :w]
dist = ((np.abs((x - cx) / 154.5) ** 4.5) + (np.abs((y - cy) / 154.5) ** 4.5))
squircle_mask = np.clip(1.0 - (dist - 1.0) * 14.0, 0.0, 1.0)

# A. Build Master Light Mode Icon (100% Authentic from public/image.png)
light_rgba = np.zeros((h, w, 4), dtype=np.uint8)
light_rgba[:, :, :3] = crop.clip(0, 255).astype(np.uint8)
light_rgba[:, :, 3] = (squircle_mask * 255.0).astype(np.uint8)
master_light = Image.fromarray(light_rgba).resize((1024, 1024), Image.Resampling.LANCZOS)

# B. Build Master Dark Mode Icon (Apple Modern Black Liquid Glass from authentic artwork)
gray = cv2.cvtColor(crop.astype(np.uint8), cv2.COLOR_RGB2GRAY)
_, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
char_c = max(contours, key=cv2.contourArea)

full_dome_mask = np.zeros_like(gray, dtype=np.float32)
cv2.drawContours(full_dome_mask, [char_c], -1, 1.0, -1)
full_dome_mask = cv2.GaussianBlur(full_dome_mask, (3, 3), 0.8)

eyes_mask = ((gray > 200) & (full_dome_mask > 0.5)).astype(np.float32)
eyes_mask = cv2.GaussianBlur(eyes_mask, (3, 3), 0.5)

# Dome top rim lighting
dome_rim = np.zeros_like(gray, dtype=np.float32)
cv2.polylines(dome_rim, [char_c], isClosed=True, color=1.0, thickness=2, lineType=cv2.LINE_AA)
rim_fade = dome_rim * np.clip(1.0 - (y / 240.0), 0.0, 1.0) * 65.0

# Dark base: deep obsidian black
dark_rgb = np.full((h, w, 3), 10.0, dtype=np.float32)

# Preserve authentic dome shading & diagonal reflection
dome_content = crop.copy()
dome_content = np.clip(dome_content + 8.0, 0, 255)
for c in range(3):
    dome_content[:, :, c] += rim_fade

# Blend dome over dark base
for c in range(3):
    dark_rgb[:, :, c] = dark_rgb[:, :, c] * (1.0 - full_dome_mask) + dome_content[:, :, c] * full_dome_mask
    # Solid white eyes #FFFFFF
    dark_rgb[:, :, c] = dark_rgb[:, :, c] * (1.0 - eyes_mask) + 255.0 * eyes_mask

# Squircle specular top sheen for liquid glass finish
border_w = 0.015
border_mask = np.clip(1.0 - np.abs(dist - 1.0) / border_w, 0.0, 1.0) * squircle_mask
top_sheen = border_mask * np.clip(1.0 - (y / 120.0), 0.0, 1.0) * 90.0
for c in range(3):
    dark_rgb[:, :, c] = np.clip(dark_rgb[:, :, c] + top_sheen, 0.0, 255.0)

dark_rgba = np.zeros((h, w, 4), dtype=np.uint8)
dark_rgba[:, :, :3] = dark_rgb.clip(0, 255).astype(np.uint8)
dark_rgba[:, :, 3] = (squircle_mask * 255.0).astype(np.uint8)
master_dark = Image.fromarray(dark_rgba).resize((1024, 1024), Image.Resampling.LANCZOS)

# Save Public Web Icons
print("Exporting Web & PWA Icons...")
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-dark.png"))
master_light.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-light.png"))

# Next.js App Router root icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "icon.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "apple-icon.png"))

# PWA Icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-512.png"))
master_dark.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-192.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "apple-touch-icon.png"))

# PWA Maskable Icon (safe padded zone)
maskable = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
scaled_inner = master_dark.resize((410, 410), Image.Resampling.LANCZOS)
maskable.paste(scaled_inner, (51, 51), scaled_inner)
maskable.save(os.path.join(OUTPUT_DIR, "icon-maskable.png"))

# C. Bespoke High-Contrast Favicon (16, 32, 48)
print("Rendering Crisp Multi-Resolution Favicon...")
def make_crisp_favicon(size=16):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Dark rounded squircle
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=max(2, int(size * 0.24)), fill=(12, 12, 12, 255), outline=(55, 55, 55, 255))
    if size == 16:
        # Dome
        draw.polygon([(2, 14), (2, 7), (5, 4), (10, 4), (13, 7), (13, 14)], fill=(24, 24, 24, 255))
        # Left eye
        img.putpixel((7, 6), (255, 255, 255, 255))
        img.putpixel((8, 6), (255, 255, 255, 255))
        img.putpixel((8, 7), (255, 255, 255, 255))
        img.putpixel((8, 8), (255, 255, 255, 255))
        img.putpixel((7, 8), (255, 255, 255, 255))
        # Right eye
        img.putpixel((10, 6), (255, 255, 255, 255))
        img.putpixel((11, 6), (255, 255, 255, 255))
        img.putpixel((11, 7), (255, 255, 255, 255))
        img.putpixel((11, 8), (255, 255, 255, 255))
        img.putpixel((10, 8), (255, 255, 255, 255))
    elif size == 32:
        # 32x32 dome
        draw.polygon([(4, 28), (4, 15), (9, 9), (18, 8), (26, 13), (27, 28)], fill=(24, 24, 24, 255))
        # Left eye
        draw.rectangle([14, 16, 17, 21], fill=(255, 255, 255, 255))
        draw.rectangle([16, 12, 17, 16], fill=(255, 255, 255, 255))
        draw.rectangle([13, 12, 16, 14], fill=(255, 255, 255, 255))
        # Right eye
        draw.rectangle([20, 16, 23, 21], fill=(255, 255, 255, 255))
        draw.rectangle([22, 12, 23, 16], fill=(255, 255, 255, 255))
        draw.rectangle([19, 12, 22, 14], fill=(255, 255, 255, 255))
    else:
        # 48x48
        return master_dark.resize((48, 48), Image.Resampling.LANCZOS)
    return img

fav_16 = make_crisp_favicon(16)
fav_32 = make_crisp_favicon(32)
fav_48 = make_crisp_favicon(48)

fav_16.save(os.path.join(ROOT, "src", "app", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])
fav_16.save(os.path.join(ROOT, "public", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])

# D. Android Capacitor Mipmaps & Splash
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

print("All authentic icons generated successfully!")
