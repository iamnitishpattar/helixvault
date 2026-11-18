import docx

doc = docx.Document('C:/Users/Nitish Pattar/Downloads/HelixVault_Project_Report_Nitish.docx')
for s_idx, s in enumerate(doc.sections):
    print(f'=== Section {s_idx} ===')
    print('Bottom margin:', s.bottom_margin.inches if s.bottom_margin else 'None')
    print('Footer distance:', s.footer_distance.inches if s.footer_distance else 'None')
    for p_idx, p in enumerate(s.footer.paragraphs):
        print(f'Footer P{p_idx}: text="{p.text}"')
        print('  XML:', p._p.xml)
    for t_idx, t in enumerate(s.footer.tables):
        print(f'Footer Table {t_idx}:')
        print('  XML:', t._tbl.xml)

