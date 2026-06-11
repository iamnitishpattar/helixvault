from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.dna_storage import router as dna_router
from api.bio_integration import router as bio_router
from api.auth import router as auth_router
from db.database import engine, Base
from db import models  # noqa: F401

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HelixVault API",
    description="Backend for DNA Data Storage Platform",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://helixvault-omega.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dna_router, prefix="/api/dna", tags=["DNA Storage"])
app.include_router(bio_router, prefix="/api/bio", tags=["Bio Integration"])


@app.get("/")
def read_root():
    return {"message": "Welcome to HelixVault API"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
