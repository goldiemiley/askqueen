"""
Browser checks for sharing (Stage A). Runs against the built site.

    npm run build:pages
    mkdir -p /tmp/aq && cp -r out /tmp/aq/askqueen && (cd /tmp/aq && python3 -m http.server 4180 &)
    pip install playwright pillow && playwright install chromium
    python3 e2e/share_checks.py

Screenshots and card images go to e2e-output/ (ignored by git).
"""
import os, re, sys
from urllib.parse import urlparse, parse_qs, unquote
from PIL import Image
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4180/askqueen"
OUT = os.environ.get("OUT", "e2e-output")
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get("CHROME")  # optional path to a Chrome binary
results = []


def ok(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f" — {detail}" if detail else ""))


# Records navigator.share calls. mode: "ok" | "abort" | "deny"
SHARE_STUB = """
window.__shares = [];
window.__shareMode = 'ok';
navigator.canShare = (d) => !!d;
navigator.share = async (d) => {
  window.__shares.push({ title: d.title, text: d.text, url: d.url,
    files: (d.files || []).map(f => ({ name: f.name, type: f.type, size: f.size })) });
  if (window.__shareMode === 'abort') throw new DOMException('Share canceled', 'AbortError');
  if (window.__shareMode === 'deny') throw new DOMException('Not allowed', 'NotAllowedError');
};
"""


def status_text(pg):
    return pg.locator("dialog[open] [role=status]").last.inner_text().strip()


def get_daily(pg):
    pg.goto(f"{BASE}/daily/")
    pg.get_by_label("Name or nickname").fill("Priya")
    pg.get_by_label("Day", exact=True).fill("9")
    m = pg.get_by_label("Month", exact=True)
    m.select_option(label="August") if m.evaluate("e => e.tagName") == "SELECT" else m.fill("8")
    pg.get_by_label("Year", exact=True).fill("1998")
    pg.get_by_role("button", name="Get my roast").click()
    pg.get_by_role("button", name="Share my reading").wait_for(timeout=10000)


def open_sheet(pg):
    pg.get_by_role("button", name="Share my reading").click()
    pg.locator("dialog[open] img[alt^='Preview']").wait_for(timeout=10000)


def preview_png(pg, path):
    pg.wait_for_function("!document.querySelector('dialog[open]')?.textContent.includes('Updating preview')", timeout=10000)
    src = pg.locator("dialog[open] img[alt^='Preview']").get_attribute("src")
    data = pg.evaluate("async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer()))", src)
    open(path, "wb").write(bytes(data))
    return Image.open(path)


def ask(pg, q):
    pg.goto(f"{BASE}/ask/")
    pg.get_by_role("textbox").first.fill(q)
    pg.get_by_role("button", name="Ask Sabrina").click()
    pg.wait_for_timeout(1800)


with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
    errors = []
    sent_urls = []

    # ---------- Desktop (no navigator.share in headless Chrome) ----------
    desk = b.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True, permissions=["clipboard-read", "clipboard-write"])
    pg = desk.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("request", lambda r: sent_urls.append(r.url))
    get_daily(pg)
    ok("Daily: one 'Share my reading' button", pg.get_by_role("button", name="Share my reading").count() == 1)
    ok("Daily: old separate share buttons are gone", pg.get_by_role("button", name="Square image").count() == 0 and pg.get_by_role("button", name=re.compile("Copy result")).count() == 0)
    order = pg.evaluate("""() => { const s = document.querySelector('[id$="-song"]'); const e = document.querySelector('[id$="-extras"]');
        return s && e ? s.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING : 0 }""")
    ok("Daily: song section now sits directly under the roast, before extras", bool(order))
    open_sheet(pg)
    ok("Sheet is a modal dialog", pg.evaluate("document.querySelector('dialog[open]')?.matches(':modal')"))
    ok("Desktop: primary action is Copy link", pg.locator("dialog[open] .btn-primary").inner_text().strip() == "Copy link")
    im = preview_png(pg, f"{OUT}/daily-story-preview.png")
    ok("Preview is the real 1080×1920 Story image", im.size == (1080, 1920))
    pg.get_by_role("radio", name="Square").click()
    pg.wait_for_timeout(200)
    ok("Square preview is 1080×1080", preview_png(pg, f"{OUT}/daily-square-preview.png").size == (1080, 1080))
    pg.screenshot(path=f"{OUT}/sheet-desktop-1440.png")
    pg.locator("dialog[open] .btn-primary").click()
    pg.wait_for_timeout(300)
    link = pg.evaluate("navigator.clipboard.readText()")
    ok("Copy link copies the exact-result link", link.startswith(f"{BASE}/share/?t=daily&"), link[:80])
    ok("Copy link confirms only after copying", status_text(pg).startswith("Link copied"))
    ok("Link has no name or birthday", not re.search(r"priya|1998|08-09", link, re.I))
    with pg.expect_download() as d:
        pg.get_by_role("button", name="Download").click()
    ok("Download gives the square PNG in square mode", Image.open(d.value.path()).size == (1080, 1080), d.value.suggested_filename)
    ok("Download status doesn't claim it was saved", "Downloading" in status_text(pg))
    with pg.expect_download() as d:
        pg.get_by_role("button", name="Instagram Story").click()
    ok("Desktop Instagram Story downloads the Story PNG with steps", Image.open(d.value.path()).size == (1080, 1920) and "Instagram" in status_text(pg))
    wa = pg.get_by_role("link", name=re.compile("WhatsApp")).get_attribute("href")
    ok("WhatsApp link carries the message and exact link", wa.startswith("https://wa.me/?text=") and link in unquote(wa))
    fb = pg.get_by_role("link", name=re.compile("Facebook")).get_attribute("href")
    ok("Facebook link carries the exact link", parse_qs(urlparse(fb).query)["u"][0] == link)
    pg.get_by_role("button", name="Copy as text").click()
    pg.wait_for_timeout(200)
    txt = pg.evaluate("navigator.clipboard.readText()")
    ok("Copy as text has roast, song and link", link in txt and "Song of the day" in txt)
    ok("Music sticker tip shown for Daily", pg.locator("dialog[open]").get_by_text(re.compile("Music sticker")).count() == 1)
    pg.keyboard.press("Escape")
    ok("Escape closes the sheet", pg.locator("dialog[open]").count() == 0)
    ok("Page scroll restored after closing", pg.evaluate("document.documentElement.style.overflow") == "")

    # Shared Daily page: same reading, song under roast, works any day
    pg2 = desk.new_page()
    pg2.on("pageerror", lambda e: errors.append(str(e)))
    pg2.goto(link)
    pg2.get_by_role("heading", name="Sabrina’s song for this roast").wait_for()
    ok("Shared Daily shows the song section under the roast", True)
    pg2.get_by_role("button", name="Listen to a preview").click()
    src = pg2.locator("iframe[title^='Spotify player']").get_attribute("src")
    ok("Shared Daily: Spotify player loads only on tap", src.startswith("https://open.spotify.com/embed/track/"))

    # ---------- Long titles with real fonts ----------
    stress = {
        "long-title": "t=daily&s=pisces&d=2026-11-23&r=pis-boundaries&i=unhinged&m=bzrp-53&w=0&a=0&l=0&v=0",
        "long-artist": "t=daily&s=sagittarius&d=2026-11-23&r=sag-denial&i=unhinged&m=get-lucky&w=0&a=0&l=0&v=0",
    }
    for name, q in stress.items():
        pg2.goto(f"{BASE}/share/?{q}")
        open_sheet(pg2)
        preview_png(pg2, f"{OUT}/{name}-story.png")
        pg2.get_by_role("radio", name="Square").click()
        pg2.wait_for_timeout(250)
        preview_png(pg2, f"{OUT}/{name}-square.png")
        pg2.keyboard.press("Escape")
    ok("Long-title cards rendered (saved for visual review)", True)

    # ---------- Ask Q&A, desktop ----------
    QUESTION = "Will my ex ever come back after the summer?"
    ask(pg, QUESTION)
    open_sheet(pg)
    toggle = pg.get_by_role("switch", name=re.compile("Show my question"))
    ok("Ask: question is off by default", not toggle.is_checked())
    pg.locator("dialog[open] .btn-primary").click()
    pg.wait_for_timeout(200)
    plain = pg.evaluate("navigator.clipboard.readText()")
    ok("Ask: link without consent has no question", "#" not in plain and "summer" not in plain)
    toggle.check()
    ok("Ask: warning shown when question switched on", pg.locator("dialog[open]").get_by_text(re.compile("links can be forwarded")).count() == 1)
    box = pg.get_by_label("Question to show")
    ok("Ask: question prefilled for review", box.input_value() == QUESTION)
    box.fill("Will my ex ever come back?")
    ok("Ask: share actions wait while the preview catches up with an edit",
       pg.locator("dialog[open] .btn-primary").is_disabled() and pg.get_by_role("button", name="Download").is_disabled())
    qa = preview_png(pg, f"{OUT}/ask-qa-story.png")
    ok("Ask: Q&A Story preview is 1080×1920", qa.size == (1080, 1920))
    pg.get_by_role("radio", name="Square").click()
    pg.wait_for_timeout(500)
    preview_png(pg, f"{OUT}/ask-qa-square.png")
    pg.locator("dialog[open] .btn-primary").click()
    pg.wait_for_timeout(200)
    qlink = pg.evaluate("navigator.clipboard.readText()")
    ok("Ask: link carries the edited question in the #fragment only", "#q=" in qlink and "summer" not in qlink and not re.search(r"come|back|will", urlparse(qlink).query, re.I), qlink)
    pg.screenshot(path=f"{OUT}/sheet-ask-desktop-1440.png")

    # Crisis edit blocks sharing
    box.fill("Should I kill myself?")
    pg.wait_for_timeout(300)
    ok("Ask: crisis question blocks every share action", pg.locator("dialog[open] .btn-primary").is_disabled()
       and pg.locator("dialog[open] a", has_text="WhatsApp").get_attribute("href") is None)
    box.fill("Should I stop taking my meds for him?")
    pg.wait_for_timeout(300)
    ok("Ask: serious question can't pair with a yes/no answer",
       "can’t pair" in pg.locator("dialog[open]").inner_text() or "can't pair" in pg.locator("dialog[open]").inner_text())
    box.fill("Email me at jo@example.org, will it work?")
    pg.wait_for_timeout(300)
    ok("Ask: contact details blocked", "email address" in pg.locator("dialog[open]").inner_text())
    toggle.uncheck()
    pg.wait_for_function("!document.querySelector('dialog[open] .btn-primary').disabled", timeout=10000)
    ok("Ask: switching off restores sharing once the answer-only image is ready", True)
    pg.keyboard.press("Escape")

    # Recipient opens the Q&A link
    pg2.goto(qlink)
    pg2.get_by_role("heading", name="Sabrina has spoken").wait_for()
    body = pg2.inner_text("body")
    ok("Recipient sees the question above the answer", body.index("Will my ex ever come back?") < body.index("Sabrina’s answer"))
    ok("Recipient sees who wrote the question", "Written by the person who shared this link" in body)
    # Old answer-only link
    plain_query = plain.split("?", 1)[1]
    pg2.goto(f"{BASE}/share/?{plain_query}")
    pg2.get_by_role("heading", name="Sabrina has spoken").wait_for()
    ok("Old answer-only links still work", "The question was kept private" in pg2.inner_text("body"))
    # Hostile hashes
    pg2.add_init_script("window.__xss = false; window.alert = () => { window.__xss = true; };")
    pg2.goto(f"{BASE}/share/?{plain_query}#q=" + "%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E%20will%20they%20text%20me%3F")
    pg2.get_by_role("heading", name="Sabrina has spoken").wait_for()
    pg2.wait_for_timeout(500)
    ok("Markup in a question shows as text and never runs", not pg2.evaluate("window.__xss") and "<img src=x onerror=alert(1)>" in pg2.inner_text("body"))
    pg2.goto(f"{BASE}/share/?{plain_query}#q=Should%20I%20kill%20myself%3F")
    pg2.get_by_role("heading", name="Sabrina has spoken").wait_for()
    b2 = pg2.inner_text("body")
    ok("Hand-written crisis question in a link is never shown", "kill myself" not in b2 and re.search("can.t be shown", b2) is not None)
    pg2.goto(f"{BASE}/share/?{plain_query}#q=Visit%20www.scam.io%20for%20love%3F")
    ok("Hand-written link in a question is never shown", "scam" not in pg2.inner_text("body"))

    # Crisis readings have no share button
    ask(pg, "I want to kill myself")
    ok("Crisis replies have no share button", pg.get_by_role("button", name="Share my reading").count() == 0)

    # ---------- Mobile with a share menu ----------
    for width in (320, 375, 430):
        mob = b.new_context(viewport={"width": width, "height": 780}, is_mobile=True, has_touch=True,
                            permissions=["clipboard-read", "clipboard-write"])
        mob.add_init_script(SHARE_STUB)
        m = mob.new_page()
        m.on("pageerror", lambda e: errors.append(str(e)))
        m.on("request", lambda r: sent_urls.append(r.url))
        get_daily(m)
        ok(f"{width}px: Daily result fits", not m.evaluate("document.documentElement.scrollWidth > innerWidth"))
        open_sheet(m)
        sheet = m.locator("dialog[open]").bounding_box()
        ok(f"{width}px: sheet fits the screen width", sheet["x"] >= 0 and sheet["x"] + sheet["width"] <= width + 0.5)
        ok(f"{width}px: sheet sits at the bottom", abs(sheet["y"] + sheet["height"] - 780) < 2)
        primary = m.locator("dialog[open] .btn-primary")
        ok(f"{width}px: primary is Share image", primary.inner_text().strip() == "Share image")
        m.screenshot(path=f"{OUT}/sheet-mobile-{width}.png")
        primary.click()
        m.wait_for_timeout(200)
        s = m.evaluate("window.__shares")
        ok(f"{width}px: share menu gets the Story PNG and the link text",
           len(s) == 1 and s[0]["files"][0]["type"] == "image/png" and s[0]["files"][0]["name"].endswith("-story.png")
           and "/share/?t=daily" in s[0]["text"])
        ok(f"{width}px: no success claim after sharing", status_text(m) == "")
        m.evaluate("window.__shareMode = 'abort'")
        primary.click()
        m.wait_for_timeout(200)
        ok(f"{width}px: cancelling shows nothing", status_text(m) == "")
        m.evaluate("window.__shareMode = 'deny'")
        primary.click()
        m.wait_for_timeout(200)
        ok(f"{width}px: a refused share offers the fallback", "Download the image or copy the link" in status_text(m))
        if width == 375:
            m.evaluate("window.__shareMode = 'ok'; window.__shares = []")
            m.get_by_role("button", name="Instagram Story").click()
            m.wait_for_timeout(200)
            s = m.evaluate("window.__shares")
            ok("375px: Instagram Story sends the Story image to the share menu", len(s) == 1 and s[0]["files"][0]["name"].endswith("-story.png"))
            # Ask on mobile with the question shown
            m.keyboard.press("Escape")
            ask(m, "Should I text them first tonight?")
            open_sheet(m)
            m.get_by_role("switch", name=re.compile("Show my question")).check()
            m.wait_for_timeout(600)
            m.screenshot(path=f"{OUT}/sheet-ask-mobile-375.png", full_page=False)
            ok("375px: Ask sheet fits with the question editor", not m.evaluate("document.documentElement.scrollWidth > innerWidth"))
            m.evaluate("window.__shares = []; window.__shareMode = 'ok'")
            m.locator("dialog[open] .btn-primary").click()
            m.wait_for_timeout(200)
            s = m.evaluate("window.__shares")
            ok("375px: Q&A share text includes the question and #q link", len(s) == 1 and "I asked Sabrina" in s[0]["text"] and "#q=" in s[0]["text"])
        storage = m.evaluate("[localStorage.length, sessionStorage.length, document.cookie]")
        ok(f"{width}px: nothing stored in the browser", storage == [0, 0, ""])
        mob.close()

    ok("No question or birthday ever sent in a request",
       not any(re.search(r"text%20them|ex%20ever|Will%20my|priya|1998", u, re.I) for u in sent_urls))
    third = [u for u in sent_urls if not u.startswith("http://localhost:4180") and not u.startswith(("data:", "blob:"))]
    ok("No third-party requests except Spotify after tapping play", all("spotify" in u or "scdn" in u for u in third), str(third[:3]))
    ok("No page errors", not errors, "; ".join(errors[:3]))
    b.close()

failed = [r for r in results if not r[1]]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
