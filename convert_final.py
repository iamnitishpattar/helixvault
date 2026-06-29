import os
from PIL import Image

src_homepage = r"C:\Users\Nitish Pattar\.gemini\antigravity\brain\5fa005a2-7b61-4e6f-b504-2191cab81c5e\homepage_final_1781676405602.webp"
src_encoding = r"C:\Users\Nitish Pattar\.gemini\antigravity\brain\5fa005a2-7b61-4e6f-b504-2191cab81c5e\encoding_final_1781676512552.webp"
src_mutation = r"C:\Users\Nitish Pattar\.gemini\antigravity\brain\5fa005a2-7b61-4e6f-b504-2191cab81c5e\mutation_final_1781676632669.webp"

dest_dir = r"e:\new_project_main\assets"

def convert_webp_to_gif(src, dest):
    if not os.path.exists(src): 
        print("Not found:", src)
        return
    im = Image.open(src)
    frames = []
    try:
        while True:
            # We must use P mode with adaptive palette for gifs, but webp is RGB.
            frame = im.copy().convert("RGBA").resize((800, 500), Image.Resampling.LANCZOS)
            frame = frame.convert("P", palette=Image.ADAPTIVE)
            frames.append(frame)
            im.seek(len(frames))
    except EOFError:
        pass
    if frames:
        frames[0].save(dest, format='GIF', append_images=frames[1:], save_all=True, duration=im.info.get('duration', 100), loop=0)
        print(f"Saved {dest} with {len(frames)} frames")

def convert_webp_to_png(src, dest):
    if not os.path.exists(src): return
    im = Image.open(src)
    im.convert("RGBA").save(dest, 'PNG')
    print(f"Saved {dest}")

convert_webp_to_png(src_homepage, os.path.join(dest_dir, "homepage.png"))
convert_webp_to_gif(src_encoding, os.path.join(dest_dir, "encoding.gif"))
convert_webp_to_gif(src_mutation, os.path.join(dest_dir, "mutation.gif"))
