"""
Browser checks for the Music Library editor. Runs against a throwaway copy:

    cp src/data/songs.json /tmp/copy-songs.json
    PORT=4322 CATALOGUE=/tmp/copy-songs.json npx tsx scripts/music-library/server.ts &
    python3 e2e/library_checks.py
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4322"
OUT = os.environ.get("OUT", "e2e-output")
os.makedirs(OUT, exist_ok=True)
COPY = os.environ.get("CATALOGUE", "/tmp/copy-songs.json")
CHROME = os.environ.get("CHROME")
results = []
def ok(n, c, d=""):
    results.append(c); print(("PASS " if c else "FAIL ") + n + (f" — {d}" if d else ""))
def wait_text(page, sel, text, timeout=6000):
    page.locator(sel, has_text=text).first.wait_for(timeout=timeout)
def saved():
    return json.load(open(COPY))["songs"]

with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True)
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    confirms = []
    def on_dialog(d):
        confirms.append(d.message); d.accept()
    pg.on("dialog", on_dialog)
    pg.goto(BASE)
    pg.locator("#summary b").first.wait_for()
    START = len([x for x in saved() if not x.get("retired")])
    summ = pg.inner_text("#summary")
    ok("Overview shows totals", str(START) in summ and "active songs" in summ, summ.replace("\n", " "))
    ok("Coverage grid has 8 themes × 10 genres", pg.locator("#coverage td button").count() == 80)
    ok("Table paginates 50 per page", pg.locator("#rows tr").count() == 50 and f"1–50 of {START}" in pg.inner_text("#pageInfo"))
    pg.screenshot(path=f"{OUT}/overview-1440.png", full_page=False)

    # Search + filters
    pg.fill("#q", "taylor")
    n = pg.locator("#rows tr").count()
    ok("Search by artist", n >= 2 and all("Taylor" in t for t in pg.locator("#rows tr td:nth-child(3)").all_inner_texts()), f"{n} rows")
    pg.click("#clearFilters")
    pg.locator("#coverage button[data-theme=burnout][data-genre=rock]").click()
    rows = pg.locator("#rows tr").count()
    cell = pg.locator("#coverage button[data-theme=burnout][data-genre=rock]").inner_text()
    ok("Clicking a coverage cell filters to that theme × genre", str(rows) == cell, f"{rows} rows, cell says {cell}")
    pg.click("#clearFilters")

    # Add a song through the form
    pg.click("#addBtn")
    pg.fill("#fTitle", "Test Anthem")
    pg.fill("#fArtist", "AskQueen Test Band")
    pg.fill("#fSpotify", "https://open.spotify.com/album/1bt6q2SruMsBtcerNVtpZB")
    ok("Album links are explained, not accepted", "album link" in pg.inner_text("#spotifyMsg"))
    pg.fill("#fSpotify", "https://open.spotify.com/track/ABCDEFGHIJKLMNOPQRSTUV?si=abc")
    ok("Track link becomes an ID with a player preview", "ABCDEFGHIJKLMNOPQRSTUV" in pg.inner_text("#spotifyMsg") and pg.locator("#preview iframe").count() == 1)
    pg.click("#songSave")
    ok("Can't add without genre and theme", "Pick at least one genre" in pg.inner_text("#songErrors"))
    pg.check("#genreChecks input[value=pop]")
    pg.check("#themeChecks input[value=romantic_denial]")
    pg.check("#energyChecks input[value=high]")
    pg.screenshot(path=f"{OUT}/add-song-1440.png")
    pg.click("#songSave")
    pg.wait_for_timeout(400)
    ok("Song added and marked unsaved", "Unsaved changes" in pg.inner_text("#saveState") and str(START + 1) in pg.inner_text("#summary"))

    # Duplicate detection
    pg.click("#addBtn")
    pg.fill("#fTitle", "anti hero")
    pg.fill("#fArtist", "TAYLOR SWIFT")
    ok("Duplicate detected while typing", "Already in the library" in pg.inner_text("#dupMsg"))
    pg.fill("#fTitle", "Totally New")
    pg.fill("#fSpotify", "ABCDEFGHIJKLMNOPQRSTUV")
    ok("Reused Spotify track detected", "already used by" in pg.inner_text("#spotifyMsg"))
    pg.locator("#songDlg [data-close]").first.click()

    # Import in the founder's simple format (add mode)
    pg.click("#importBtn")
    pg.fill("#importText", json.dumps([
        {"title": "Imported Test Song", "artist": "AskQueen Test Band", "genre": "Rock", "theme": "Burnout", "energy": "high", "spotify": "https://open.spotify.com/track/ZYXWVUTSRQPONMLKJIHGFE"},
        {"title": "Good Days", "artist": "SZA", "genre": "R&B", "theme": "Self-reflection"},
        {"title": "Anti-Hero", "artist": "Taylor Swift", "genre": "Pop", "theme": "Self-reflection"},
        {"title": "No Scrubs", "artist": "TLC", "genre": "R&B", "theme": "Boundaries"}]))
    prev = pg.inner_text("#importPreview")
    ok("Import preview explains the result", "add 1, update 3" in prev, prev[:120])
    pg.click("#importApply")
    pg.wait_for_timeout(400)
    ok("Import applied", str(START + 2) in pg.inner_text("#summary"))

    # Save
    pg.click("#saveBtn")
    wait_text(pg, "#saveState", "All changes saved")
    s = saved()
    glb = next((x for x in s if x["title"] == "Test Anthem"), None)
    ht = next((x for x in s if x["title"] == "Imported Test Song"), None)
    ok("songs.json has the added song with its ID", glb and glb["id"] == "test-anthem" and glb["spotifyTrackId"] == "ABCDEFGHIJKLMNOPQRSTUV", str(glb))
    ok("songs.json has the imported song", ht and ht["genres"] == ["rock"] and ht["themes"] == ["burnout"])
    gd = next(x for x in s if x["title"] == "Good Days")
    ok("Import updated an existing song's themes", gd["themes"] == ["self_reflection"])

    # Retire (keeps old links) with the coverage impact in the confirmation
    pg.fill("#q", "call me maybe")
    pg.click("#rows [data-edit]")
    pg.click("#retireBtn")
    ok("Retire confirmation says old links keep working", "keep working" in confirms[-1], confirms[-1][:100])
    pg.fill("#q", "")
    pg.select_option("#fStatus", "retired")
    ok("Retired song shown under Retired songs", "Call Me Maybe" in pg.inner_text("#rows"))
    pg.select_option("#fStatus", "active")
    # Delete warns about broken links
    pg.fill("#q", "uptown funk")
    pg.click("#rows [data-edit]")
    pg.click("#deleteBtn")
    ok("Delete confirmation warns about broken share links", "vanished" in confirms[-1], confirms[-1][:110])
    pg.click("#saveBtn")
    wait_text(pg, "#saveState", "All changes saved")
    ok("Saving a deletion asks again first", any("Old share links" in c for c in confirms[-2:]))
    s2 = saved()
    cmm = next(x for x in s2 if x["id"] == "call-me-maybe")
    ok("Retired song stays in songs.json, marked retired", cmm.get("retired") is True)
    ok("Deleted song is gone from songs.json", not any(x["id"] == "uptown-funk" for x in s2))

    # Errors block saving: retire every Burnout song
    pg.fill("#q", "")
    pg.select_option("#fTheme", "burnout")
    for _ in range(5):
        pg.check("#selectPage")
        if pg.locator("#rows tr td input[type=checkbox]").count() == 0: break
        pg.click("#bulkRetire")
        pg.wait_for_timeout(300)
        if pg.locator("#rows tr td input[type=checkbox]").count() == 0: break
    pg.wait_for_timeout(500)
    ok("Retiring a whole theme is an error and blocks saving", pg.locator("#saveBtn").is_disabled() and "No active songs for Burnout" in pg.inner_text("#issues"))
    pg.screenshot(path=f"{OUT}/error-state-1440.png")
    pg.select_option("#fStatus", "retired")
    pg.check("#selectPage"); pg.click("#bulkRestore"); pg.wait_for_timeout(400)
    ok("Restoring fixes it", not pg.locator("#saveBtn").is_disabled() or "All changes saved" in pg.inner_text("#saveState"))

    # Export
    with pg.expect_download() as d:
        pg.click("#exportBtn")
    exp = json.load(open(d.value.path()))
    ok("Export downloads the whole working catalogue", exp["version"] == 1 and len(exp["songs"]) == len(saved()))

    # Phone-sized layout
    m = b.new_page(viewport={"width": 375, "height": 800})
    m.goto(BASE); m.locator("#summary b").first.wait_for()
    m.screenshot(path=f"{OUT}/overview-375.png")
    m.click("#addBtn"); m.wait_for_timeout(200)
    m.screenshot(path=f"{OUT}/add-song-375.png")
    box = m.locator("#songDlg").bounding_box()
    ok("Add-song form fits a phone screen", box["x"] >= 0 and box["x"] + box["width"] <= 375)
    ok("No page errors", not errors, "; ".join(errors[:3]))
    b.close()
print(f"\n{sum(results)}/{len(results)} passed")
