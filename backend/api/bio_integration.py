from fastapi import APIRouter, HTTPException, Depends, Request, Query, Path
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings
import requests
from Bio import Entrez
from Bio import SeqIO
import io
import math
from api.auth import get_current_user
from db.models import User
import logging
import os
from dotenv import load_dotenv
from cachetools import cached, TTLCache

logger = logging.getLogger("helixvault")

router = APIRouter()

load_dotenv()

# Read NCBI credentials from environment
Entrez.email = os.getenv("ENTREZ_EMAIL", "hello@helixvault.com")
_ncbi_api_key = os.getenv("NCBI_API_KEY", "")
if _ncbi_api_key:
    Entrez.api_key = _ncbi_api_key

# Define TTL caches for bio API responses
search_cache = TTLCache(maxsize=100, ttl=3600)
sequence_cache = TTLCache(maxsize=100, ttl=3600)
ensembl_cache = TTLCache(maxsize=100, ttl=3600)

@cached(cache=search_cache)
def _search_ncbi_cached(query: str, max_results: int, page: int):
    retstart = (page - 1) * max_results
    handle = Entrez.esearch(
        db="nucleotide", term=query, retmax=max_results, retstart=retstart)
    record = Entrez.read(handle)
    handle.close()
    
    total_count = int(record.get("Count", 0))
    total_pages = math.ceil(total_count / max_results) if total_count > 0 else 0

    results = []
    if record["IdList"]:
        # Fetch summaries
        summary_handle = Entrez.esummary(
            db="nucleotide", id=",".join(record["IdList"]))
        summaries = Entrez.read(summary_handle)
        summary_handle.close()

        for summary in summaries:
            results.append({
                "id": summary["Id"],
                "accession": summary.get("Caption", ""),
                "title": summary.get("Title", ""),
                "length": summary.get("Length", 0)
            })
    return total_count, total_pages, results


@router.get("/ncbi/search")
@limiter.limit(rate_limit_settings.RATE_LIMIT_PUBLIC)
async def search_ncbi(
    request: Request,
    query: str = Query(..., min_length=1, max_length=100, description="NCBI search query"),
    max_results: int = Query(5, ge=1, le=50, description="Maximum results to return"),
    page: int = Query(1, ge=1, description="Page number"),
    current_user: User = Depends(get_current_user)
):
    """Search the NCBI nucleotide database."""
    try:
        total_count, total_pages, results = _search_ncbi_cached(query, max_results, page)
        return {
            "status": "success", 
            "results": results,
            "pagination": {
                "total_count": total_count,
                "total_pages": total_pages,
                "current_page": page,
                "max_results_per_page": max_results
            }
        }
    except Exception as e:
        logger.error(f"Error in NCBI search: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="External biological database service is currently unavailable or returned an error.")


@cached(cache=sequence_cache)
def _fetch_ncbi_sequence_cached(db_id: str):
    handle = Entrez.efetch(db="nucleotide", id=db_id,
                           rettype="fasta", retmode="text")
    fasta_data = handle.read()
    handle.close()

    # Parse for basic info
    record = SeqIO.read(io.StringIO(fasta_data), "fasta")

    return {
        "status": "success",
        "fasta": fasta_data,
        "id": record.id,
        "description": record.description,
        "sequence": str(record.seq)
    }

@router.get("/ncbi/fetch/{db_id}")
@limiter.limit(rate_limit_settings.RATE_LIMIT_PUBLIC)
async def fetch_ncbi_sequence(
    request: Request,
    db_id: str = Path(..., min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_\.]+$", description="NCBI Database ID"),
    current_user: User = Depends(get_current_user)
):
    """Fetch a specific sequence in FASTA format."""
    try:
        return _fetch_ncbi_sequence_cached(db_id)
    except Exception as e:
        logger.error(f"Error in NCBI sequence fetch: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to retrieve sequence from external biological database.")


@cached(cache=ensembl_cache)
def _fetch_ensembl_gene_cached(symbol: str, species: str):
    server = "https://rest.ensembl.org"
    ext = f"/lookup/symbol/{species}/{symbol}?expand=1"

    r = requests.get(
        server+ext, headers={"Content-Type": "application/json"})

    if not r.ok:
        r.raise_for_status()

    return r.json()

@router.get("/ensembl/gene/{symbol}")
async def fetch_ensembl_gene(symbol: str, species: str = "human", current_user: User = Depends(get_current_user)):
    """Fetch gene information from Ensembl."""
    try:
        data = _fetch_ensembl_gene_cached(symbol, species)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Error in Ensembl lookup: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to retrieve gene data from Ensembl service.")
