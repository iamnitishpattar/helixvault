import argparse
import sys
from . import encode, decode

def main():
    parser = argparse.ArgumentParser(prog="helixvault", description="HelixVault DNA Storage CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Encode command
    enc_parser = subparsers.add_parser("encode", help="Encode file to DNA")
    enc_parser.add_argument("file", help="Input file path")
    enc_parser.add_argument("--out", "-o", help="Output fasta path", default="output.fasta")
    enc_parser.add_argument("--compress", "-c", choices=["zstd", "brotli", "gzip", "none"], default="zstd")
    enc_parser.add_argument("--no-ecc", action="store_true", help="Disable Reed-Solomon ECC")
    enc_parser.add_argument("--password", "-p", help="Optional encryption password", default=None)

    # Decode command
    dec_parser = subparsers.add_parser("decode", help="Decode DNA to file")
    dec_parser.add_argument("dna_file", help="Input fasta/DNA file")
    dec_parser.add_argument("--out", "-o", help="Output recovered file path", default=None)
    dec_parser.add_argument("--no-ecc", action="store_true", help="Disable Reed-Solomon ECC")
    dec_parser.add_argument("--password", "-p", help="Decryption password if protected", default=None)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "encode":
        with open(args.file, "rb") as f:
            data = f.read()
        seq = encode(data, filename=args.file, compress=args.compress, ecc=not args.no_ecc, password=args.password)
        with open(args.out, "w") as f:
            f.write(f">HV_{args.file}\n{seq}\n")
        print(f"Encoded {len(data)} bytes into {len(seq)} bp DNA -> saved to {args.out}")

    elif args.command == "decode":
        with open(args.dna_file, "r") as f:
            lines = [l.strip() for l in f if not l.startswith(">")]
        dna_seq = "".join(lines)
        recovered, orig_name = decode(dna_seq, ecc=not args.no_ecc, password=args.password)
        out_name = args.out or f"recovered_{orig_name}"
        with open(out_name, "wb") as f:
            f.write(recovered)
        print(f"Decoded {len(dna_seq)} bp DNA into {len(recovered)} bytes -> saved to {out_name}")

if __name__ == "__main__":
    main()
