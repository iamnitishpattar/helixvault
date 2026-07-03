# 🧬 HelixVault: Next-Gen DNA Data Storage

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688" alt="FastAPI" />
</div>

<br/>

> HelixVault is a futuristic web application designed to encode digital files (PDFs, Images, Text) into synthesized biological DNA sequences (`.fasta`, `.gb` GenBank formats) for millennia-scale data storage. It features advanced biological simulations, steganography, and robust error correction mathematically proving the viability of DNA storage.

*Developed as a master-level MCA academic project.*

---

## 📸 Application Showcase

### 🏠 Homepage — The Biological Data Engine
<div align="center">
  <video src="./assets/homepage.mp4" controls="controls" autoplay="autoplay" loop="loop" muted="muted" width="100%"></video>
  <p><em>A premium dark-themed dashboard with interactive SpotlightCards, real-time GC Content analytics, and a cinematic hero section showcasing DNA vs. traditional storage.</em></p>
</div>

### ⚙️ DNA Encoder Interface
<div align="center">
  <video src="./assets/encoding.mp4" controls="controls" autoplay="autoplay" loop="loop" muted="muted" width="100%"></video>
  <p><em>Upload files and transform them into biological DNA sequences using Base-3 encoding, AES-256 encryption, Reed-Solomon ECC, and DNA steganography — all in a sleek glassmorphic interface.</em></p>
</div>

### 🦠 Decoder & Mutation Simulator
<div align="center">
  <video src="./assets/mutation.mp4" controls="controls" autoplay="autoplay" loop="loop" muted="muted" width="100%"></video>
  <p><em>Upload GenBank files, deliberately simulate biological DNA damage with the mutation engine, then watch Reed-Solomon error correction perfectly reconstruct the original data.</em></p>
</div>

### 🔐 Secure Vault & Bio Database
<div align="center">
  <video src="./assets/recovery.mp4" controls="controls" autoplay="autoplay" loop="loop" muted="muted" width="100%"></video>
  <p><em>Secure Vault for managing encoded DNA files with download/delete actions, and the Biological Database for querying real genomic sequences from NCBI — all behind JWT authentication.</em></p>
</div>


---

## 🏗️ Architecture Diagram

<div align="center">

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef backend fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef storage fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef bio fill:#0f172a,stroke:#8b5cf6,stroke-width:2px,color:#fff;

    %% Client Side
    subgraph Client [Client Interface]
        UI[React + Vite UI]:::frontend
        3D[3D Mutation Simulator]:::frontend
        Charts[Recharts Analytics]:::frontend
    end

    %% Backend Services
    subgraph Server [FastAPI Backend]
        API[RESTful API Gateway]:::backend
        Auth[JWT Authentication]:::backend
        
        subgraph Core Logic
            Encrypt[AES-256 Encryption]:::backend
            RS[Reed-Solomon ECC]:::backend
            Encode[Base-3 Encoder]:::backend
            Stego[DNA Steganography]:::backend
        end
        
        API --> Auth
        API --> Encrypt
        Encrypt --> RS
        RS --> Encode
        Encode --> Stego
    end

    %% Storage & Biology
    subgraph Storage [Data Persistence]
        DB[(PostgreSQL)]:::storage
    end
    
    subgraph Biological Output [Biological Domain]
        GenBank[GenBank/FASTA Files]:::bio
        SyntheticDNA[Synthetic DNA]:::bio
    end

    %% Connections
    UI <-->|JSON & Files| API
    3D -->|Mutation Params| API
    Auth <--> DB
    Stego --> GenBank
    GenBank -.->|Physical Synthesis| SyntheticDNA
```
</div>

---

## ✨ Core Features

*   **🧬 Digital-to-DNA Encoding:** Uses a custom Base-3 encoding algorithm to convert binary data into homopolymer-free biological sequences (A, C, G, T).
*   **🛡️ Reed-Solomon Error Correction:** Mathematically injects redundant DNA bases to protect your data. Even if the DNA degrades physically over thousands of years, the file can be perfectly recovered.
*   **🦠 DNA Steganography:** Hides your encoded data deep inside a massive, naturally occurring "Host" DNA sequence (e.g., the *E. coli* genome) using biological start/stop marker codons.
*   **⚠️ 3D Biological Mutation Simulator:** A cinematic 3D CSS simulator that allows users to intentionally corrupt (mutate) random bases in their `.gb` file to test the Error Correction algorithm in real-time.
*   **🔒 AES-256 Encryption:** Secure your encoded DNA payload with bank-grade encryption before it is synthesized.
*   **✅ SHA-256 Integrity Verification:** Calculates cryptographic hashes to mathematically guarantee the recovered file is a 100% pixel-by-pixel match with the original.
*   **💰 Synthesis Estimator:** Calculates the real-world lab cost to print your sequence ($0.10/bp) and estimates the microscopic physical weight of the DNA in picograms.

---

## 🛠️ Technology Stack

**Frontend:**
*   React (Vite)
*   Recharts (Analytics)
*   Lucide React (Icons)
*   Pure Vanilla CSS (Custom Glassmorphism & 3D Rendering)

**Backend:**
*   Python FastAPI
*   SQLAlchemy (Database ORM)
*   BioPython (Genomic Sequence Manipulation)
*   ReedSolo (Error Correction Coding)

**Deployment:**
*   **Frontend:** Vercel (`helixvault-omega.vercel.app`)
*   **Backend:** Render (`helixvault.onrender.com`)
*   **Database:** PostgreSQL (Hosted on Render)

---

## 🚀 How to Use the Simulator

1.  **Encode Data:** Go to the Encoder, upload a PDF, check **"Use Error Correction"** and **"Extract from Steganography"**, and click Encode. Download your `.gb` file.
2.  **Mutate DNA:** Go to the Decoder, upload the newly created `.gb` file. Click **"Simulate Biological Mutation"** to intentionally damage the DNA sequence. 
3.  **Recover Data:** Click **Extract Data**. The backend will bypass the biological anomalies, slice out the steganography, trigger the Reed-Solomon engine to repair the damaged bases, and return your original file!

---

## 💻 Running Locally

### 1. Start the Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📜 License
This project is open-source and available under the MIT License.
