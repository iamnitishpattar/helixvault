import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import os
import time

def download_recent_dna_papers():
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "DNA_Storage_Papers")
    if not os.path.exists(desktop_path):
        os.makedirs(desktop_path)
    
    print(f"Downloading papers to: {desktop_path}")
    
    query = 'all:"DNA data storage"'
    url = f'http://export.arxiv.org/api/query?search_query={urllib.parse.quote(query)}&sortBy=submittedDate&sortOrder=descending&max_results=20'
    
    try:
        response = urllib.request.urlopen(url)
        xml_data = response.read()
        root = ET.fromstring(xml_data)
        
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        count = 0
        for entry in root.findall('atom:entry', namespace):
            if count >= 10:
                break
                
            title_node = entry.find('atom:title', namespace)
            title = title_node.text.replace('\n', ' ').strip() if title_node is not None else "Unknown"
            pub_node = entry.find('atom:published', namespace)
            published = pub_node.text if pub_node is not None else "2024-01-01"
            year = published.split('-')[0]
            
            # We want recent papers (2024-2026) or just the 10 most recent ones.
            # arXiv sorts by submittedDate descending, so these are the newest.
            
            pdf_link = None
            for link in entry.findall('atom:link', namespace):
                if link.get('title') == 'pdf':
                    pdf_link = link.get('href')
                    break
            
            if pdf_link:
                # Sanitize filename
                safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
                # Limit length
                safe_title = safe_title[:100]
                filename = f"[{year}] {safe_title}.pdf"
                filepath = os.path.join(desktop_path, filename)
                
                print(f"Downloading: {filename}")
                try:
                    # add .pdf if not present in arXiv link
                    if not pdf_link.endswith('.pdf'):
                        pdf_link += '.pdf'
                    urllib.request.urlretrieve(pdf_link, filepath)
                    count += 1
                    time.sleep(1) # Be nice to arXiv API
                except Exception as e:
                    print(f"Failed to download {filename}: {e}")
                    
        print(f"\nSuccessfully downloaded {count} papers to your Desktop!")
        
    except Exception as e:
        print(f"Error querying arXiv: {e}")

if __name__ == '__main__':
    download_recent_dna_papers()
