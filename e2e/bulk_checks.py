"""
Browser checks for Bulk add in the Music Library. Runs against a throwaway copy:

    cp src/data/songs.json /tmp/copy-songs.json
    PORT=4322 CATALOGUE=/tmp/copy-songs.json npx tsx scripts/music-library/server.ts &
    python3 e2e/bulk_checks.py
"""
import json, os
from playwright.sync_api import sync_playwright
BASE = os.environ.get("BASE", "http://localhost:4322")
COPY = os.environ.get("CATALOGUE", "/tmp/copy-songs.json")
OUT = os.environ.get("OUT", "e2e-output"); os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get("CHROME")
results = []
def ok(n, c, d=""):
    results.append(bool(c)); print(("PASS " if c else "FAIL ") + n + (f" — {d}" if d else ""))
def saved(): return json.load(open(COPY))["songs"]
def msg(pg, i): return pg.locator("#bulkRows tr").nth(i).locator(".rowmsg").inner_text()

with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE); pg.locator("#summary b").first.wait_for()
    start = len(saved())
    pg.click("#bulkBtn")
    pg.fill("#bulkText", "\n".join([
        "Test Song One - Test Band",                                   # 0 needs genre+theme from defaults
        "Test Song Two – Test Band – Rock – Burnout – high",           # 1 full dash format
        "Test Song Three, Test Band, Pop / R&B, Confidence, low, https://open.spotify.com/track/ABCDEFGHIJKLMNOPQRSTUV?si=1",  # 2 CSV + link
        "Anti-Hero - Taylor Swift",                                    # 3 already in library
        "Test Song Two - Test Band",                                   # 4 duplicate of row 1
        "Test Song Four - Test Band - Polka - Chaos",                  # 5 unknown genre
        "Test Song Five - Test Band - Pop - Chaos - loud",             # 6 bad energy
        "https://open.spotify.com/album/1bt6q2SruMsBtcerNVtpZB Test Six - Test Band - Pop - Chaos",  # 7 album link
    ]))
    ok("Parses 8 rows", pg.locator("#bulkRows tr").count() == 8)
    ok("Row without genre asks for one", "Pick a genre" in msg(pg, 0), msg(pg, 0))
    ok("Dash format with genre, theme, energy is ready", "Ready" in msg(pg, 1), msg(pg, 1))
    ok("Comma format with two genres and a Spotify link is ready", msg(pg, 2) == "Ready", msg(pg, 2))
    ok("Songs already in the library are skipped", "Already in the library" in msg(pg, 3))
    ok("Rows listed twice are skipped", "Listed twice" in msg(pg, 4))
    ok("Unknown genre is explained", "Unknown genre: Polka" in msg(pg, 5))
    ok("Bad energy is explained", "Energy must be" in msg(pg, 6))
    ok("Album links are explained", "album" in msg(pg, 7), msg(pg, 7))
    # Defaults fix row 0
    pg.check("#bulkGenre input[value=indie]"); pg.check("#bulkTheme input[value=yearning]")
    ok("Defaults fill rows that don't say", "Ready" in msg(pg, 0), msg(pg, 0))
    # Inline fix of row 5
    pg.locator("#bulkRows tr").nth(5).locator("[data-f=genreText]").fill("Electronic")
    ok("Editing a cell fixes the row", "Ready" in msg(pg, 5))
    # Untick row 6
    pg.locator("#bulkRows tr").nth(6).locator("[data-f=include]").uncheck()
    ok("Unticked rows aren't added", "Not added" in msg(pg, 6))
    ok("Summary counts ready rows", pg.inner_text("#bulkApply") == "Add 4 songs", pg.inner_text("#bulkSummary"))
    pg.screenshot(path=f"{OUT}/bulk-add-1440.png")
    pg.click("#bulkApply")
    ok("Rows that couldn't be added stay for fixing", pg.locator("#bulkDlg[open]").count() == 1 and pg.locator("#bulkRows tr").count() == 4)
    pg.locator("#bulkDlg [data-close]").first.click()
    pg.click("#saveBtn"); pg.locator("#saveState", has_text="All changes saved").wait_for(timeout=6000)
    s = saved()
    new = {x["title"]: x for x in s[start:]}
    ok("4 songs saved to songs.json", len(s) == start + 4, ", ".join(new))
    ok("Defaults applied", new.get("Test Song One", {}).get("genres") == ["indie"] and new["Test Song One"]["themes"] == ["yearning"] and new["Test Song One"]["energy"] == "medium")
    t3 = new.get("Test Song Three", {})
    ok("Two genres, energy and Spotify ID kept", t3.get("genres") == ["pop", "rnb"] and t3.get("energy") == "low" and t3.get("spotifyTrackId") == "ABCDEFGHIJKLMNOPQRSTUV", str(t3))
    ok("Edited genre kept", new.get("Test Song Four", {}).get("genres") == ["electronic"])
    # Spreadsheet paste with header, artist-first order not needed
    pg.click("#bulkBtn")
    pg.fill("#bulkText", "Artist\tTitle\tGenre\tTheme\nTest Band\tSheet Song\tK-pop\tAmbition")
    ok("Spreadsheet rows with a header are read by column name", "Ready" in msg(pg, 0) and pg.locator("#bulkRows [data-f=title]").input_value() == "Sheet Song")
    pg.fill("#bulkText", "Test Band - Order Song - Soul - Boundaries")
    pg.select_option("#bulkOrder", "at")
    ok("Artist-first lines can be flipped", pg.locator("#bulkRows [data-f=title]").input_value() == "Order Song")
    m = b.new_page(viewport={"width": 375, "height": 800}); m.goto(BASE); m.locator("#summary b").first.wait_for()
    m.click("#bulkBtn"); m.fill("#bulkText", "A Phone Song - Test Band - Pop - Chaos"); m.wait_for_timeout(200)
    m.screenshot(path=f"{OUT}/bulk-add-375.png")
    box = m.locator("#bulkDlg").bounding_box()
    ok("Bulk add fits a phone screen", box["x"] >= 0 and box["x"] + box["width"] <= 375)
    ok("No page errors", not errors, "; ".join(errors[:2]))
    b.close()
print(f"\n{sum(results)}/{len(results)} passed")
