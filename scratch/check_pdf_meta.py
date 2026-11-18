with open('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_N_1.pdf', 'rb') as f:
    text = f.read().decode('latin1', errors='ignore')
    import re
    m = re.findall(r'/(?:Producer|Creator)\s*\(([^)]+)\)', text)
    print("Producer / Creator matches:", m)

