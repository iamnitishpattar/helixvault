import os

desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "DNA_Storage_Papers")

ppt_names = [
    "1. BioRxiv (2024) - Challenges for error-correction coding in DNA data storage.pdf",
    "2. Nature Computational Science (2025) - Advances in enzymatic DNA synthesis for archival storage.pdf",
    "3. SNIA (2026) - DNA Data Storage Technology Review Automation.pdf",
    "4. ResearchGate (2026) - A Survey on DNA-Based Cryptography and Steganography.pdf",
    "5. RSC Advances (2026) - Bio-inspired approaches to in vivo DNA data storage.pdf",
    "6. IEEE Access (2025) - AI-driven error correction for indels in DNA channels.pdf",
    "7. Precedence Research (2025) - Deeply cold archival Integrating DNA into data centers.pdf",
    "8. Advanced Science (2024) - Homopolymer-free Base-3 encoding frameworks.pdf",
    "9. National Science Review (2024) - High-throughput photolithographic synthesis.pdf",
    "10. DNA Alliance (2026) - Standardizing molecular handling in commercial DNA.pdf"
]

if os.path.exists(desktop_path):
    files = sorted([f for f in os.listdir(desktop_path) if f.endswith('.pdf') and not f.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.'))])
    
    # If we have exactly 10 unnamed ones from our previous download
    for idx, (old_file, new_name) in enumerate(zip(files, ppt_names)):
        old_path = os.path.join(desktop_path, old_file)
        new_path = os.path.join(desktop_path, new_name)
        os.rename(old_path, new_path)
        print(f"Renamed: {new_name}")
else:
    print("Folder not found.")
