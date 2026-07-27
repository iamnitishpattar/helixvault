import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.database import Base
from db.models import EncodedFile, User
from core.bio_compute import search_in_dna, execute_dna_query

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()

def test_search_in_dna_motif(test_db):
    user = User(email="test@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    file_rec = EncodedFile(
        user_id=user.id,
        filename="test_seq.fasta",
        original_size_bytes=100,
        dna_length_bp=30,
        gc_content=50.0,
        dna_sequence="ATGCGATTACACCCGATTACAAATTTGGG"
    )
    test_db.add(file_rec)
    test_db.commit()

    res = search_in_dna(test_db, user.id, "GATTACA", mode="motif")
    assert res["total_matches"] == 2
    assert len(res["results"]) == 1
    assert res["results"][0]["matches"][0]["sequence"] == "GATTACA"

def test_execute_dna_query_filter(test_db):
    user = User(email="filter@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    f1 = EncodedFile(user_id=user.id, filename="low_gc.bin", gc_content=35.0, dna_length_bp=100, is_encrypted=True)
    f2 = EncodedFile(user_id=user.id, filename="high_gc.bin", gc_content=65.0, dna_length_bp=200, is_encrypted=False)
    test_db.add_all([f1, f2])
    test_db.commit()

    filtered = execute_dna_query(test_db, user.id, min_gc=50.0, max_gc=100.0)
    assert filtered["total_matching_files"] == 1
    assert filtered["results"][0]["filename"] == "high_gc.bin"
