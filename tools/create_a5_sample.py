from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A5
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "public" / "prescription-template-a5.jpg"
TMP_DIR = ROOT / "tmp" / "pdfs"
OUT_DIR = ROOT / "output" / "pdf"
INK_LAYER = TMP_DIR / "hsm-prescription-a5-data-only.png"
QA_COMPOSITE = TMP_DIR / "hsm-prescription-a5-qa-overlay.png"
PDF = OUT_DIR / "HSM-Prescription-A5-Print-Data-Only.pdf"

W, H = 1748, 2480  # A5 at 300 DPI
PX_PER_MM = W / 148
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
INK = "#102f61"


def mm(value: float) -> int:
    return round(value * PX_PER_MM)


def font(points: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(
        FONT_BOLD if bold else FONT_REGULAR,
        round(points * 300 / 72),
    )


def rtl(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    anchor: str = "mm",
) -> None:
    draw.text(
        xy,
        text,
        font=text_font,
        fill=INK,
        anchor=anchor,
        direction="rtl",
        language="ar",
    )


TMP_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Transparent ink layer: this is the only content sent to the preprinted paper.
ink = Image.new("RGBA", (W, H), (255, 255, 255, 0))
draw = ImageDraw.Draw(ink)

rtl(draw, (mm(105), mm(34.5)), "أحمد محمد علي", font(10, True))
draw.text(
    (mm(49), mm(34.5)),
    "17 / 09 / 2026",
    font=font(8, True),
    fill=INK,
    anchor="mm",
)
draw.text((mm(17), mm(34.5)), "42", font=font(9, True), fill=INK, anchor="mm")

medicine_x = mm(10)
medicine_y = mm(55)
draw.text((medicine_x, medicine_y), "1) Concor 5 mg", font=font(12, True), fill=INK)
rtl(
    draw,
    (mm(80), medicine_y + mm(9)),
    "قرص صباحًا بعد الإفطار",
    font(10),
    anchor="rm",
)
draw.text(
    (medicine_x, medicine_y + mm(22)),
    "2) Aspirin 81 mg",
    font=font(12, True),
    fill=INK,
)
rtl(
    draw,
    (mm(80), medicine_y + mm(31)),
    "قرص مساءً بعد الأكل",
    font(10),
    anchor="rm",
)

rtl(
    draw,
    (mm(100), mm(184.5)),
    "مراجعة بعد أسبوعين",
    font(8, True),
    anchor="rm",
)

ink.save(INK_LAYER, "PNG", dpi=(300, 300))

# Internal visual QA only: composite the ink over the supplied form image.
template = Image.open(TEMPLATE).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
Image.alpha_composite(template, ink).convert("RGB").save(
    QA_COMPOSITE,
    "PNG",
    dpi=(300, 300),
)

# Final PDF intentionally contains no template, logo, header, footer, or borders.
pdf = canvas.Canvas(str(PDF), pagesize=A5)
pdf.setTitle("HSM Clinic - A5 Prescription Data Only")
pdf.drawImage(
    str(INK_LAYER),
    0,
    0,
    width=A5[0],
    height=A5[1],
    preserveAspectRatio=False,
    mask="auto",
)
pdf.showPage()
pdf.save()

print(PDF)
