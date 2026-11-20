# HelixVault Python SDK

`helixvault` is an open-source Python library for translating binary computer files into biological DNA sequences using Base-3 encoding, Reed-Solomon error correction, and molecular steganography.

## Installation

```bash
pip install helixvault
```

With optional compression engines:
```bash
pip install "helixvault[compression]"
```

## Quick Start

### 1. Encode Data to DNA

```python
from helixvault import encode_to_dna, decode_from_dna

data = b"Hello, future generations! This message is stored in DNA."
dna_sequence = encode_to_dna(data, filename="message.txt", use_ecc=True)
print(dna_sequence[:60])
```

### 2. Decode DNA Back to Original Data

```python
recovered_data, filename = decode_from_dna(dna_sequence, use_ecc=True)
print(recovered_data.decode("utf-8"))
```

### 3. Export to DNA Synthesis Providers (Twist Bioscience / IDT)

```python
from helixvault import export_twist_csv, export_idt_csv

twist_csv = export_twist_csv(dna_sequence, payload_name="MyArchive")
with open("twist_order.csv", "w") as f:
    f.write(twist_csv)
```

## License

MIT License. Developed by Nitish Pattar.
