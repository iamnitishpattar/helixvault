"""
Generate IEEE-quality architecture and pipeline diagrams for HelixVault paper.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

OUT_DIR = r"e:\new_project_main"

# ─────────────────────────────────────────────────────
# FIGURE 1: Three-Tier System Architecture
# ─────────────────────────────────────────────────────
def draw_fig1():
    fig, ax = plt.subplots(figsize=(6.5, 4.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    colors = {
        'frontend': '#4A90D9',
        'backend':  '#E8773A',
        'db':       '#5BAE5B',
        'ext':      '#9B59B6',
        'arrow':    '#333333',
    }

    def rounded_box(x, y, w, h, label, color, fontsize=8, sublabel=None):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.12",
                             facecolor=color, edgecolor='#333333', linewidth=1.2, alpha=0.88)
        ax.add_patch(box)
        if sublabel:
            ax.text(x + w/2, y + h/2 + 0.12, label, ha='center', va='center',
                    fontsize=fontsize, fontweight='bold', color='white')
            ax.text(x + w/2, y + h/2 - 0.18, sublabel, ha='center', va='center',
                    fontsize=fontsize-2, color='white', style='italic')
        else:
            ax.text(x + w/2, y + h/2, label, ha='center', va='center',
                    fontsize=fontsize, fontweight='bold', color='white')

    def arrow(x1, y1, x2, y2, label=None, color='#333333'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
        if label:
            mx, my = (x1+x2)/2, (y1+y2)/2
            ax.text(mx + 0.15, my, label, fontsize=6, color='#555555', style='italic')

    # Title
    ax.text(5, 6.65, "HelixVault System Architecture", ha='center', va='center',
            fontsize=12, fontweight='bold', color='#222222')

    # === TIER LABELS ===
    ax.text(0.3, 5.9, "Presentation\nTier", fontsize=7, color='#888888',
            ha='center', va='center', style='italic')
    ax.text(0.3, 3.7, "Application\nTier", fontsize=7, color='#888888',
            ha='center', va='center', style='italic')
    ax.text(0.3, 1.3, "Data\nTier", fontsize=7, color='#888888',
            ha='center', va='center', style='italic')

    # Dashed tier separators
    ax.axhline(y=4.85, xmin=0.08, xmax=0.95, color='#BBBBBB', linestyle='--', lw=0.8)
    ax.axhline(y=2.55, xmin=0.08, xmax=0.95, color='#BBBBBB', linestyle='--', lw=0.8)

    # === FRONTEND TIER ===
    rounded_box(1.5, 5.4, 2.2, 0.85, "React 19 + Vite 8", colors['frontend'],
                sublabel="Vercel CDN")
    rounded_box(4.3, 5.4, 2.2, 0.85, "Glassmorphic UI", colors['frontend'],
                sublabel="3D Animations")
    rounded_box(7.1, 5.4, 2.2, 0.85, "React Contexts", colors['frontend'],
                sublabel="Auth / Genomic / Notify")

    # === BACKEND TIER ===
    rounded_box(1.2, 3.55, 2.0, 0.75, "FastAPI Server", colors['backend'],
                sublabel="Render.com")
    rounded_box(3.6, 3.55, 1.9, 0.75, "REST Routers", colors['backend'],
                sublabel="6 Modules")
    rounded_box(5.9, 3.55, 1.9, 0.75, "Core Engine", colors['backend'],
                sublabel="Codec / RS / Steg")
    rounded_box(8.2, 3.55, 1.3, 0.75, "Groq AI", colors['ext'],
                sublabel="LLM RAG")

    # === DATA TIER ===
    rounded_box(1.5, 0.8, 2.2, 0.85, "PostgreSQL 15", colors['db'],
                sublabel="Render.com")
    rounded_box(4.3, 0.8, 2.2, 0.85, "SQLAlchemy 2.0", colors['db'],
                sublabel="ORM Queries")
    rounded_box(7.1, 0.8, 2.2, 0.85, "NCBI GenBank", colors['ext'],
                sublabel="BioPython Fetch")

    # === ARROWS ===
    # Frontend -> Backend
    arrow(2.6, 5.4, 2.2, 4.3, "HTTPS/JSON")
    arrow(5.4, 5.4, 4.5, 4.3, "API Calls")

    # Backend -> DB
    arrow(2.2, 3.55, 2.6, 1.65, "SQL")
    arrow(4.5, 3.55, 5.4, 1.65, "ORM")
    arrow(6.85, 3.55, 8.2, 1.65, "E-Utils")

    # Backend internal
    arrow(3.2, 3.9, 3.6, 3.9, "")
    arrow(5.5, 3.9, 5.9, 3.9, "")

    plt.tight_layout(pad=0.3)
    path = os.path.join(OUT_DIR, "fig1_architecture.png")
    fig.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print(f"Saved: {path}")
    return path


# ─────────────────────────────────────────────────────
# FIGURE 2: DNA Encoding Pipeline
# ─────────────────────────────────────────────────────
def draw_fig2():
    fig, ax = plt.subplots(figsize=(6.5, 2.8), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.2)
    ax.axis('off')

    ax.text(5, 2.95, "HelixVault Five-Stage DNA Encoding Pipeline", ha='center',
            fontsize=11, fontweight='bold', color='#222222')

    stage_colors = ['#2C3E50', '#E74C3C', '#E67E22', '#27AE60', '#8E44AD']
    stages = [
        ("Stage 1", "AES-256-CBC\nEncryption", "PBKDF2\n100K iter"),
        ("Stage 2", "Reed-Solomon\nRS(255, 205)", "GF(256)\n25-byte fix"),
        ("Stage 3", "Base-3 Codec\nEncoding", "Homopolymer\nfree"),
        ("Stage 4", "LT Fountain\nCodes", "Robust\nSoliton"),
        ("Stage 5", "Biological\nSteganography", "E. coli K-12\ncarrier"),
    ]

    box_w = 1.55
    box_h = 1.6
    gap = 0.12
    start_x = 0.35
    y_base = 0.55

    for i, (label, name, detail) in enumerate(stages):
        x = start_x + i * (box_w + gap)
        c = stage_colors[i]

        # Main box
        box = FancyBboxPatch((x, y_base), box_w, box_h, boxstyle="round,pad=0.1",
                             facecolor=c, edgecolor='#222222', linewidth=1.2, alpha=0.9)
        ax.add_patch(box)

        # Stage number
        ax.text(x + box_w/2, y_base + box_h - 0.22, label, ha='center', va='center',
                fontsize=7, fontweight='bold', color='#FFD700')

        # Name
        ax.text(x + box_w/2, y_base + box_h/2 + 0.05, name, ha='center', va='center',
                fontsize=7.5, fontweight='bold', color='white')

        # Detail
        ax.text(x + box_w/2, y_base + 0.28, detail, ha='center', va='center',
                fontsize=6, color='#CCCCCC', style='italic')

        # Arrow between boxes
        if i < len(stages) - 1:
            ax.annotate('', xy=(x + box_w + gap - 0.02, y_base + box_h/2),
                        xytext=(x + box_w + 0.02, y_base + box_h/2),
                        arrowprops=dict(arrowstyle='->', color='#E74C3C', lw=2))

    # Input/output labels
    ax.text(start_x - 0.1, y_base + box_h/2, "Binary\nFile", ha='right', va='center',
            fontsize=7, fontweight='bold', color='#2C3E50',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#ECF0F1', edgecolor='#2C3E50'))

    last_x = start_x + 4 * (box_w + gap)
    ax.text(last_x + box_w + 0.15, y_base + box_h/2, "DNA\nSequence", ha='left', va='center',
            fontsize=7, fontweight='bold', color='#8E44AD',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#F4ECF7', edgecolor='#8E44AD'))

    # Input arrow
    ax.annotate('', xy=(start_x, y_base + box_h/2),
                xytext=(start_x - 0.15, y_base + box_h/2),
                arrowprops=dict(arrowstyle='->', color='#2C3E50', lw=1.5))

    # Output arrow
    ax.annotate('', xy=(last_x + box_w + 0.12, y_base + box_h/2),
                xytext=(last_x + box_w, y_base + box_h/2),
                arrowprops=dict(arrowstyle='->', color='#8E44AD', lw=1.5))

    plt.tight_layout(pad=0.2)
    path = os.path.join(OUT_DIR, "fig2_pipeline.png")
    fig.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print(f"Saved: {path}")
    return path


if __name__ == "__main__":
    draw_fig1()
    draw_fig2()
    print("All figures generated.")
