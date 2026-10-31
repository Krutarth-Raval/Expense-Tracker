import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(ROOT, "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Mathematical Bezier Curves
def cubic_bezier(p0, p1, p2, p3, n=200):
    t = np.linspace(0, 1, n)[:, None]
    return ((1-t)**3 * p0 + 3*(1-t)**2*t * p1 + 3*(1-t)*t**2 * p2 + t**3 * p3)

def generate_dome_path(size):
    # Scale points to size
    s = size / 512.0
    seg1 = cubic_bezier(np.array([54, 460]) * s, np.array([54, 340]) * s, np.array([52, 230]) * s, np.array([105, 185]) * s)
    seg2 = cubic_bezier(np.array([105, 185]) * s, np.array([145, 148]) * s, np.array([190, 142]) * s, np.array([250, 142]) * s)
    seg3 = cubic_bezier(np.array([250, 142]) * s, np.array([325, 142]) * s, np.array([385, 185]) * s, np.array([408, 255]) * s)
    seg4 = cubic_bezier(np.array([408, 255]) * s, np.array([422, 320]) * s, np.array([424, 395]) * s, np.array([422, 460]) * s)
    
    pts = np.vstack([seg1, seg2, seg3, seg4, np.array([[422*s, 460*s], [54*s, 460*s]])])
    return pts

def generate_eye_path(x, y, w, h, n=60):
    p_tr = np.array([x + w, y])
    p_br = np.array([x + w, y + h])
    p_bl = np.array([x + w * 0.05, y + h])
    p_ml = np.array([x + w * 0.05, y + h * 0.50])
    p_shelf = np.array([x + w * 0.52, y + h * 0.50])
    p_inner_top = np.array([x + w * 0.52, y + h * 0.30])
    p_tip = np.array([x, y + h * 0.22])
    
    c_crest = cubic_bezier(p_tip, np.array([x, y + h * 0.04]), np.array([x + w * 0.25, y]), p_tr, n)
    c_inner = cubic_bezier(p_inner_top, np.array([x + w * 0.32, y + h * 0.30]), np.array([x + w * 0.10, y + h * 0.28]), p_tip, n)
    
    pts = np.vstack([c_crest, [p_br], [p_bl], [p_ml], [p_shelf], [p_inner_top], c_inner])
    return pts

def create_superellipse_mask(size, n=4.4):
    y, x = np.ogrid[:size, :size]
    cx, cy = size / 2.0, size / 2.0
    r = size * 0.455  # Apple squircle bounds
    dist = (np.abs((x - cx) / r) ** n + np.abs((y - cy) / r) ** n)
    mask = np.clip(1.0 - (dist - 1.0) * (size / 6.0), 0.0, 1.0)
    return mask

# Render Master Ultra-HD Icon at 2048x2048
def render_a1_icon(theme="dark", size=2048):
    scale = size / 512.0
    squircle_mask = create_superellipse_mask(size)
    
    # Base Canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # 1. Background Fill with Liquid Glass Surface
    if theme == "dark":
        bg_color = (10, 10, 10, 255)
        dome_color = (20, 20, 20, 255)
        dome_rim_color = (80, 80, 80, 255)
        border_top = (255, 255, 255, 55)
        border_bot = (30, 30, 30, 80)
        specular_sheen = 35
    else:
        bg_color = (246, 246, 248, 255)
        dome_color = (18, 18, 18, 255)
        dome_rim_color = (40, 40, 40, 255)
        border_top = (255, 255, 255, 220)
        border_bot = (180, 180, 180, 120)
        specular_sheen = 160

    # Fill Squircle Base
    base_layer = Image.new("RGBA", (size, size), bg_color)
    base_mask_pil = Image.fromarray((squircle_mask * 255).astype(np.uint8), mode="L")
    img.paste(base_layer, (0, 0), base_mask_pil)

    # 2. Render Character Dome
    dome_pts = generate_dome_path(size)
    dome_mask = Image.new("L", (size, size), 0)
    draw_dome = ImageDraw.Draw(dome_mask)
    draw_dome.polygon([tuple(p) for p in dome_pts], fill=255)
    
    # Anti-alias dome mask slightly with GaussianBlur
    dome_mask = dome_mask.filter(ImageFilter.GaussianBlur(radius=scale * 0.8))
    
    # Combine dome mask with squircle mask
    combined_dome_mask = Image.fromarray(
        (np.array(dome_mask).astype(float) / 255.0 * squircle_mask * 255.0).astype(np.uint8), mode="L"
    )
    
    dome_layer = Image.new("RGBA", (size, size), dome_color)
    img.paste(dome_layer, (0, 0), combined_dome_mask)

    # In dark mode, add smooth ambient rim on top of dome
    if theme == "dark":
        rim_img = Image.new("L", (size, size), 0)
        draw_rim = ImageDraw.Draw(rim_img)
        draw_rim.line([tuple(p) for p in dome_pts[:-2]], fill=255, width=int(scale * 3.5))
        rim_img = rim_img.filter(ImageFilter.GaussianBlur(radius=scale * 2.0))
        
        # Soften and mask to upper dome
        y_arr, _ = np.ogrid[:size, :size]
        fade = np.clip(1.0 - (y_arr / (size * 0.65)), 0.0, 1.0)
        rim_alpha = (np.array(rim_img).astype(float) / 255.0 * fade * squircle_mask * 120.0).astype(np.uint8)
        rim_layer = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        img.paste(rim_layer, (0, 0), Image.fromarray(rim_alpha, mode="L"))

    # 3. Render Crisp Solid White Quotation Eyes
    eye_mask = Image.new("L", (size, size), 0)
    draw_eyes = ImageDraw.Draw(eye_mask)
    
    # Left eye: (226, 222, 54, 66) scaled
    e1_pts = generate_eye_path(226 * scale, 222 * scale, 54 * scale, 66 * scale)
    # Right eye: (296, 218, 54, 66) scaled
    e2_pts = generate_eye_path(296 * scale, 218 * scale, 54 * scale, 66 * scale)
    
    draw_eyes.polygon([tuple(p) for p in e1_pts], fill=255)
    draw_eyes.polygon([tuple(p) for p in e2_pts], fill=255)
    
    eye_mask = eye_mask.filter(ImageFilter.GaussianBlur(radius=scale * 0.5))
    eyes_layer = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img.paste(eyes_layer, (0, 0), eye_mask)

    # 4. Apple Liquid Glass Top Specular Sheen (Curved reflection)
    sheen_mask = Image.new("L", (size, size), 0)
    draw_sheen = ImageDraw.Draw(sheen_mask)
    # Draw curved crescent reflection
    sheen_pts = [
        (int(40 * scale), int(60 * scale)),
        (int(256 * scale), int(30 * scale)),
        (int(472 * scale), int(60 * scale)),
        (int(360 * scale), int(150 * scale)),
        (int(256 * scale), int(170 * scale)),
        (int(152 * scale), int(150 * scale)),
    ]
    draw_sheen.polygon(sheen_pts, fill=specular_sheen)
    sheen_mask = sheen_mask.filter(ImageFilter.GaussianBlur(radius=scale * 18.0))
    # Clip sheen to squircle
    sheen_clipped = Image.fromarray(
        (np.array(sheen_mask).astype(float) / 255.0 * squircle_mask * 255.0).astype(np.uint8), mode="L"
    )
    sheen_layer = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img.paste(sheen_layer, (0, 0), sheen_clipped)

    # 5. Liquid Glass Beveled Border Rim (Subtle continuous rim)
    # Distance gradient for 1.5px bevel
    y_g, x_g = np.ogrid[:size, :size]
    cx, cy = size / 2.0, size / 2.0
    r = size * 0.455
    dist = (np.abs((x_g - cx) / r) ** 4.4 + np.abs((y_g - cy) / r) ** 4.4)
    # Rim width
    rim_w = 0.012
    rim_val = np.clip(1.0 - np.abs(dist - 1.0) / rim_w, 0.0, 1.0)
    # Top highlight vs bottom shadow
    vert_fade = (y_g / size)
    top_rim = rim_val * (1.0 - vert_fade) * border_top[3]
    bot_rim = rim_val * vert_fade * border_bot[3]
    
    rim_rgba = np.zeros((size, size, 4), dtype=np.uint8)
    rim_rgba[:, :, :3] = 255 if theme == "dark" else 128
    rim_rgba[:, :, 3] = (top_rim + bot_rim).clip(0, 255).astype(np.uint8)
    rim_pil = Image.fromarray(rim_rgba, mode="RGBA")
    
    img = Image.alpha_composite(img, rim_pil)
    return img

print("Generating 2048x2048 A1 Quality Master Icons...")
master_dark = render_a1_icon("dark", 2048)
master_light = render_a1_icon("light", 2048)

# Save Master Icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-dark.png"))
master_light.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-light.png"))

# Next.js App Router root icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "icon.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(ROOT, "src", "app", "apple-icon.png"))

# PWA Icons
master_dark.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-512.png"))
master_dark.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "icon-192.png"))
master_dark.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(OUTPUT_DIR, "apple-touch-icon.png"))

# PWA Maskable Icon (safe centered zone)
maskable = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
scaled_inner = master_dark.resize((410, 410), Image.Resampling.LANCZOS)
maskable.paste(scaled_inner, (51, 51), scaled_inner)
maskable.save(os.path.join(OUTPUT_DIR, "icon-maskable.png"))

# 6. Hand-Tuned Multi-Resolution Crisp Favicon (16, 32, 48)
# At 16x16, downscaling a 512px icon makes thin features blurry. We construct a bespoke 16x16 and 32x32 favicon!
def render_crisp_favicon(size=16):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dark rounded squircle base
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=max(2, int(size * 0.22)), fill=(10, 10, 10, 255), outline=(60, 60, 60, 255))
    
    # Dome silhouette
    if size == 16:
        # Dome block
        draw.polygon([(2, 14), (2, 7), (5, 4), (10, 4), (13, 7), (13, 14)], fill=(22, 22, 22, 255))
        # Eyes: two 2x3 brilliant white blocks with top hook
        # Left eye at (7, 6)
        img.putpixel((7, 6), (255, 255, 255, 255))
        img.putpixel((8, 6), (255, 255, 255, 255))
        img.putpixel((8, 7), (255, 255, 255, 255))
        img.putpixel((8, 8), (255, 255, 255, 255))
        img.putpixel((7, 8), (255, 255, 255, 255))
        # Right eye at (10, 6)
        img.putpixel((10, 6), (255, 255, 255, 255))
        img.putpixel((11, 6), (255, 255, 255, 255))
        img.putpixel((11, 7), (255, 255, 255, 255))
        img.putpixel((11, 8), (255, 255, 255, 255))
        img.putpixel((10, 8), (255, 255, 255, 255))
    elif size == 32:
        # 32x32 dome
        draw.polygon([(4, 29), (4, 15), (9, 9), (18, 8), (26, 13), (27, 29)], fill=(22, 22, 22, 255))
        # Left Eye (14, 13)
        draw.rectangle([14, 17, 17, 21], fill=(255, 255, 255, 255))
        draw.rectangle([16, 13, 17, 17], fill=(255, 255, 255, 255))
        draw.rectangle([13, 13, 16, 15], fill=(255, 255, 255, 255))
        # Right Eye (19, 13)
        draw.rectangle([20, 17, 23, 21], fill=(255, 255, 255, 255))
        draw.rectangle([22, 13, 23, 17], fill=(255, 255, 255, 255))
        draw.rectangle([19, 13, 22, 15], fill=(255, 255, 255, 255))
    else:
        # 48x48 from high-res master with contrast boost
        sub = master_dark.resize((48, 48), Image.Resampling.LANCZOS)
        return sub
    return img

fav_16 = render_crisp_favicon(16)
fav_32 = render_crisp_favicon(32)
fav_48 = render_crisp_favicon(48)

# Save multi-size favicon.ico
fav_16.save(os.path.join(ROOT, "src", "app", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])
fav_16.save(os.path.join(ROOT, "public", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav_32, fav_48])

# 7. Android Mipmaps
mipmap_targets = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

android_res = os.path.join(ROOT, "android", "app", "src", "main", "res")
if os.path.exists(android_res):
    print("Generating Android mipmaps and adaptive icons...")
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

print("All raster icons and favicons successfully built with A1 quality!")
