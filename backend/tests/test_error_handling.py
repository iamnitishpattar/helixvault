from fastapi import HTTPException
from fastapi.testclient import TestClient

from api.dna_storage import process_decode, task_store
from main import app


@app.get("/__tests__/unsafe-client-error")
def unsafe_client_error():
    raise HTTPException(
        status_code=400,
        detail=r"sqlite3.OperationalError at E:\new_project_main\backend\db\helixvault.db",
    )


@app.get("/__tests__/unsafe-server-error")
def unsafe_server_error():
    raise HTTPException(
        status_code=500,
        detail=r"Traceback at E:\new_project_main\backend\main.py",
    )


@app.get("/__tests__/unhandled-error")
def unhandled_error():
    raise RuntimeError(r"Traceback leak at E:\new_project_main\backend\main.py")


client = TestClient(app, raise_server_exceptions=False)


def assert_no_internal_detail(detail):
    assert "OperationalError" not in detail
    assert "Traceback" not in detail
    assert "new_project_main" not in detail
    assert "helixvault.db" not in detail
    assert "main.py" not in detail


def test_unsafe_http_detail_is_sanitized_even_for_client_errors():
    response = client.get("/__tests__/unsafe-client-error")
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail == "An internal server error occurred. Please try again later."
    assert_no_internal_detail(detail)


def test_http_500_detail_is_sanitized():
    response = client.get("/__tests__/unsafe-server-error")
    assert response.status_code == 500
    detail = response.json()["detail"]
    assert detail == "An internal server error occurred. Please try again later."
    assert_no_internal_detail(detail)


def test_unhandled_exception_is_sanitized():
    response = client.get("/__tests__/unhandled-error")
    assert response.status_code == 500
    detail = response.json()["detail"]
    assert detail == "An internal server error occurred. Please try again later."
    assert_no_internal_detail(detail)


def test_request_validation_error_is_generic():
    response = client.get("/api/dna/status/not-a-uuid")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail == "Invalid request. Please check your input and try again."


def test_decode_task_failure_does_not_expose_exception_detail():
    task_id = "00000000-0000-0000-0000-000000000000"
    task_store.pop(task_id, None)

    process_decode(
        task_id=task_id,
        contents=b"not a fasta or genbank payload",
        filename="bad.gb",
        password=None,
        use_error_correction=False,
        use_steganography=False,
    )

    assert task_store[task_id]["status"] == "failed"
    assert task_store[task_id]["error"] == "File decoding failed. Incorrect password, corrupted sequence, or invalid format."
    assert "No sequence found" not in task_store[task_id]["error"]