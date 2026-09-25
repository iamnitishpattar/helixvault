import pytest
from unittest.mock import patch, MagicMock
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


def _make_mock_groq(reply_text: str):
    """Build a mock Groq client that returns reply_text as the LLM response."""
    mock_choice = MagicMock()
    mock_choice.message.content = reply_text
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion
    return mock_client


def test_copilot_weight_query(test_db):
    user = User(email="copilot@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    f = EncodedFile(user_id=user.id, filename="archive.zip", dna_length_bp=10000, gc_content=50.0)
    test_db.add(f)
    test_db.commit()

    mock_client = _make_mock_groq(
        "Your vault weighs approximately **0.01079 femtograms** of physical DNA."
    )

    with patch("core.ai_copilot._get_groq_client", return_value=mock_client):
        reply = ask_copilot(test_db, user.id, "How much physical weight in femtograms is my vault?")

    assert "femtograms" in reply["response"]
    assert reply["vault_metrics"]["total_bp"] == 10000


def test_copilot_search_query(test_db):
    user = User(email="search_cp@bio.com", hashed_password="pw", is_active=True)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    f = EncodedFile(
        user_id=user.id,
        filename="genome.fasta",
        dna_length_bp=50,
        gc_content=50.0,
        dna_sequence="CCCGATTACAAA",
    )
    test_db.add(f)
    test_db.commit()

    mock_client = _make_mock_groq(
        "Found **1 match** of GATTACA in your vault file genome.fasta."
    )

    with patch("core.ai_copilot._get_groq_client", return_value=mock_client):
        reply = ask_copilot(test_db, user.id, "Search for motif GATTACA in my vault")

    assert "GATTACA" in reply["response"]
    # The motif search tool should have been triggered
    assert reply["tool_used"] in ("motif_search", "search_in_dna", "groq_llm_direct")
