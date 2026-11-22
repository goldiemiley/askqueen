import { describe, expect, it } from "vitest";
import {
  validateAll,
  validateAskResponse,
  validateCompatibilityPair,
  validateRoast,
  validateSignProfile,
  validateSong,
  validateTheme,
} from "@/lib/validate-content";

describe("content schema validators", () => {
  it("accepts a valid sign profile and rejects an impossible date", () => {
    const ok = {
      sign: "aries",
      displayName: "Aries",
      start: { month: 3, day: 21 },
      end: { month: 4, day: 19 },
      element: "fire",
      vibe: "Started a fight with a door that said pull.",
    };
    expect(validateSignProfile(ok)).toEqual([]);
    expect(validateSignProfile({ ...ok, end: { month: 4, day: 31 } })).toContain(
      "end.day is not a valid day for month 4",
    );
    expect(validateSignProfile({ ...ok, sign: "ophiuchus" })).toContain("sign is not a known zodiac sign");
  });

  it("allows 29 February as a boundary-capable date", () => {
    const p = {
      sign: "pisces",
      displayName: "Pisces",
      start: { month: 2, day: 19 },
      end: { month: 3, day: 20 },
      element: "water",
      vibe: "Crying at a car advert. Again.",
    };
    expect(validateSignProfile({ ...p, start: { month: 2, day: 29 } })).toEqual([]);
    expect(validateSignProfile({ ...p, start: { month: 2, day: 30 } })).not.toEqual([]);
  });

  it("requires all three intensity variants on a roast", () => {
    const roast = {
      id: "leo-confidence-1",
      sign: "leo",
      theme: "confidence",
      variants: { gentle: "a", savage: "b", unhinged: "c" },
    };
    expect(validateRoast(roast)).toEqual([]);
    expect(validateRoast({ ...roast, variants: { gentle: "a", savage: "b" } })).toContain(
      "variants.unhinged is required",
    );
    expect(validateRoast({ ...roast, theme: "vibes" })).toContain("theme is not a known theme");
  });

  it("requires songs to carry a theme and an https listening link", () => {
    const song = {
      id: "song-1",
      title: "Example",
      artist: "Example Artist",
      themes: ["yearning"],
      genres: ["indie"],
      listenUrl: "https://open.spotify.com/search/Example%20Example%20Artist",
    };
    expect(validateSong(song)).toEqual([]);
    expect(validateSong({ ...song, themes: [] })).toContain("themes must be a non-empty list of known themes");
    expect(validateSong({ ...song, listenUrl: "http://example.com" })).toContain("listenUrl must use https");
    expect(validateSong({ ...song, genres: ["polka"] })).toContain("genres must be a non-empty list of known genres");
  });

  it("validates themes, ask responses and compatibility pairs", () => {
    expect(
      validateTheme({ id: "burnout", label: "Burnout", description: "Tired.", songReasons: ['"{title}" for the tired'] }),
    ).toEqual([]);
    expect(validateTheme({ id: "burnout", label: "Burnout", description: "Tired.", songReasons: ["no title"] })).not.toEqual(
      [],
    );
    expect(validateAskResponse({ id: "r1", category: "career", stance: "maybe", text: "Babe, be serious." })).toEqual(
      [],
    );
    expect(validateAskResponse({ id: "r2", category: "career", stance: "maybe", text: "x".repeat(300) })).not.toEqual(
      [],
    );
    expect(
      validateCompatibilityPair({
        signs: ["aries", "libra"],
        baseScore: 72,
        chemistry: "a",
        communication: "b",
        emotionalChaos: "c",
      }),
    ).toEqual([]);
    expect(
      validateCompatibilityPair({ signs: ["aries"], baseScore: 120, chemistry: "", communication: "b", emotionalChaos: "c" }),
    ).toHaveLength(3);
  });

  it("flags duplicate ids across a list", () => {
    const r = { id: "dup", category: "other", stance: "yes", text: "Yes." };
    expect(validateAll([r, r], validateAskResponse)).toEqual(["dup: duplicate id"]);
  });
});
