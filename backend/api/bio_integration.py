from fastapi import APIRouter, HTTPException, Depends
import requests
from Bio import Entrez
from Bio import SeqIO
import io
from api.auth import get_current_user
from db.models import User

router = APIRouter()

# Always tell NCBI who you are (email address)
Entrez.email = "mca_project_helixvault@example.com"


@router.get("/ncbi/search")
async def search_ncbi(query: str, max_results: int = 5, current_user: User = Depends(get_current_user)):
    """Search the NCBI nucleotide database."""
    try:
        handle = Entrez.esearch(
            db="nucleotide", term=query, retmax=max_results)
        record = Entrez.read(handle)
        handle.close()

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

        return {"status": "success", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ncbi/fetch/{db_id}")
async def fetch_ncbi_sequence(db_id: str, current_user: User = Depends(get_current_user)):
    """Fetch a specific sequence in FASTA format."""
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ensembl/gene/{symbol}")
async def fetch_ensembl_gene(symbol: str, species: str = "human", current_user: User = Depends(get_current_user)):
    """Fetch gene information from Ensembl."""
    try:
        server = "https://rest.ensembl.org"
        ext = f"/lookup/symbol/{species}/{symbol}?expand=1"

        r = requests.get(
            server+ext, headers={"Content-Type": "application/json"})

        if not r.ok:
            r.raise_for_status()

        return {"status": "success", "data": r.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
