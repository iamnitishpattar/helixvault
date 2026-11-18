import pypdf

reader = pypdf.PdfReader('C:/Users/Nitish Pattar/Desktop/HelixVault_Project_Report_N_1.pdf')
print("Total pages:", len(reader.pages))

# Look at Page 1 (index 0)
page1 = reader.pages[0]
contents = page1.get_contents()
if isinstance(contents, list):
    stream_data = b"".join([c.get_data() for c in contents])
else:
    stream_data = contents.get_data()

print("Length of page 1 stream:", len(stream_data))
decoded_stream = stream_data.decode('latin1', errors='ignore')
# Search for re (rectangle) or lines in the footer area (y around 40 to 100 pt in PDF coords, where (0,0) is bottom-left)
for line in decoded_stream.splitlines():
    if ' re' in line or ' m' in line or ' l' in line:
        # Check if coordinates are in the bottom area of A4 (842 pt height, footer is near bottom, so y < 100)
        tokens = line.split()
        print("Path op:", line[:100])

