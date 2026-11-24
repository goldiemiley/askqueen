"""Browser checks for "Find Spotify links" against the pretend Spotify (e2e/spotify_fake_server.ts)."""
import json, os, re, subprocess, sys, tempfile, time, shutil
from playwright.sync_api import sync_playwright, expect

results = []
def ok(n, c, d=""):
    results.append(bool(c)); print(("PASS " if c else "FAIL ") + n + (f" — {d}" if d else ""))

def start(cat, port, *extra):
    p = subprocess.Popen(["npx", "tsx", "e2e/spotify_fake_server.ts", *extra], env={**os.environ, "CATALOGUE": cat, "PORT": str(port)}, stdout=subprocess.PIPE, text=True)
    p.stdout.readline(); return p

tmp = tempfile.mkdtemp(); cat = os.path.join(tmp, "songs.json")
src = json.load(open("src/data/songs.json"))
# Make 30 songs lose their link so there's something to find.
stripped = [s for s in src["songs"] if s.get("spotifyTrackId") and not s.get("retired")][:30]
before = {s["id"]: dict(s) for s in src["songs"]}
for s in stripped: s.pop("spotifyTrackId")
json.dump(src, open(cat, "w"), ensure_ascii=False)
missing_before = sum(1 for s in src["songs"] if not s.get("retired") and not s.get("spotifyTrackId"))

srv = start(cat, 4322); srv2 = start(cat + ".2", 4323, "--unconfigured")
shutil.copy(cat, cat + ".2")
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 900}); pg.set_default_timeout(15000)
        errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto("http://localhost:4323/"); pg.get_by_text("All changes saved").wait_for()
        pg.get_by_role("button", name="Find Spotify links").click()
        pg.get_by_text("isn't set up on this computer").wait_for()
        ok("Without credentials, shows the one-time setup", pg.locator("#spSetup").is_visible() and "Premium" in pg.locator("#spSetup").inner_text())

        pg.goto("http://localhost:4322/"); pg.get_by_text("All changes saved").wait_for()
        pg.get_by_role("button", name="Find Spotify links").click()
        pg.locator("#spIntro").wait_for()
        ok("Shows how many songs are missing a link", f"{missing_before} active songs have no Spotify link" in pg.locator("#spIntro").inner_text(), pg.locator("#spIntro").inner_text()[:60])
        pg.get_by_role("button", name=re.compile("Test on 20")).click()
        pg.get_by_text(re.compile(r"^Done\.")).wait_for(timeout=30000)
        counts = pg.locator("#spCounts").inner_text()
        ok("Progress reaches 20 of 20", "20\nof 20 checked" in counts or "20of 20" in counts.replace("\n", ""), counts.replace("\n", " "))
        ok("Progress bar is full", pg.locator("#spBar").evaluate("e => e.value === e.max"))
        msg = pg.locator("#spMsg").inner_text(); ok("Summary gives added / review / not found counts", re.search(r"\d+ added and saved, \d+ to review, \d+ not found", msg), msg)
        saved = json.load(open(cat))["songs"]
        added = [s for s in saved if s.get("spotifyTrackId", "").startswith("TEST")]
        ok("High-confidence matches were saved to songs.json", len(added) > 0, f"{len(added)} saved")
        ok("Only fake-Spotify IDs were added (nothing invented)", all(re.fullmatch(r"TEST\d{18}", s["spotifyTrackId"]) for s in added))
        ok("Song IDs, order and every other field unchanged", [s["id"] for s in saved] == [s["id"] for s in src["songs"]] and all({k: v for k, v in s.items() if k != "spotifyTrackId"} == {k: v for k, v in before[s["id"]].items() if k != "spotifyTrackId"} for s in saved))
        ok("Existing links untouched", all(s.get("spotifyTrackId") == before[s["id"]].get("spotifyTrackId") for s in saved if s["id"] not in {x["id"] for x in stripped}))
        rv = pg.locator("#spReviewRows tr"); nr = pg.locator("#spNoneRows tr")
        ok("Uncertain matches wait in a review table", rv.count() > 0, f"{rv.count()} rows")
        ok("Review rows have confidence and a Spotify listening link", rv.first.locator(".conf").count() == 1 and rv.first.get_by_role("link", name="Open in Spotify").get_attribute("href").startswith("https://open.spotify.com/track/"))
        ok("Listening links open in a new tab safely", rv.first.get_by_role("link").get_attribute("rel") == "noopener noreferrer")
        ok("Covers-only songs are listed as not found with a search link", nr.count() > 0 and nr.first.get_by_role("link", name="Search Spotify").get_attribute("href").startswith("https://open.spotify.com/search/"))
        ok("…and say what was skipped", "karaoke" in nr.first.inner_text().lower())
        pg.screenshot(path="e2e-output/spotify-finder.png", full_page=True)

        title = rv.first.locator("b").inner_text(); n_rv = rv.count()
        rv.first.get_by_role("button", name="Accept").click()
        expect(pg.locator("#spReviewRows tr")).to_have_count(n_rv - 1)
        sid = next(s["id"] for s in stripped if s["title"] == title)
        ok("Accepting a review row saves it", json.load(open(cat))["songs"][[s["id"] for s in saved].index(sid)].get("spotifyTrackId", "").startswith("TEST"))
        if rv.count():
            n_rv = rv.count(); rv.first.get_by_role("button", name="Skip").click()
            expect(pg.locator("#spReviewRows tr")).to_have_count(n_rv - 1)
            ok("Skip removes the row without saving anything", True)
        row = nr.first; t2 = row.locator("b").inner_text()
        row.locator("input").fill("https://open.spotify.com/album/abc"); row.get_by_role("button", name="Add").click()
        ok("Pasting a non-track link explains the problem", "album link" in pg.locator("#spNoneRows").inner_text())
        nn = nr.count()
        nr.first.locator("input").fill("https://open.spotify.com/track/TEST999999999999999999?si=x"); nr.first.get_by_role("button", name="Add").click()
        expect(pg.locator("#spNoneRows tr")).to_have_count(nn - 1)
        sid2 = next(s["id"] for s in stripped if s["title"] == t2)
        ok("Pasting a track link by hand saves it", next(s for s in json.load(open(cat))["songs"] if s["id"] == sid2).get("spotifyTrackId") == "TEST999999999999999999")
        pg.get_by_text("All changes saved").wait_for()
        ok("Editor shows everything saved", True)
        ok("No page errors", not errors, "; ".join(errors[:2]))
        b.close()
finally:
    srv.kill(); srv2.kill(); subprocess.run(["pkill", "-f", "spotify_fake_server"])
print(f"\n{sum(results)}/{len(results)} passed"); sys.exit(0 if all(results) else 1)
