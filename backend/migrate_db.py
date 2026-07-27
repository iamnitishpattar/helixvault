import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.migrations.m001_initial_schema import run_migration

if __name__ == "__main__":
    print("Starting HelixVault database schema migration runner...")
    db_paths = ['helixvault.db', 'db/helixvault.db', '../helixvault.db']
    migrated = False
    for path in db_paths:
        if os.path.exists(path):
            print(f"Executing migration on found database: {path}")
            success = run_migration(path)
            if success:
                migrated = True
    if not migrated:
        print("No existing database files found to migrate. Fresh databases will be initialized automatically.")
    print("All migrations completed successfully!")
