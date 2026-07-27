import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.database import Base
from db.models import EncodedFile, User
from core.ai_copilot import ask_copilot

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

def test_copilot_weight_query(test_db):
    user = User(email="copilot@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    f = EncodedFile(user_id=user.id, filename="archive.zip", dna_length_bp=10000, gc_content=50.0)
    test_db.add(f)
    test_db.commit()

    reply = ask_copilot(test_db, user.id, "How much physical weight in femtograms is my vault?")
    assert "femtograms" in reply["response"]
    assert reply["tool_used"] == "biophysical_calculator"
    assert reply["vault_metrics"]["total_bp"] == 10000

def test_copilot_search_query(test_db):
    user = User(email="search_cp@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    f = EncodedFile(user_id=user.id, filename="genome.fasta", dna_length_bp=50, gc_content=50.0, dna_sequence="CCCGATTACAAA")
    test_db.add(f)
    test_db.commit()

    reply = ask_copilot(test_db, user.id, "Search for motif GATTACA in my vault")
    assert "GATTACA" in reply["response"]
    assert reply["tool_used"] == "search_in_dna"
    assert reply["tool_results"]["total_matches"] == 1
