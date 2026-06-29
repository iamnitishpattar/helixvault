import glob

files = glob.glob('frontend/src/**/*.jsx', recursive=True)
search_str = "${import.meta.env.VITE_API_URL || 'https://helixvault.onrender.com'}"

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if search_str in content:
        content = content.replace(search_str, "https://helixvault.onrender.com")
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Fixed URL in', f)
