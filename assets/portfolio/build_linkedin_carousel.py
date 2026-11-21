from pathlib import Path
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.pdfgen import canvas

OUT = Path(__file__).with_name("jmail-linkedin-carousel.pdf")
PAGE_W, PAGE_H = 8 * inch, 10 * inch
FONT_DIR = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Arial", str(FONT_DIR / "arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_DIR / "arialbd.ttf")))

INK = HexColor("#17352a")
GREEN = HexColor("#176b4b")
MINT = HexColor("#cbe9d8")
CREAM = HexColor("#f4f3e9")
PAPER = HexColor("#fffef9")
MUTED = HexColor("#6d7c73")
PALE = HexColor("#cad9ce")
AMBER = HexColor("#f6ebce")
BLUE = HexColor("#dfeaf5")
RED = HexColor("#f6e0e2")

def para(c, text, x, top, width, size, leading=None, color=INK, bold=False):
    text = text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "—": "-", "–": "-", "×": "x", "·": "|"}))
    style = ParagraphStyle(
        "p", fontName="Arial-Bold" if bold else "Arial", fontSize=size,
        leading=leading or size * 1.25, textColor=color, alignment=TA_LEFT,
        spaceAfter=0, allowWidows=0, allowOrphans=0,
    )
    p = Paragraph(text, style)
    _, height = p.wrap(width, PAGE_H)
    p.drawOn(c, x, top - height)
    return top - height

def rounded(c, x, y, w, h, fill, radius=12, stroke=None):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, stroke=1 if stroke else 0, fill=1)

def header(c, label, dark=False):
    color = HexColor("#93d8af") if dark else GREEN
    c.setFillColor(color)
    c.setFont("Arial-Bold", 10)
    c.drawString(48, PAGE_H - 55, label.upper())

def footer(c, message, page, dark=False):
    message = message.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "—": "-", "–": "-", "×": "x", "·": "|"}))
    line = Color(0.7, 0.8, 0.73, alpha=0.42)
    c.setStrokeColor(line)
    c.setLineWidth(0.7)
    c.line(48, 43, PAGE_W - 48, 43)
    c.setFillColor(PALE if dark else MUTED)
    c.setFont("Arial-Bold", 8)
    c.drawString(48, 25, message.upper())
    c.drawRightString(PAGE_W - 48, 25, f"{page:02d} / 06")

def card(c, x, y, n, label, dark=False):
    fill = HexColor("#1e392d") if dark else PAPER
    rounded(c, x, y, PAGE_W - 96, 54, fill, 12)
    c.setFillColor(MINT)
    c.circle(x + 25, y + 27, 15, stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 11)
    c.drawCentredString(x + 25, y + 23, str(n))
    para(c, label, x + 54, y + 39, PAGE_W - 176, 14, 17,
         color=CREAM if dark else INK, bold=True)

def build():
    c = canvas.Canvas(str(OUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("Jmail — Product UX and automation")
    c.setAuthor("Jmail project")

    # 1 — cover
    c.setFillColor(INK); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(HexColor("#26563d")); c.circle(PAGE_W + 35, PAGE_H - 245, 135, stroke=0, fill=1)
    header(c, "A product UX redesign", dark=True)
    para(c, "A job-search tool<br/>shouldn’t give you<br/>another <font color='#9be2b8'>job.</font>", 48, PAGE_H - 125, PAGE_W - 100, 42, 46, CREAM, True)
    para(c, "How I moved Jmail from “generate a script” toward “set it up, apply, and manage it.”", 50, PAGE_H - 350, PAGE_W - 120, 18, 24, PALE)
    footer(c, "Jmail · Product UX × Automation", 1, True); c.showPage()

    # 2 — beta friction
    c.setFillColor(PAPER); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    header(c, "The beta")
    para(c, "It could generate the script.<br/><font color='#176b4b'>Then came the chores.</font>", 48, PAGE_H - 110, PAGE_W - 96, 36, 40, INK, True)
    para(c, "More screens. More copying. More setup decisions before a job seeker could get to the useful part.", 50, PAGE_H - 235, PAGE_W - 116, 17, 22, MUTED)
    card(c, 50, 315, 1, "Find the right Google screen")
    card(c, 50, 245, 2, "Move code and settings around")
    card(c, 50, 175, 3, "Hope the pieces connect")
    footer(c, "The user was doing the assembly", 2); c.showPage()

    # 3 — insight
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    header(c, "The question")
    para(c, "What if setup felt like part of the product?", 48, PAGE_H - 120, PAGE_W - 95, 39, 43, INK, True)
    para(c, "This came from my own friction with the beta—not a user study I didn’t run.", 50, PAGE_H - 290, PAGE_W - 110, 19, 25, GREEN, True)
    chips = [("Fewer handoffs", 50, 330, 150),("Clear next step", 215, 330, 150),("Control after setup", 50, 274, 190)]
    for label, x, y, w in chips:
        rounded(c, x, y, w, 40, PAPER, 18)
        c.setFillColor(INK); c.setFont("Arial-Bold", 10); c.drawCentredString(x + w/2, y + 15, label)
    para(c, "The goal: get from “help me sort job alerts” to a usable workspace without asking the user to assemble an app.", 50, 220, PAGE_W - 105, 18, 25, MUTED)
    footer(c, "Start with the job to be done", 3); c.showPage()

    # 4 — flow
    c.setFillColor(INK); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    header(c, "The new flow", dark=True)
    para(c, "Four steps. Then one clear <font color='#9be2b8'>Apply.</font>", 48, PAGE_H - 105, PAGE_W - 90, 36, 41, CREAM, True)
    card(c, 50, 465, 1, "Connect your own Google account", True)
    card(c, 50, 393, 2, "Add your Gemini key", True)
    card(c, 50, 321, 3, "Upload and review your CV profile", True)
    card(c, 50, 249, 4, "Set job-fit and commute criteria", True)
    para(c, "Apply saves settings and opens the workspace. It does not silently start an email scan.", 50, 210, PAGE_W - 105, 13, 18, PALE)
    footer(c, "Guided setup · User-owned Google files", 4, True); c.showPage()

    # 5 — dashboard actions
    c.setFillColor(HexColor("#e8eff5")); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    header(c, "After setup")
    para(c, "A workspace for the work that continues.", 48, PAGE_H - 105, PAGE_W - 90, 36, 41, INK, True)
    controls = [("Check emails now", GREEN), ("Enable daily checks", MINT), ("Stop the schedule", AMBER), ("Edit CV or criteria", BLUE), ("Delete data & disconnect", RED)]
    y = 460
    for label, fill in controls:
        rounded(c, 50, y, PAGE_W - 100, 48, fill, 11)
        c.setFillColor(GREEN if fill in (MINT, AMBER, BLUE) else HexColor("#ffffff") if fill == GREEN else HexColor("#9e303b"))
        c.circle(70, y + 24, 5, stroke=0, fill=1)
        c.setFillColor(HexColor("#ffffff") if fill == GREEN else INK if fill != RED else HexColor("#842732"))
        c.setFont("Arial-Bold", 13); c.drawString(88, y + 19, label)
        y -= 61
    para(c, "The colors show intent. The page is separate from the setup wizard.", 50, 135, PAGE_W - 105, 14, 19, MUTED)
    footer(c, "Run · Schedule · Edit · Leave", 5); c.showPage()

    # 6 — honest limits
    c.setFillColor(INK); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    header(c, "Still a pilot", dark=True)
    para(c, "Less setup.<br/>Clearer <font color='#9be2b8'>trade-offs.</font>", 48, PAGE_H - 105, PAGE_W - 90, 39, 43, CREAM, True)
    rounded(c, 50, 364, PAGE_W - 100, 112, RED, 13)
    para(c, "<b>AI can be wrong.</b> Jmail moves messages it rejects to Trash. Use a separate job-search account and check Trash during the pilot.", 66, 453, PAGE_W - 132, 15, 20, HexColor("#6e252c"))
    para(c, "Google consent and a personal Gemini key still remain. Email content goes to Gemini with consent. Applications are never sent automatically.", 50, 325, PAGE_W - 105, 17, 23, PALE)
    para(c, "No invented test cohort. No accuracy claim. The next step is a fresh-account walkthrough and safer recovery.", 50, 225, PAGE_W - 105, 13, 18, HexColor("#afc4b6"))
    rounded(c, 50, 108, PAGE_W - 100, 54, GREEN, 12)
    c.setFillColor(HexColor("#ffffff")); c.setFont("Arial-Bold", 14); c.drawCentredString(PAGE_W/2, 129, "Build automation that respects the person using it.")
    footer(c, "Product UX · Practical automation · Applied AI", 6, True); c.showPage()

    c.save()
    print(OUT)

if __name__ == "__main__":
    build()
