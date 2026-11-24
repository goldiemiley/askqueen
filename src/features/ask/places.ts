/**
 * Recognisable destinations, so Sabrina can say "Portugal" back to you.
 * Only places on this list are ever echoed (in answers or share links), so
 * no free text from a question can end up in a shared link this way.
 * Names that are also everyday words or first names (Chad, Jordan, Turkey,
 * Nice, Florence…) only count after "to", "in", "from", "visit" and similar.
 */
export type Place = { key: string; name: string; ambiguous?: true };

const P = (name: string, extra: { aliases?: string[]; ambiguous?: true } = {}) => ({ name, ...extra });

const LIST: Array<{ name: string; aliases?: string[]; ambiguous?: true }> = [
  // Countries
  P("Albania"), P("Algeria"), P("Andorra"), P("Angola"), P("Argentina"), P("Armenia"), P("Australia", { aliases: ["oz"] }),
  P("Austria"), P("Azerbaijan"), P("the Bahamas", { aliases: ["bahamas"] }), P("Bahrain"), P("Bangladesh"), P("Barbados"),
  P("Belarus"), P("Belgium"), P("Belize"), P("Benin"), P("Bhutan"), P("Bolivia"), P("Bosnia", { aliases: ["bosnia and herzegovina"] }),
  P("Botswana"), P("Brazil", { aliases: ["brasil"] }), P("Brunei"), P("Bulgaria"), P("Cambodia"), P("Cameroon"), P("Canada"),
  P("Cape Verde"), P("Chile"), P("China", { ambiguous: true }), P("Colombia"), P("Costa Rica"), P("Croatia"), P("Cuba"), P("Cyprus"),
  P("Czechia", { aliases: ["czech republic"] }), P("Denmark"), P("the Dominican Republic", { aliases: ["dominican republic"] }),
  P("Ecuador"), P("Egypt"), P("El Salvador"), P("England"), P("Estonia"), P("Ethiopia"), P("Fiji"), P("Finland"), P("France"),
  P("Georgia", { ambiguous: true }), P("Germany"), P("Ghana"), P("Greece"), P("Guatemala"), P("Honduras"), P("Hungary"),
  P("Iceland"), P("India"), P("Indonesia"), P("Iran"), P("Iraq"), P("Ireland"), P("Israel"), P("Italy"), P("Jamaica"), P("Japan"),
  P("Jordan", { ambiguous: true }), P("Kazakhstan"), P("Kenya"), P("Kosovo"), P("Kuwait"), P("Laos"), P("Latvia"), P("Lebanon"),
  P("Liechtenstein"), P("Lithuania"), P("Luxembourg"), P("Madagascar"), P("Malaysia"), P("the Maldives", { aliases: ["maldives"] }),
  P("Malta"), P("Mauritius"), P("Mexico"), P("Moldova"), P("Monaco"), P("Mongolia"), P("Montenegro"), P("Morocco"), P("Mozambique"),
  P("Namibia"), P("Nepal"), P("the Netherlands", { aliases: ["netherlands", "holland"] }), P("New Zealand", { aliases: ["nz"] }),
  P("Nicaragua"), P("Nigeria"), P("North Macedonia", { aliases: ["macedonia"] }), P("Norway"), P("Oman"), P("Pakistan"), P("Panama"),
  P("Paraguay"), P("Peru"), P("the Philippines", { aliases: ["philippines"] }), P("Poland"), P("Portugal"), P("Puerto Rico"),
  P("Qatar"), P("Romania"), P("Russia"), P("Rwanda"), P("Saudi Arabia"), P("Scotland"), P("Senegal"), P("Serbia"), P("Seychelles"),
  P("Singapore"), P("Slovakia"), P("Slovenia"), P("South Africa"), P("South Korea", { aliases: ["korea"] }), P("Spain"),
  P("Sri Lanka"), P("Sweden"), P("Switzerland"), P("Taiwan"), P("Tanzania"), P("Thailand"), P("Tunisia"),
  P("Turkey", { aliases: ["turkiye"], ambiguous: true }), P("Uganda"), P("Ukraine"), P("the UAE", { aliases: ["uae", "united arab emirates", "emirates"] }),
  P("the UK", { aliases: ["uk", "united kingdom", "britain", "great britain"] }), P("the US", { aliases: ["us", "usa", "united states", "america", "the states"] }),
  P("Uruguay"), P("Uzbekistan"), P("Vietnam"), P("Wales"), P("Zambia"), P("Zimbabwe"),
  // Regions people move to or travel to
  P("Europe"), P("Asia"), P("South America"), P("Africa"), P("Scandinavia"), P("Bali"), P("Hawaii"), P("California"), P("Florida"),
  P("Texas"), P("the Canary Islands", { aliases: ["canary islands", "canaries"] }), P("Tenerife"), P("Ibiza"), P("Mallorca", { aliases: ["majorca"] }),
  P("Santorini"), P("Mykonos"), P("Crete"), P("Sicily"), P("Sardinia"), P("Tuscany"), P("the Algarve", { aliases: ["algarve"] }),
  P("Madeira"), P("the Azores", { aliases: ["azores"] }), P("Phuket"), P("Cancun"), P("Tulum"),
  // Cities
  P("Amsterdam"), P("Athens"), P("Auckland"), P("Bangkok"), P("Barcelona"), P("Beijing"), P("Belgrade"), P("Berlin"), P("Bologna"),
  P("Boston"), P("Brussels"), P("Budapest"), P("Buenos Aires"), P("Cairo"), P("Cape Town"), P("Chicago"), P("Copenhagen"),
  P("Dubai"), P("Dublin"), P("Edinburgh"), P("Florence", { ambiguous: true }), P("Hamburg"), P("Helsinki"), P("Hong Kong"),
  P("Istanbul"), P("Kyoto"), P("Lagos"), P("Las Vegas", { aliases: ["vegas"] }), P("Lisbon"), P("London"), P("Los Angeles", { aliases: ["la"], ambiguous: true }),
  P("Madrid"), P("Manchester"), P("Marrakech", { aliases: ["marrakesh"] }), P("Melbourne"), P("Mexico City"), P("Miami"), P("Milan"),
  P("Montreal"), P("Mumbai"), P("Munich"), P("Naples"), P("New York", { aliases: ["nyc", "new york city"] }), P("Nice", { ambiguous: true }),
  P("Osaka"), P("Oslo"), P("Paris"), P("Porto"), P("Prague"), P("Reykjavik"), P("Rio", { aliases: ["rio de janeiro"] }), P("Rome"),
  P("San Francisco", { aliases: ["sf"], ambiguous: true }), P("Sarajevo"), P("Seoul"), P("Seville"), P("Shanghai"),
  P("Sofia", { ambiguous: true }), P("Stockholm"), P("Sydney", { ambiguous: true }), P("Tbilisi"), P("Tokyo"), P("Toronto"),
  P("Valencia"), P("Vancouver"), P("Venice"), P("Vienna"), P("Warsaw"), P("Zagreb"), P("Zurich"),
];

const keyOf = (name: string) =>
  name
    .replace(/^the /i, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const PLACES: Place[] = LIST.map((p) => ({ key: keyOf(p.name), name: p.name, ...(p.ambiguous ? { ambiguous: true as const } : {}) }));
export const placeByKey: Record<string, Place> = Object.fromEntries(PLACES.map((p) => [p.key, p]));

/** Every spelling we match, longest first so "new york city" wins over "new york". */
const SPELLINGS: Array<{ text: string; place: Place }> = LIST.flatMap((p, i) =>
  [p.name.replace(/^the /i, ""), ...(p.aliases ?? [])].map((t) => ({ text: t.toLowerCase(), place: PLACES[i] })),
).sort((a, b) => b.text.length - a.text.length);

/** Words that make an ambiguous name clearly a place. */
const PLACE_CONTEXT = /(?:^|\s)(?:to|in|from|into|at|visit|visiting|around|across|near|outside|than|for)\s+(?:the\s+)?$/;

export type FoundPlace = { place: Place; start: number; end: number };

/** Finds the first known place in normalised (lowercase, unaccented) text. */
export function findPlace(normalized: string): FoundPlace | null {
  let best: FoundPlace | null = null;
  for (const { text, place } of SPELLINGS) {
    const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+")})(?=$|[^\\p{L}\\p{N}])`, "gu");
    for (const m of normalized.matchAll(re)) {
      const start = (m.index ?? 0) + m[0].length - m[1].length;
      // Two-letter aliases ("us", "uk", "la", "nz", "sf") and ambiguous names need place context.
      const needsContext = place.ambiguous || text.length <= 3;
      if (needsContext && !PLACE_CONTEXT.test(normalized.slice(0, start))) continue;
      // "us" is almost always the pronoun unless it's "the us".
      if (text === "us" && !/the\s+$/.test(normalized.slice(0, start))) continue;
      if (!best || start < best.start) best = { place, start, end: start + m[1].length };
      break;
    }
  }
  return best;
}
