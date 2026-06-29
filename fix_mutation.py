from playwright.sync_api import sync_playwright
import time
from PIL import Image
import os

URL = "https://helixvault-omega.vercel.app"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "14325678"
ASSETS_DIR = "e:/new_project_main/assets"

def fix_mutation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        print("Logging in...")
        page.goto(f"{URL}/login")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Encoder', timeout=10000)
        
        print("Navigating to encoder...")
        page.goto(f"{URL}/encode")
        page.wait_for_timeout(2000)
        
        print("Clicking Decode to Data tab...")
        try:
            page.click('button:has-text("Decode to Data")')
        except Exception as e:
            print("Failed to click Decode tab", e)
        page.wait_for_timeout(1000)
        
        with open("test.gb", "w") as f:
            f.write("LOCUS       test_sequence             10 bp    DNA     linear   UNK 01-JAN-1980\nFEATURES             Location/Qualifiers\nORIGIN\n        1 atcgatcgat\n//")
        
        try:
            page.set_input_files('input[type="file"]', 'test.gb')
        except Exception as e:
            print("Failed to set input file:", e)
            
        try:
            page.click('button:has-text("Simulate Mutation")')
        except:
            try:
                page.click('button:has-text("Simulate")')
            except: pass
            
        print("Recording 6 seconds of animation...")
        frames = []
        end_time = time.time() + 6
        i = 0
        while time.time() < end_time:
            path = f"temp_mut_{i}.png"
            page.screenshot(path=path)
            im = Image.open(path)
            frame = im.convert("RGBA").resize((800, 500), Image.Resampling.LANCZOS).convert("P", palette=Image.ADAPTIVE)
            frames.append(frame)
            os.remove(path)
            page.wait_for_timeout(500)
            i += 1
            
        out_path = os.path.join(ASSETS_DIR, "mutation.gif")
        frames[0].save(out_path, format='GIF', append_images=frames[1:], save_all=True, duration=500, loop=0)
        print(f"Successfully captured mutation.gif with {len(frames)} frames")
        
        browser.close()
        if os.path.exists("test.gb"):
            os.remove("test.gb")

fix_mutation()
