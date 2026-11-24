/**
 * Tries the Spotify matcher on songs that have no Spotify link.
 *
 *   npm run spotify:test                 20 songs, nothing saved (dry run)
 *   npm run spotify:test -- --count 50   more songs
 *   npm run spotify:test -- --all        every song missing a link
 *   npm run spotify:test -- --all --write   also saves the high-confidence matches
 *
 * Writes spotify-match-report.md (git-ignored) with every result.
 * Needs SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.
 */
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatCatalogue, validateCatalogue, type CatalogueFile } from "../../src/data/catalogue";
import { AUTO_ACCEPT, applySpotifyIds, findMatch, loadSpotifyConfig, SpotifyClient, SpotifyError, type MatchResult } from "./spotify";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalogue = process.env.CATALOGUE ? resolve(process.env.CATALOGUE) : resolve(root, "src/data/songs.json");
const args = process.argv.slice(2);
const all = args.includes("--all");
const write = args.includes("--write");
const count = Number(args[args.indexOf("--count") + 1]) || 20;

const cfg = loadSpotifyConfig(root);
if (!cfg) {
  console.error("\n  Spotify isn't set up yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local (see README).\n");
  process.exit(1);
}
const file = JSON.parse(await readFile(catalogue, "utf8")) as CatalogueFile;
const missing = file.songs.filter((s) => !s.retired && !s.spotifyTrackId);
// A spread across the list, not just the first few, so the test sees varied artists.
const pickN = Math.min(count, missing.length);
const sample = all ? missing : Array.from({ length: pickN }, (_, i) => missing[Math.floor((i * missing.length) / pickN)]);

console.log(`\n  ${missing.length} active songs have no Spotify link. Checking ${sample.length}${write ? "" : " (dry run, nothing saved)"}…\n`);
const client = new SpotifyClient(cfg);
const results: Array<{ id: string; title: string; artist: string; r?: MatchResult; error?: string }> = [];
let stopped = "";
for (const [i, s] of sample.entries()) {
  try {
    const r = await findMatch(client, s);
    results.push({ id: s.id, title: s.title, artist: s.artist, r });
    const label = r.decision === "auto" ? "MATCHED" : r.decision === "review" ? "REVIEW " : "NO MATCH";
    console.log(`  ${String(i + 1).padStart(3)}/${sample.length}  ${label}  ${s.title} – ${s.artist}${r.best ? `  →  ${r.best.name} – ${r.best.artists} (${r.best.confidence}%)` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ id: s.id, title: s.title, artist: s.artist, error: msg });
    console.log(`  ${String(i + 1).padStart(3)}/${sample.length}  ERROR    ${s.title} – ${s.artist}: ${msg}`);
    if (e instanceof SpotifyError && ["auth", "quota", "config"].includes(e.kind)) {
      stopped = msg;
      break;
    }
  }
}

const auto = results.filter((x) => x.r?.decision === "auto");
const review = results.filter((x) => x.r?.decision === "review");
const none = results.filter((x) => x.r?.decision === "none");
const errors = results.filter((x) => x.error);
const cell = (s: string) => s.replace(/\|/g, "\\|");
const lines = [
  `# Spotify match report`,
  ``,
  `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${results.length} songs checked${write ? "" : " · dry run"} · market ${client.market ?? "any"} · ${client.requests} API requests`,
  ``,
  `- Matched automatically (${AUTO_ACCEPT}%+ and confirmed by ID): **${auto.length}**`,
  `- Need review: **${review.length}**`,
  `- No match: **${none.length}**`,
  `- Errors: **${errors.length}**${stopped ? ` (stopped early: ${stopped})` : ""}`,
  ``,
  `## Matched automatically`,
  ``,
  `| Song | Spotify track | Album | Confidence | Link |`,
  `|---|---|---|---|---|`,
  ...auto.map((x) => `| ${cell(x.title)} – ${cell(x.artist)} | ${cell(x.r!.best!.name)} – ${cell(x.r!.best!.artists)} | ${cell(x.r!.best!.album)} (${x.r!.best!.albumType}, ${x.r!.best!.year}) | ${x.r!.best!.confidence}% | ${x.r!.best!.url} |`),
  ``,
  `## Need review`,
  ``,
  `| Song | Best candidate | Confidence | Why | Link |`,
  `|---|---|---|---|---|`,
  ...review.map((x) => `| ${cell(x.title)} – ${cell(x.artist)} | ${cell(x.r!.best!.name)} – ${cell(x.r!.best!.artists)} (${cell(x.r!.best!.album)}) | ${x.r!.best!.confidence}% | ${x.r!.best!.notes.join("; ")} | ${x.r!.best!.url} |`),
  ``,
  `## No match`,
  ``,
  `| Song | Thrown out | Search on Spotify |`,
  `|---|---|---|`,
  ...none.map((x) => `| ${cell(x.title)} – ${cell(x.artist)} | ${x.r!.rejected.slice(0, 3).map((c) => `${cell(c.name)} – ${cell(c.artists)}: ${c.rejected}`).join("; ") || "—"} | ${x.r!.searchUrl} |`),
  ``,
  ...(errors.length ? [`## Errors`, ``, ...errors.map((x) => `- ${x.title} – ${x.artist}: ${x.error}`), ``] : []),
];
await writeFile(resolve(root, "spotify-match-report.md"), lines.join("\n"), "utf8");

if (write && auto.length) {
  // Re-read in case the editor saved meanwhile, then validate before writing.
  const fresh = JSON.parse(await readFile(catalogue, "utf8")) as CatalogueFile;
  const { songs, applied } = applySpotifyIds(fresh.songs, Object.fromEntries(auto.map((x) => [x.id, x.r!.trackId!])));
  const report = validateCatalogue(songs, new Set(fresh.songs.map((s) => s.id)));
  if (report.errors > 0) {
    console.log(`\n  Not saved: the catalogue check found ${report.errors} problem(s). Open the editor to see them.`);
  } else {
    await writeFile(`${catalogue}.tmp`, formatCatalogue(songs), "utf8");
    await rename(`${catalogue}.tmp`, catalogue);
    console.log(`\n  Saved ${applied.length} Spotify links to songs.json.`);
  }
}
console.log(`\n  Matched ${auto.length} · review ${review.length} · no match ${none.length} · errors ${errors.length}`);
console.log(`  Full report: spotify-match-report.md\n`);
