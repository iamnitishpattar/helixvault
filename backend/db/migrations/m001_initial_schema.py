"""
HelixVault Database Migration: m001_initial_schema
Creates initial tables and adds tracking columns (dna_sequence, text_preview) if missing.
"""
import sqlite3
import os
import logging

logger = logging.getLogger("helixvault")

def run_migration(db_path: str = "helixvault.db") -> bool:
    """Runs the initial schema migration on the target database."""
    if not os.path.exists(db_path):
        # Try checking inside db/ directory
        if os.path.exists(os.path.join("db", db_path)):
            db_path = os.path.join("db", db_path)
        elif os.path.exists(os.path.join("backend", db_path)):
            db_path = os.path.join("backend", db_path)
        elif os.path.exists(os.path.join("backend", "db", "helixvault.db")):
            db_path = os.path.join("backend", "db", "helixvault.db")
        else:
            logger.info(f"Migration m001: Database file {db_path} not found yet. Will be created by SQLAlchemy on startup.")
            return True

    logger.info(f"Running migration m001_initial_schema on {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check existing columns in encoded_files
        cursor.execute("PRAGMA table_info(encoded_files)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if columns: # Table exists
            if 'dna_sequence' not in columns:
                logger.info("Migration m001: Adding dna_sequence column...")
                cursor.execute("ALTER TABLE encoded_files ADD COLUMN dna_sequence TEXT")
                conn.commit()
                
            if 'text_preview' not in columns:
                logger.info("Migration m001: Adding text_preview column...")
                cursor.execute("ALTER TABLE encoded_files ADD COLUMN text_preview TEXT")
                conn.commit()
        else:
            logger.info("Migration m001: encoded_files table does not exist yet; skipping ALTER TABLE.")
            
        conn.close()
        logger.info("Migration m001_initial_schema completed successfully.")
        return True
    except Exception as e:
        logger.error(f"Migration m001 failed: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration()
