"""
Create a clean, lightweight ZIP archive of HelixVault for Zenodo submission.
"""
import os
import zipfile

BASE_DIR = r"e:\new_project_main"
OUT_WORKSPACE = r"e:\new_project_main\HelixVault_Source_Code_and_Database.zip"

EXCLUDE_DIRS = {
    'node_modules', '__pycache__', '.pytest_cache', '.git', '.github',
    '.vscode', 'dist', 'build', '.vite', 'ci_logs', 'scratch',
    '.venv', 'venv', 'temp_uploads'
}

EXCLUDE_FILES = {
    '.env', '.env.local', '.env.production',
    'decoded_virat_kohli.mp4', 'logs.zip', 'helixvault.db', 'test_ci.db'
}

EXCLUDE_EXTS = {
    '.pyc', '.pyo', '.pyd'
}

total = 0
with zipfile.ZipFile(OUT_WORKSPACE, 'w', zipfile.ZIP_DEFLATED) as zf:
    # 1. Root files
    for fn in ['README.md', 'LICENSE', 'docker-compose.yml', 'start_project.bat']:
        fp = os.path.join(BASE_DIR, fn)
        if os.path.exists(fp):
            zf.write(fp, arcname=f"helixvault/{fn}")
            total += 1

    # 2. Sample data files
    for fn in os.listdir(BASE_DIR):
        if fn.endswith('.fasta') or fn in ['dna_test_payload.fasta', 'sample_payload.txt']:
            fp = os.path.join(BASE_DIR, fn)
            zf.write(fp, arcname=f"helixvault/samples/{fn}")
            total += 1

    # 3. Backend
    backend_dir = os.path.join(BASE_DIR, 'backend')
    for root, dirs, files in os.walk(backend_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES or any(f.endswith(ext) for ext in EXCLUDE_EXTS):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, BASE_DIR)
            zf.write(full_path, arcname=f"helixvault/{rel_path}")
            total += 1

    # 4. Frontend
    frontend_dir = os.path.join(BASE_DIR, 'frontend')
    for root, dirs, files in os.walk(frontend_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES or any(f.endswith(ext) for ext in EXCLUDE_EXTS):
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, BASE_DIR)
            zf.write(full_path, arcname=f"helixvault/{rel_path}")
            total += 1

size_mb = os.path.getsize(OUT_WORKSPACE) / (1024 * 1024)
print(f"SUCCESS: Packaged {total} files into {OUT_WORKSPACE} ({size_mb:.2f} MB)")
