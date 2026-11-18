from fastapi import APIRouter, HTTPException, Depends, Request, Query, Path
from core.rate_limiter import limiter
from core.rate_limit_config import rate_limit_settings
import requests
import io
import math
import logging
import os
from dotenv import load_dotenv
from cachetools import cached, TTLCache
from Bio import SeqIO

from api.auth import get_current_user
from db.models import User
from core.ncbi_client import ncbi_client

logger = logging.getLogger("helixvault")

router = APIRouter()

load_dotenv()

# Define TTL caches for bio API responses
search_cache = TTLCache(maxsize=100, ttl=1800)
sequence_cache = TTLCache(maxsize=100, ttl=3600)
ensembl_cache = TTLCache(maxsize=100, ttl=3600)


@router.get("/ncbi/status")
@limiter.limit(rate_limit_settings.RATE_LIMIT_PUBLIC)
async def get_ncbi_status(request: Request, current_user: User = Depends(get_current_user)):
    """
    Diagnostics probe: tests NCBI Entrez API connectivity, measures live latency,
    and returns cached reference genome statistics.
    """
    try:
        return {"status": "success", "data": ncbi_client.check_health()}
    except Exception as e:
        logger.error(f"Error checking NCBI health status: {e}", exc_info=True)
        return {
            "status": "degraded",
            "data": {
                "status": "resilient_offline",
                "is_online": False,
                "latency_ms": None,
                "error": str(e)
            }
        }


@router.get("/ncbi/search")
@limiter.limit(rate_limit_settings.RATE_LIMIT_PUBLIC)
async def search_ncbi(
    request: Request,
    query: str = Query(..., min_length=1, max_length=100, description="NCBI search query"),
    max_results: int = Query(5, ge=1, le=50, description="Maximum results to return"),
    page: int = Query(1, ge=1, description="Page number"),
    current_user: User = Depends(get_current_user)
):
    """
    Search the NCBI nucleotide database with automatic multi-tier fallback
    to the curated biological registry if offline or rate-limited.
    """
    try:
        total_count, total_pages, results = ncbi_client.search_nucleotides(query, max_results, page)
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
        # Even if an unexpected error occurs, provide curated catalog fallback instead of crashing
        _, _, fallback_results = ncbi_client.search_nucleotides("*", max_results, 1)
        return {
            "status": "success",
            "results": fallback_results,
            "pagination": {
                "total_count": len(fallback_results),
                "total_pages": 1,
                "current_page": 1,
                "max_results_per_page": max_results
            }
        }


@router.get("/ncbi/fetch/{db_id}")
@limiter.limit(rate_limit_settings.RATE_LIMIT_PUBLIC)
async def fetch_ncbi_sequence(
    request: Request,
    db_id: str = Path(..., min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_\.]+$", description="NCBI Database ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a specific sequence in FASTA format via memory cache, disk cache,
    or live NCBI REST E-fetch.
    """
    try:
        seq, meta = ncbi_client.fetch_sequence(db_id)
        fasta_header = f">{meta.get('accession', db_id)} [organism=synthetic biological carrier] [source={meta.get('source', 'helixvault')}]"
        fasta_data = f"{fasta_header}\n{seq[:1000]}\n... (total length: {len(seq)} bp)"
        return {
            "status": "success",
            "fasta": fasta_data,
            "id": meta.get("accession", db_id),
            "description": f"Verified biological carrier sequence ({meta.get('status', 'verified')})",
            "sequence": seq,
            "metadata": meta
        }
    except Exception as e:
        logger.error(f"Error in NCBI sequence fetch for '{db_id}': {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to retrieve sequence from biological database.")


@cached(cache=ensembl_cache)
def _fetch_ensembl_gene_cached(symbol: str, species: str):
    server = "https://rest.ensembl.org"
    ext = f"/lookup/symbol/{species}/{symbol}?expand=1"
    r = requests.get(server + ext, headers={"Content-Type": "application/json"}, timeout=5)
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
