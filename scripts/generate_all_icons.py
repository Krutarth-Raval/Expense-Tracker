import os
import cv2
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter1d

# Paths
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REF_PATH = os.path.join(ROOT, "cropped_ref.png")
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Extract and Smooth Contours from the user's reference logo
ref = cv2.imread(REF_PATH)
h_ref, w_ref = ref.shape[:2]
gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)

# Character dome contour
_, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
char_contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
char_c = max(char_contours, key=cv2.contourArea).reshape(-1, 2)

# Eyes contours inside character
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

# Function to generate high-resolution master icon (2048x2048)
def create_master_icon(theme="dark", size=2048):
    canvas = np.zeros((size, size, 4), dtype=np.float32)
    
    # Apple Squircle Superellipse formula: (|x/r|^4.5 + |y/r|^4.5) <= 1
    y, x = np.ogrid[:size, :size]
    cx, cy = size / 2.0, size / 2.0
    r = size * 0.44  # squircle radius with padding
    n = 4.4  # Apple squircle exponent
    
    dist = (np.abs((x - cx) / r) ** n + np.abs((y - cy) / r) ** n)
    squircle_mask = np.clip(1.0 - (dist - 1.0) * (size / 8.0), 0.0, 1.0)
    
    # Outer glass border mask (1.5% thickness)
    border_width = 0.015
    border_mask = np.clip(1.0 - np.abs(dist - 1.0) / border_width, 0.0, 1.0) * squircle_mask

    # Specular top highlight crescent (Apple liquid glass reflection along top rim)
    top_y_weight = np.clip(1.0 - (y / (size * 0.45)), 0.0, 1.0)
    specular_mask = border_mask * top_y_weight

    # Glass surface colors
    if theme == "dark":
        # Pitch-black obsidian glass
        bg_color = np.array([12, 12, 12, 255], dtype=np.float32) / 255.0
        border_color = np.array([255, 255, 255, 45], dtype=np.float32) / 255.0
        specular_color = np.array([255, 255, 255, 95], dtype=np.float32) / 255.0
        
        # Fill squircle
        for c in range(3):
            canvas[:, :, c] = bg_color[c] * squircle_mask
        canvas[:, :, 3] = squircle_mask
        
        # Add border & top specular reflection
        for c in range(3):
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - border_mask * 0.25) + border_color[c] * (border_mask * 0.25)
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - specular_mask * 0.5) + specular_color[c] * (specular_mask * 0.5)
            
        # Character in dark theme: sleek charcoal/black dome with soft neutral edge highlight
        char_color = np.array([20, 20, 20, 255], dtype=np.float32) / 255.0
        char_rim_color = np.array([75, 75, 75, 255], dtype=np.float32) / 255.0
        eye_color = np.array([255, 255, 255, 255], dtype=np.float32) / 255.0
    else:
        # Light theme: frosted translucent white glass
        bg_color = np.array([244, 244, 244, 255], dtype=np.float32) / 255.0
        border_color = np.array([0, 0, 0, 30], dtype=np.float32) / 255.0
        specular_color = np.array([255, 255, 255, 200], dtype=np.float32) / 255.0
        
        # Fill squircle
        for c in range(3):
            canvas[:, :, c] = bg_color[c] * squircle_mask
        canvas[:, :, 3] = squircle_mask
        
        # Add border & top specular reflection
        for c in range(3):
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - border_mask * 0.15) + border_color[c] * (border_mask * 0.15)
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - specular_mask * 0.6) + specular_color[c] * (specular_mask * 0.6)

        char_color = np.array([18, 18, 18, 255], dtype=np.float32) / 255.0
        char_rim_color = np.array([45, 45, 45, 255], dtype=np.float32) / 255.0
        eye_color = np.array([255, 255, 255, 255], dtype=np.float32) / 255.0

    # Draw character dome and eyes
    # Coordinate mapping from reference icon coordinates to canvas coordinates
    scale_factor = (size * 0.88) / max(w_ref, h_ref)
    offset_x = (size - w_ref * scale_factor) / 2.0
    offset_y = (size - h_ref * scale_factor) / 2.0

    scaled_char = (char_smooth * scale_factor + np.array([offset_x, offset_y])).astype(np.int32)
    scaled_eyes = [(ec * scale_factor + np.array([offset_x, offset_y])).astype(np.int32) for ec in eyes_smooth]

    # Draw character mask
    char_img = np.zeros((size, size), dtype=np.uint8)
    cv2.fillPoly(char_img, [scaled_char], 255, cv2.LINE_AA)

    # In dark theme, draw subtle rim light along top edge of dome
    if theme == "dark":
        rim_img = np.zeros((size, size), dtype=np.uint8)
        cv2.polylines(rim_img, [scaled_char], isClosed=True, color=255, thickness=int(size * 0.008), lineType=cv2.LINE_AA)
        rim_weight = (rim_img.astype(np.float32) / 255.0) * np.clip(1.0 - (y / (size * 0.65)), 0.0, 1.0)
    else:
        rim_weight = np.zeros((size, size), dtype=np.float32)

    char_alpha = (char_img.astype(np.float32) / 255.0) * squircle_mask
    
    # Composite character over squircle
    for c in range(3):
        canvas[:, :, c] = canvas[:, :, c] * (1.0 - char_alpha) + char_color[c] * char_alpha
        # Add rim highlight
        canvas[:, :, c] = np.clip(canvas[:, :, c] + char_rim_color[c] * rim_weight * squircle_mask, 0.0, 1.0)

    # Draw Eyes
    for ec in scaled_eyes:
        eye_img = np.zeros((size, size), dtype=np.uint8)
        cv2.fillPoly(eye_img, [ec], 255, cv2.LINE_AA)
        eye_alpha = (eye_img.astype(np.float32) / 255.0) * squircle_mask
        for c in range(3):
            canvas[:, :, c] = canvas[:, :, c] * (1.0 - eye_alpha) + eye_color[c] * eye_alpha

    # Convert to 8-bit RGBA PIL Image
    rgba = (canvas * 255.0).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, mode="RGBA")

# Generate High-Res Masters
print("Rendering Master Dark and Light Icons...")
img_dark = create_master_icon(theme="dark", size=2048)
img_light = create_master_icon(theme="light", size=2048)

# Save Public Web Icons
img_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-dark.png"))
img_light.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-light.png"))

# Standard PWA and App Icons (Default to sleek Dark theme)
img_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "icon.png"))
img_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "apple-icon.png"))
img_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-512.png"))
img_dark.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-192.png"))
img_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "apple-touch-icon.png"))

# PWA Maskable Icon (with safe margin)
maskable = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
scaled_inner = img_dark.resize((410, 410), Image.Resampling.LANCZOS)
maskable.paste(scaled_inner, (51, 51), scaled_inner)
maskable.save(os.path.join(OUTPUT_DIR, "icon-maskable.png"))

# Multi-resolution Favicon.ico (16, 32, 48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_imgs = [img_dark.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
ico_imgs[0].save(os.path.join(ROOT, "src", "app", "favicon.ico"), format="ICO", sizes=ico_sizes)
ico_imgs[0].save(os.path.join(ROOT, "public", "favicon.ico"), format="ICO", sizes=ico_sizes)

# Android Capacitor Mipmaps
mipmap_targets = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

android_res = os.path.join(ROOT, "android", "app", "src", "main", "res")
if os.path.exists(android_res):
    print("Generating Android mipmaps...")
    for folder, dim in mipmap_targets.items():
        folder_path = os.path.join(android_res, folder)
        os.makedirs(folder_path, exist_ok=True)
        # Standard square/squircle icon
        resized_icon = img_dark.resize((dim, dim), Image.Resampling.LANCZOS)
        resized_icon.save(os.path.join(folder_path, "ic_launcher.png"))
        
        # Round icon (circular mask)
        circle_mask = Image.new("L", (dim, dim), 0)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(circle_mask)
        draw.ellipse((0, 0, dim - 1, dim - 1), fill=255)
        round_icon = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
        round_icon.paste(resized_icon, (0, 0), circle_mask)
        round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"))

    # Android Splash Screen
    splash_bg = Image.new("RGBA", (1280, 1920), (5, 5, 5, 255))
    splash_logo = img_dark.resize((360, 360), Image.Resampling.LANCZOS)
    splash_bg.paste(splash_logo, ((1280 - 360) // 2, (1920 - 360) // 2), splash_logo)
    
    # Save splash screens
    drawable_folders = ["drawable", "drawable-port-hdpi", "drawable-port-mdpi", "drawable-port-xhdpi", "drawable-port-xxhdpi", "drawable-port-xxxhdpi"]
    for df in drawable_folders:
        df_path = os.path.join(android_res, df)
        if os.path.exists(df_path):
            splash_bg.save(os.path.join(df_path, "splash.png"))

print("All raster icons successfully generated!")

