/**
 * Song of the Day catalogue (AQ-008). Metadata only: title, artist, genre,
 * emotional themes and an energy tag. No audio, artwork or lyrics. Listening
 * links are Spotify searches built from title and artist, so no API key or
 * sign-in is needed.
 */
import type { Energy, MusicGenre, RoastTheme, Song } from "@/types/content";
import { SPOTIFY_TRACK_IDS } from "./spotify-tracks";

export function spotifySearchUrl(title: string, artist: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

/** Spotify's official embedded player for one track (plays a preview for most listeners). */
export function spotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
}

function s(
  id: string,
  title: string,
  artist: string,
  genres: MusicGenre[],
  themes: RoastTheme[],
  energy: Energy,
): Song {
  const spotifyTrackId = SPOTIFY_TRACK_IDS[id];
  return {
    id,
    title,
    artist,
    genres,
    themes,
    energy,
    listenUrl: spotifySearchUrl(title, artist),
    ...(spotifyTrackId ? { spotifyTrackId } : {}),
  };
}

export const SONGS: Song[] = [
  // Pop
  s("call-me-maybe", "Call Me Maybe", "Carly Rae Jepsen", ["pop"], ["romantic_denial", "chaos"], "high"),
  s("i-knew-you-were-trouble", "I Knew You Were Trouble", "Taylor Swift", ["pop"], ["romantic_denial", "self_reflection"], "high"),
  s("shake-it-off", "Shake It Off", "Taylor Swift", ["pop"], ["boundaries", "confidence"], "high"),
  s("good-as-hell", "Good as Hell", "Lizzo", ["pop", "soul"], ["confidence", "boundaries"], "high"),
  s("uptown-funk", "Uptown Funk", "Mark Ronson, Bruno Mars", ["pop"], ["confidence", "chaos"], "high"),
  s("breathin", "breathin", "Ariana Grande", ["pop"], ["burnout", "self_reflection"], "medium"),
  s("thank-u-next", "thank u, next", "Ariana Grande", ["pop"], ["boundaries", "self_reflection"], "medium"),
  s("bad-guy", "bad guy", "Billie Eilish", ["pop", "electronic"], ["confidence", "chaos"], "medium"),
  s("levitating", "Levitating", "Dua Lipa", ["pop"], ["romantic_denial", "confidence"], "high"),
  s("new-rules", "New Rules", "Dua Lipa", ["pop"], ["boundaries", "romantic_denial"], "medium"),
  s("flowers", "Flowers", "Miley Cyrus", ["pop"], ["boundaries", "confidence"], "medium"),
  s("unstoppable", "Unstoppable", "Sia", ["pop"], ["ambition", "confidence"], "high"),
  s("hall-of-fame", "Hall of Fame", "The Script, will.i.am", ["pop", "rock"], ["ambition"], "high"),
  s("unwritten", "Unwritten", "Natasha Bedingfield", ["pop"], ["self_reflection", "ambition"], "medium"),
  s("dancing-on-my-own", "Dancing On My Own", "Robyn", ["pop", "electronic"], ["yearning", "romantic_denial"], "high"),
  s("golden", "Golden", "Harry Styles", ["pop"], ["yearning", "romantic_denial"], "medium"),
  s("liability", "Liability", "Lorde", ["pop", "indie"], ["self_reflection", "burnout"], "low"),

  // R&B and soul
  s("run-the-world", "Run the World (Girls)", "Beyoncé", ["pop", "rnb"], ["ambition", "confidence"], "high"),
  s("irreplaceable", "Irreplaceable", "Beyoncé", ["rnb"], ["boundaries"], "medium"),
  s("crazy-in-love", "Crazy in Love", "Beyoncé, JAY-Z", ["rnb"], ["romantic_denial", "chaos"], "high"),
  s("thinkin-bout-you", "Thinkin Bout You", "Frank Ocean", ["rnb"], ["yearning", "romantic_denial"], "low"),
  s("pink-white", "Pink + White", "Frank Ocean", ["rnb"], ["yearning", "self_reflection"], "low"),
  s("redbone", "Redbone", "Childish Gambino", ["rnb", "soul"], ["romantic_denial", "chaos"], "low"),
  s("cranes-in-the-sky", "Cranes in the Sky", "Solange", ["rnb", "soul"], ["burnout", "self_reflection"], "low"),
  s("feeling-good", "Feeling Good", "Nina Simone", ["soul"], ["confidence", "self_reflection"], "medium"),
  s("respect", "Respect", "Aretha Franklin", ["soul"], ["boundaries", "confidence"], "high"),
  s("lovely-day", "Lovely Day", "Bill Withers", ["soul"], ["burnout", "self_reflection"], "medium"),
  s("hit-the-road-jack", "Hit the Road Jack", "Ray Charles", ["soul"], ["boundaries", "chaos"], "high"),
  s("i-will-survive", "I Will Survive", "Gloria Gaynor", ["soul", "pop"], ["boundaries", "confidence"], "high"),

  // Hip-hop
  s("hey-ya", "Hey Ya!", "OutKast", ["hip_hop", "pop"], ["romantic_denial", "chaos"], "high"),
  s("lose-yourself", "Lose Yourself", "Eminem", ["hip_hop"], ["ambition"], "high"),
  s("alright", "Alright", "Kendrick Lamar", ["hip_hop"], ["burnout", "ambition"], "medium"),
  s("empire-state-of-mind", "Empire State of Mind", "JAY-Z, Alicia Keys", ["hip_hop", "rnb"], ["ambition", "yearning"], "high"),
  s("doo-wop", "Doo Wop (That Thing)", "Ms. Lauryn Hill", ["hip_hop", "rnb"], ["boundaries", "self_reflection"], "medium"),
  s("cant-hold-us", "Can't Hold Us", "Macklemore & Ryan Lewis, Ray Dalton", ["hip_hop"], ["ambition", "confidence"], "high"),
  s("feel-good-inc", "Feel Good Inc.", "Gorillaz", ["hip_hop", "indie"], ["chaos", "burnout"], "medium"),

  // Rock
  s("dont-stop-me-now", "Don't Stop Me Now", "Queen", ["rock"], ["confidence", "chaos"], "high"),
  s("under-pressure", "Under Pressure", "Queen, David Bowie", ["rock"], ["burnout"], "medium"),
  s("mr-brightside", "Mr. Brightside", "The Killers", ["rock", "indie"], ["chaos", "romantic_denial"], "high"),
  s("do-i-wanna-know", "Do I Wanna Know?", "Arctic Monkeys", ["rock", "indie"], ["romantic_denial", "yearning"], "medium"),
  s("shut-up-and-dance", "Shut Up and Dance", "WALK THE MOON", ["rock", "pop"], ["chaos"], "high"),
  s("dreams", "Dreams", "Fleetwood Mac", ["rock"], ["self_reflection", "yearning"], "medium"),
  s("eye-of-the-tiger", "Eye of the Tiger", "Survivor", ["rock"], ["ambition", "confidence"], "high"),
  s("everybody-wants-to-rule", "Everybody Wants to Rule the World", "Tears for Fears", ["rock", "pop"], ["ambition", "self_reflection"], "medium"),
  s("the-middle", "The Middle", "Jimmy Eat World", ["rock"], ["self_reflection", "confidence"], "high"),

  // Indie
  s("stressed-out", "Stressed Out", "Twenty One Pilots", ["indie"], ["burnout", "yearning"], "medium"),
  s("banana-pancakes", "Banana Pancakes", "Jack Johnson", ["indie"], ["burnout"], "low"),
  s("fast-car", "Fast Car", "Tracy Chapman", ["indie"], ["yearning", "ambition"], "medium"),
  s("somewhere-only-we-know", "Somewhere Only We Know", "Keane", ["indie", "rock"], ["yearning"], "medium"),
  s("space-song", "Space Song", "Beach House", ["indie"], ["yearning"], "low"),
  s("motion-sickness", "Motion Sickness", "Phoebe Bridgers", ["indie"], ["self_reflection", "boundaries"], "medium"),
  s("ribs", "Ribs", "Lorde", ["indie", "pop"], ["yearning", "chaos"], "medium"),

  // Electronic
  s("titanium", "Titanium", "David Guetta, Sia", ["electronic", "pop"], ["confidence", "boundaries"], "high"),
  s("weightless", "Weightless", "Marconi Union", ["electronic"], ["burnout"], "low"),
  s("wake-me-up", "Wake Me Up", "Avicii", ["electronic"], ["self_reflection", "yearning"], "high"),
  s("levels", "Levels", "Avicii", ["electronic"], ["chaos", "ambition"], "high"),
  s("midnight-city", "Midnight City", "M83", ["electronic", "indie"], ["yearning", "chaos"], "high"),
  s("higher-love", "Higher Love", "Kygo, Whitney Houston", ["electronic", "pop"], ["yearning", "confidence"], "high"),

  // Country
  s("need-you-now", "Need You Now", "Lady A", ["country"], ["yearning", "romantic_denial"], "low"),
  s("man-i-feel-like-a-woman", "Man! I Feel Like a Woman!", "Shania Twain", ["country", "pop"], ["confidence", "chaos"], "high"),
  s("9-to-5", "9 to 5", "Dolly Parton", ["country"], ["burnout", "ambition"], "high"),
  s("shouldve-said-no", "Should've Said No", "Taylor Swift", ["country"], ["boundaries"], "medium"),
  s("country-roads", "Take Me Home, Country Roads", "John Denver", ["country"], ["yearning"], "medium"),
  s("rainbow", "Rainbow", "Kacey Musgraves", ["country"], ["self_reflection", "burnout"], "low"),

  // Latin
  s("telepatia", "Telepatía", "Kali Uchis", ["latin", "rnb"], ["yearning", "romantic_denial"], "low"),
  s("despecha", "Despechá", "ROSALÍA", ["latin"], ["boundaries", "chaos"], "high"),
  s("gasolina", "Gasolina", "Daddy Yankee", ["latin"], ["chaos", "confidence"], "high"),
  s("hips-dont-lie", "Hips Don't Lie", "Shakira, Wyclef Jean", ["latin", "pop"], ["confidence"], "high"),
  s("mi-gente", "Mi Gente", "J Balvin, Willy William", ["latin", "electronic"], ["chaos"], "high"),
  s("dakiti", "DÁKITI", "Bad Bunny, Jhay Cortez", ["latin"], ["chaos", "yearning"], "medium"),
  s("ojitos-lindos", "Ojitos Lindos", "Bad Bunny, Bomba Estéreo", ["latin"], ["romantic_denial", "yearning"], "low"),
  s("waka-waka", "Waka Waka (This Time for Africa)", "Shakira, Freshlyground", ["latin", "pop"], ["ambition", "confidence"], "high"),
  s("vivir-mi-vida", "Vivir Mi Vida", "Marc Anthony", ["latin"], ["self_reflection", "burnout"], "high"),

  // K-pop
  s("butter", "Butter", "BTS", ["kpop"], ["confidence", "romantic_denial"], "high"),
  s("spring-day", "Spring Day", "BTS", ["kpop"], ["yearning"], "low"),
  s("life-goes-on", "Life Goes On", "BTS", ["kpop"], ["burnout", "self_reflection"], "low"),
  s("answer-love-myself", "Answer: Love Myself", "BTS", ["kpop"], ["self_reflection", "boundaries"], "medium"),
  s("mic-drop", "MIC Drop", "BTS", ["kpop"], ["ambition", "confidence"], "high"),
  s("ddu-du-ddu-du", "DDU-DU DDU-DU", "BLACKPINK", ["kpop"], ["confidence", "boundaries"], "high"),
  s("gangnam-style", "Gangnam Style", "PSY", ["kpop"], ["chaos"], "high"),
  s("ditto", "Ditto", "NewJeans", ["kpop"], ["yearning", "romantic_denial"], "low"),
  s("hype-boy", "Hype Boy", "NewJeans", ["kpop"], ["romantic_denial", "chaos"], "medium"),
  // ----- Added for variety (catalogue v2) -----
  // Pop
  s("anti-hero", "Anti-Hero", "Taylor Swift", ["pop"], ["self_reflection", "chaos"], "medium"),
  s("drivers-license", "drivers license", "Olivia Rodrigo", ["pop"], ["yearning", "romantic_denial"], "low"),
  s("good-4-u", "good 4 u", "Olivia Rodrigo", ["pop", "rock"], ["chaos", "boundaries"], "high"),
  s("as-it-was", "As It Was", "Harry Styles", ["pop"], ["yearning", "self_reflection"], "medium"),
  s("blinding-lights", "Blinding Lights", "The Weeknd", ["pop", "electronic"], ["chaos", "yearning"], "high"),
  s("dancing-queen", "Dancing Queen", "ABBA", ["pop"], ["confidence", "chaos"], "high"),
  s("stronger-kelly", "Stronger (What Doesn't Kill You)", "Kelly Clarkson", ["pop"], ["boundaries", "confidence"], "high"),
  s("since-u-been-gone", "Since U Been Gone", "Kelly Clarkson", ["pop", "rock"], ["boundaries", "chaos"], "high"),
  s("teenage-dream", "Teenage Dream", "Katy Perry", ["pop"], ["romantic_denial", "yearning"], "high"),
  s("roar", "Roar", "Katy Perry", ["pop"], ["confidence", "boundaries"], "high"),
  s("bad-romance", "Bad Romance", "Lady Gaga", ["pop", "electronic"], ["romantic_denial", "chaos"], "high"),
  s("rain-on-me", "Rain On Me", "Lady Gaga, Ariana Grande", ["pop", "electronic"], ["burnout", "self_reflection"], "high"),
  s("cruel-summer", "Cruel Summer", "Taylor Swift", ["pop"], ["romantic_denial", "chaos"], "high"),
  s("greedy", "greedy", "Tate McRae", ["pop"], ["boundaries", "confidence"], "high"),
  s("take-on-me", "Take On Me", "a-ha", ["pop", "electronic"], ["romantic_denial", "yearning"], "high"),

  // Indie
  s("electric-feel", "Electric Feel", "MGMT", ["indie", "electronic"], ["confidence", "romantic_denial"], "medium"),
  s("kids-mgmt", "Kids", "MGMT", ["indie", "electronic"], ["yearning", "self_reflection"], "high"),
  s("take-me-out", "Take Me Out", "Franz Ferdinand", ["indie", "rock"], ["confidence", "romantic_denial"], "high"),
  s("dog-days-are-over", "Dog Days Are Over", "Florence + The Machine", ["indie", "rock"], ["boundaries", "confidence"], "high"),
  s("shake-it-out", "Shake It Out", "Florence + The Machine", ["indie", "rock"], ["self_reflection", "boundaries"], "high"),
  s("ho-hey", "Ho Hey", "The Lumineers", ["indie"], ["yearning", "romantic_denial"], "medium"),
  s("riptide", "Riptide", "Vance Joy", ["indie"], ["romantic_denial", "chaos"], "medium"),
  s("little-talks", "Little Talks", "Of Monsters and Men", ["indie"], ["chaos", "self_reflection"], "high"),
  s("seven-nation-army", "Seven Nation Army", "The White Stripes", ["rock", "indie"], ["ambition", "confidence"], "high"),
  s("heat-waves", "Heat Waves", "Glass Animals", ["indie", "electronic"], ["yearning", "romantic_denial"], "medium"),
  s("less-i-know", "The Less I Know The Better", "Tame Impala", ["indie"], ["romantic_denial", "chaos"], "medium"),
  s("feel-it-still", "Feel It Still", "Portugal. The Man", ["indie", "rock"], ["confidence", "ambition"], "medium"),
  s("on-top-of-the-world", "On Top of the World", "Imagine Dragons", ["indie", "rock"], ["ambition", "confidence"], "high"),
  s("sweater-weather", "Sweater Weather", "The Neighbourhood", ["indie"], ["yearning", "romantic_denial"], "low"),

  // R&B
  s("good-days", "Good Days", "SZA", ["rnb"], ["burnout", "self_reflection"], "low"),
  s("golden-jill-scott", "Golden", "Jill Scott", ["rnb", "soul"], ["confidence", "self_reflection"], "medium"),
  s("survivor-dc", "Survivor", "Destiny's Child", ["rnb"], ["boundaries", "confidence"], "high"),
  s("say-my-name", "Say My Name", "Destiny's Child", ["rnb"], ["romantic_denial", "chaos"], "medium"),
  s("no-scrubs", "No Scrubs", "TLC", ["rnb"], ["boundaries"], "medium"),
  s("leave-the-door-open", "Leave The Door Open", "Bruno Mars, Anderson .Paak, Silk Sonic", ["rnb", "soul"], ["romantic_denial", "yearning"], "low"),
  s("rise-up", "Rise Up", "Andra Day", ["soul", "rnb"], ["ambition", "burnout"], "medium"),
  s("say-so", "Say So", "Doja Cat", ["pop", "rnb"], ["romantic_denial", "confidence"], "medium"),
  s("diamonds", "Diamonds", "Rihanna", ["pop", "rnb"], ["confidence", "self_reflection"], "medium"),
  s("young-dumb-broke", "Young Dumb & Broke", "Khalid", ["rnb", "pop"], ["burnout", "chaos"], "medium"),
  s("bood-up", "Boo'd Up", "Ella Mai", ["rnb"], ["romantic_denial"], "medium"),
  s("love-on-top", "Love On Top", "Beyoncé", ["rnb"], ["confidence", "romantic_denial"], "high"),

  // Hip-hop
  s("humble", "HUMBLE.", "Kendrick Lamar", ["hip_hop"], ["confidence", "boundaries"], "high"),
  s("old-town-road", "Old Town Road", "Lil Nas X", ["hip_hop", "country"], ["chaos", "confidence"], "high"),
  s("ms-jackson", "Ms. Jackson", "Outkast", ["hip_hop"], ["romantic_denial", "boundaries"], "medium"),
  s("super-bass", "Super Bass", "Nicki Minaj", ["hip_hop", "pop"], ["romantic_denial", "confidence"], "high"),
  s("gods-plan", "God's Plan", "Drake", ["hip_hop"], ["ambition", "self_reflection"], "medium"),
  s("hotline-bling", "Hotline Bling", "Drake", ["hip_hop", "rnb"], ["romantic_denial", "yearning"], "medium"),
  s("passionfruit", "Passionfruit", "Drake", ["hip_hop", "rnb"], ["yearning", "romantic_denial"], "low"),
  s("wavin-flag", "Wavin' Flag", "K'NAAN", ["hip_hop"], ["ambition", "yearning"], "high"),
  s("nice-for-what", "Nice For What", "Drake", ["hip_hop"], ["burnout", "confidence"], "high"),
  s("unity", "U.N.I.T.Y.", "Queen Latifah", ["hip_hop"], ["boundaries", "confidence"], "medium"),
  s("mirror-lil-wayne", "Mirror", "Lil Wayne, Bruno Mars", ["hip_hop"], ["self_reflection"], "medium"),

  // Rock
  s("aint-it-fun", "Ain't It Fun", "Paramore", ["rock"], ["boundaries", "self_reflection"], "high"),
  s("i-want-to-break-free", "I Want To Break Free", "Queen", ["rock"], ["boundaries", "burnout"], "high"),
  s("smells-like-teen-spirit", "Smells Like Teen Spirit", "Nirvana", ["rock"], ["chaos", "burnout"], "high"),
  s("basket-case", "Basket Case", "Green Day", ["rock"], ["chaos", "burnout"], "high"),
  s("boulevard-of-broken-dreams", "Boulevard of Broken Dreams", "Green Day", ["rock"], ["yearning", "self_reflection"], "medium"),
  s("go-your-own-way", "Go Your Own Way", "Fleetwood Mac", ["rock"], ["boundaries", "romantic_denial"], "high"),
  s("ironic", "Ironic", "Alanis Morissette", ["rock"], ["chaos", "self_reflection"], "medium"),
  s("livin-on-a-prayer", "Livin' On A Prayer", "Bon Jovi", ["rock"], ["ambition", "burnout"], "high"),
  s("here-comes-the-sun", "Here Comes The Sun", "The Beatles", ["rock"], ["burnout", "yearning"], "medium"),
  s("bohemian-rhapsody", "Bohemian Rhapsody", "Queen", ["rock"], ["chaos", "self_reflection"], "high"),
  s("africa", "Africa", "TOTO", ["rock"], ["yearning"], "medium"),

  // Electronic
  s("one-more-time", "One More Time", "Daft Punk", ["electronic"], ["chaos", "confidence"], "high"),
  s("get-lucky", "Get Lucky", "Daft Punk, Pharrell Williams, Nile Rodgers", ["electronic", "pop"], ["romantic_denial", "chaos"], "high"),
  s("lean-on", "Lean On", "Major Lazer, DJ Snake, MØ", ["electronic"], ["romantic_denial", "chaos"], "high"),
  s("dont-you-worry-child", "Don't You Worry Child", "Swedish House Mafia, John Martin", ["electronic"], ["yearning", "ambition"], "high"),
  s("something-just-like-this", "Something Just Like This", "The Chainsmokers, Coldplay", ["electronic", "pop"], ["self_reflection", "romantic_denial"], "high"),
  s("clarity", "Clarity", "Zedd, Foxes", ["electronic"], ["romantic_denial", "self_reflection"], "high"),
  s("strobe", "Strobe", "deadmau5", ["electronic"], ["burnout", "yearning"], "medium"),
  s("teardrop", "Teardrop", "Massive Attack", ["electronic"], ["burnout", "self_reflection"], "low"),
  s("intro-the-xx", "Intro", "The xx", ["indie", "electronic"], ["yearning", "burnout"], "medium"),
  s("im-good-blue", "I'm Good (Blue)", "David Guetta, Bebe Rexha", ["electronic", "pop"], ["boundaries", "confidence"], "high"),
  s("harder-better", "Harder, Better, Faster, Stronger", "Daft Punk", ["electronic"], ["ambition", "burnout"], "high"),
  s("faded", "Faded", "Alan Walker", ["electronic"], ["yearning", "self_reflection"], "medium"),
  s("without-me", "Without Me", "Halsey", ["pop", "electronic"], ["boundaries", "romantic_denial"], "medium"),

  // Soul
  s("aint-no-mountain", "Ain't No Mountain High Enough", "Marvin Gaye, Tammi Terrell", ["soul"], ["yearning", "confidence"], "high"),
  s("lets-stay-together", "Let's Stay Together", "Al Green", ["soul"], ["romantic_denial", "yearning"], "low"),
  s("a-change-is-gonna-come", "A Change Is Gonna Come", "Sam Cooke", ["soul"], ["yearning", "ambition"], "low"),
  s("rescue-me", "Rescue Me", "Fontella Bass", ["soul"], ["yearning"], "medium"),
  s("valerie", "Valerie", "Mark Ronson, Amy Winehouse", ["soul", "pop"], ["chaos", "yearning"], "high"),
  s("aint-no-sunshine", "Ain't No Sunshine", "Bill Withers", ["soul"], ["yearning"], "low"),
  s("dont-worry-be-happy", "Don't Worry Be Happy", "Bobby McFerrin", ["soul"], ["burnout"], "low"),
  s("move-on-up", "Move On Up", "Curtis Mayfield", ["soul"], ["ambition", "confidence"], "high"),
  s("i-say-a-little-prayer", "I Say a Little Prayer", "Aretha Franklin", ["soul"], ["romantic_denial", "yearning"], "medium"),
  s("crazy-gnarls", "Crazy", "Gnarls Barkley", ["soul", "hip_hop"], ["chaos", "self_reflection"], "medium"),
  s("aint-nobody", "Ain't Nobody", "Chaka Khan", ["soul"], ["romantic_denial", "confidence"], "high"),
  s("september", "September", "Earth, Wind & Fire", ["soul"], ["yearning", "chaos"], "high"),
  s("mercy-duffy", "Mercy", "Duffy", ["soul"], ["boundaries", "romantic_denial"], "high"),

  // Country
  s("wagon-wheel", "Wagon Wheel", "Darius Rucker", ["country"], ["yearning", "chaos"], "medium"),
  s("boot-scootin-boogie", "Boot Scootin' Boogie", "Brooks & Dunn", ["country"], ["confidence", "chaos"], "high"),
  s("follow-your-arrow", "Follow Your Arrow", "Kacey Musgraves", ["country"], ["confidence", "boundaries"], "medium"),
  s("space-cowboy", "Space Cowboy", "Kacey Musgraves", ["country"], ["boundaries", "romantic_denial"], "low"),
  s("slow-burn", "Slow Burn", "Kacey Musgraves", ["country"], ["burnout", "self_reflection"], "low"),
  s("something-in-the-orange", "Something in the Orange", "Zach Bryan", ["country"], ["yearning", "romantic_denial"], "low"),
  s("chicken-fried", "Chicken Fried", "Zac Brown Band", ["country"], ["self_reflection", "yearning"], "medium"),
  s("mamas-broken-heart", "Mama's Broken Heart", "Miranda Lambert", ["country"], ["chaos", "boundaries"], "high"),
  s("house-that-built-me", "The House That Built Me", "Miranda Lambert", ["country"], ["yearning", "self_reflection"], "low"),
  s("cowboy-take-me-away", "Cowboy Take Me Away", "The Chicks", ["country"], ["yearning", "ambition"], "medium"),
  s("wide-open-spaces", "Wide Open Spaces", "The Chicks", ["country"], ["ambition", "boundaries"], "medium"),
  s("any-man-of-mine", "Any Man Of Mine", "Shania Twain", ["country"], ["boundaries", "confidence"], "high"),
  s("love-story", "Love Story", "Taylor Swift", ["country", "pop"], ["romantic_denial", "yearning"], "high"),
  s("our-song", "Our Song", "Taylor Swift", ["country"], ["romantic_denial", "chaos"], "high"),

  // Latin
  s("despacito", "Despacito", "Luis Fonsi, Daddy Yankee", ["latin", "pop"], ["romantic_denial", "chaos"], "high"),
  s("la-bicicleta", "La Bicicleta", "Carlos Vives, Shakira", ["latin"], ["yearning", "chaos"], "high"),
  s("bailando", "Bailando", "Enrique Iglesias", ["latin", "pop"], ["romantic_denial", "chaos"], "high"),
  s("tqg", "TQG", "KAROL G, Shakira", ["latin"], ["boundaries", "confidence"], "high"),
  s("bzrp-53", "Shakira: Bzrp Music Sessions, Vol. 53", "Bizarrap, Shakira", ["latin", "electronic"], ["boundaries", "confidence"], "high"),
  s("provenza", "PROVENZA", "KAROL G", ["latin"], ["yearning", "burnout"], "medium"),
  s("la-vida-es-un-carnaval", "La Vida Es Un Carnaval", "Celia Cruz", ["latin"], ["burnout", "self_reflection"], "high"),
  s("tusa", "Tusa", "KAROL G, Nicki Minaj", ["latin"], ["romantic_denial", "boundaries"], "medium"),
  s("corazon-partio", "Corazón Partío", "Alejandro Sanz", ["latin"], ["yearning", "self_reflection"], "medium"),
  s("color-esperanza", "Color Esperanza", "Diego Torres", ["latin"], ["ambition", "self_reflection"], "medium"),
  s("danza-kuduro", "Danza Kuduro", "Don Omar, Lucenzo", ["latin"], ["chaos", "confidence"], "high"),
  s("echame-la-culpa", "Échame La Culpa", "Luis Fonsi, Demi Lovato", ["latin", "pop"], ["boundaries", "chaos"], "high"),
  s("soy-yo", "Soy Yo", "Bomba Estéreo", ["latin"], ["confidence", "self_reflection"], "medium"),
  s("latinoamerica", "Latinoamérica", "Calle 13", ["latin", "hip_hop"], ["ambition", "yearning"], "medium"),

  // K-pop
  s("dynamite", "Dynamite", "BTS", ["kpop"], ["burnout", "chaos"], "high"),
  s("permission-to-dance", "Permission to Dance", "BTS", ["kpop"], ["burnout", "confidence"], "high"),
  s("love-dive", "LOVE DIVE", "IVE", ["kpop"], ["confidence", "romantic_denial"], "medium"),
  s("fancy-twice", "FANCY", "TWICE", ["kpop"], ["romantic_denial", "confidence"], "high"),
  s("next-level", "Next Level", "aespa", ["kpop"], ["ambition", "confidence"], "high"),
  s("gods-menu", "God's Menu", "Stray Kids", ["kpop"], ["ambition", "chaos"], "high"),
  s("super-shy", "Super Shy", "NewJeans", ["kpop"], ["romantic_denial", "chaos"], "medium"),
  s("feel-special", "Feel Special", "TWICE", ["kpop"], ["burnout", "self_reflection"], "medium"),
  s("through-the-night", "Through the Night", "IU", ["kpop"], ["yearning"], "low"),
  s("eight", "eight", "IU, SUGA", ["kpop"], ["yearning", "self_reflection"], "medium"),
  s("antifragile", "ANTIFRAGILE", "LE SSERAFIM", ["kpop"], ["boundaries", "ambition"], "high"),
  s("fearless-lesserafim", "FEARLESS", "LE SSERAFIM", ["kpop"], ["confidence", "boundaries"], "high"),
  s("love-scenario", "LOVE SCENARIO", "iKON", ["kpop"], ["yearning", "self_reflection"], "medium"),
  s("fake-love", "FAKE LOVE", "BTS", ["kpop"], ["self_reflection", "romantic_denial"], "medium"),

];

export const songById: Record<string, Song> = Object.fromEntries(SONGS.map((song) => [song.id, song]));

export const GENRE_LABELS: Record<MusicGenre, string> = {
  pop: "Pop",
  indie: "Indie",
  rnb: "R&B",
  hip_hop: "Hip-hop",
  rock: "Rock",
  electronic: "Electronic",
  soul: "Soul",
  country: "Country",
  latin: "Latin",
  kpop: "K-pop",
};
