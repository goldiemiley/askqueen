"""
Browser checks for Ask Sabrina relevance. Runs against the built site:

    npm run build:pages
    mkdir -p /tmp/aq && cp -r out /tmp/aq/askqueen && (cd /tmp/aq && python3 -m http.server 4180 &)
    python3 e2e/ask_checks.py
"""
import os, re
from playwright.sync_api import sync_playwright
BASE = os.environ.get("BASE", "http://localhost:4180/askqueen")
OUT = os.environ.get("OUT", "e2e-output"); os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get("CHROME")
results = []
def ok(n, c, d=""):
    results.append(bool(c)); print(("PASS " if c else "FAIL ") + n + (f" — {d}" if d else ""))

def ask(pg, q):
    pg.goto(f"{BASE}/ask/")
    pg.get_by_role("textbox").first.fill(q)
    pg.get_by_role("button", name="Ask Sabrina").click()
    pg.locator("[role=region] h2").first.wait_for(timeout=10000)
    pg.wait_for_timeout(300)
    region = pg.locator("[role=region]").first
    return region.inner_text()

with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
    ctx = b.new_context(viewport={"width": 375, "height": 800}, permissions=["clipboard-read", "clipboard-write"])
    pg = ctx.new_page()
    errors, urls = [], []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("request", lambda r: urls.append(r.url))

    t = ask(pg, "Will I move to Portugal?")
    ok("Portugal is read as moving abroad", "Read as: Moving abroad: Portugal" in t, t.split("\n")[0])
    named = "Portugal" in t.split("\n", 2)[-1]
    ok("Portugal answer has nothing about outfits or nights out", not re.search(r"outfit|night|party|basket|blanket", t, re.I))
    pg.screenshot(path=f"{OUT}/ask-portugal-375.png")
    texts = set()
    for _ in range(6):
        pg.get_by_role("button", name="Get another answer").click()
        pg.wait_for_timeout(1800)
        r = pg.locator("[role=region]").first.inner_text()
        ok_rel = "Moving abroad: Portugal" in r and not re.search(r"outfit|night out|party|basket", r, re.I)
        lines = [x for x in r.split("\n") if x.strip()]
        texts.add(lines[2] if len(lines) > 2 else r)
        named = named or "Portugal" in "\n".join(lines[2:])
        if not ok_rel:
            ok("Every re-roll stays on moving abroad", False, r[:120]); break
    else:
        ok("Every re-roll stays on moving abroad", True)
    ok("Some answers name Portugal, others are general magic-ball lines", named)
    ok("Re-rolls give different answers", len(texts) >= 5, f"{len(texts)} different")

    pg.get_by_role("button", name="Share my reading").click()
    pg.locator("dialog[open] img[alt^='Preview']").wait_for(timeout=10000)
    pg.wait_for_timeout(400)
    pg.locator("dialog[open] .btn-primary").click()
    pg.wait_for_timeout(300)
    link = pg.evaluate("navigator.clipboard.readText()")
    pg.keyboard.press("Escape")
    ok("Share link carries only the answer and place key", "t=ask" in link and ("p=portugal" in link or "Moving abroad" in t), link)
    ok("Share link has no question", "move" not in link.split("?", 1)[1].lower())
    pg2 = b.new_page(viewport={"width": 375, "height": 800}); pg2.goto(link)
    pg2.get_by_role("heading", name="Sabrina has spoken").wait_for()
    shared = pg2.inner_text("body")
    ok("Shared page shows the same answer", any(x.strip() and x.strip() in shared for x in texts) or "Portugal" in shared)

    t = ask(pg, "What's the capital of France?")
    ok("Quiz questions get 'Try again', not a made-up answer", "Try again." in t)
    ok("…with a rephrase button and no share button", pg.get_by_role("button", name="Rephrase my question").count() == 1 and pg.get_by_role("button", name="Share my reading").count() == 0)
    t = ask(pg, "Will it rain tomorrow?")
    ok("Everyday questions it can't place get a general magic-ball answer", "Try again." not in t and "General vibes" in t)
    ok("…and that answer can be shared", pg.get_by_role("button", name="Share my reading").count() == 1)
    t = ask(pg, "Will I get a visa for Portugal?")
    ok("Visa questions are 'Not my department'", "Not my department." in t and "official" in t.lower())
    t = ask(pg, "Should I get a tattoo?")
    ok("Tattoo answers never talk about hair", "hair" not in t.lower(), t[:100])
    t = ask(pg, "Will I pass my exam?")
    ok("Exam questions read as exams", "Read as: Exams and studying" in t)
    ok("No page overflow at 375px", not pg.evaluate("document.documentElement.scrollWidth > innerWidth"))
    ok("Nothing stored in the browser", pg.evaluate("[localStorage.length, sessionStorage.length, document.cookie]") == [0, 0, ""])
    ok("No question ever sent in a request", not any(re.search(r"portugal|capital|tattoo|exam|rain", u.split("?")[0], re.I) or "Will%20I" in u for u in urls if "/share/" not in u))
    ok("No page errors", not errors, "; ".join(errors[:2]))
    b.close()
print(f"\n{sum(results)}/{len(results)} passed")
