/**
 * Spotify track IDs for the Song of the Day player, keyed by song id.
 * Found on Spotify's own search (title and main artist matched; karaoke,
 * remix, live and cover versions skipped) and checked against Spotify's
 * oEmbed service, which returned the matching title for every ID.
 * First 82 checked 21 November 2026, the rest 22 November 2026.
 * Comments show the exact Spotify title and artists of the chosen track.
 */
export const SPOTIFY_TRACK_IDS: Record<string, string> = {
  "call-me-maybe": "20I6sIOMTCkB6w7ryavxtO", // Call Me Maybe by Carly Rae Jepsen
  "i-knew-you-were-trouble": "3lKZf71jeNi14udIFPJ29V", // I Knew You Were Trouble. by Taylor Swift
  "shake-it-off": "0cqRj7pUJDkTCEsJkx8snD", // Shake It Off by Taylor Swift
  "good-as-hell": "6KgBpzTuTRPebChN0VTyzV", // Good as Hell by Lizzo
  "uptown-funk": "32OlwWuMpZ6b0aN2RZOeMS", // Uptown Funk (feat. Bruno Mars) by Mark Ronson, Bruno Mars
  "breathin": "4OafepJy2teCjYJbvFE60J", // breathin by Ariana Grande
  "thank-u-next": "3e9HZxeyfWwjeyPAMmWSSQ", // thank u, next by Ariana Grande
  "bad-guy": "2Fxmhks0bxGSBdJ92vM42m", // bad guy by Billie Eilish
  "levitating": "39LLxExYz6ewLAcYrzQQyP", // Levitating by Dua Lipa
  "new-rules": "2ekn2ttSfGqwhhate0LSR0", // New Rules by Dua Lipa
  "flowers": "7DSAEUvxU8FajXtRloy8M0", // Flowers by Miley Cyrus
  "unstoppable": "1yvMUkIOTeUNtNWlWRgANS", // Unstoppable by Sia
  "hall-of-fame": "0FB5ILDICqwK6xj7W1RP9u", // Hall of Fame by The Script
  "unwritten": "3U5JVgI2x4rDyHGObzJfNf", // Unwritten by Natasha Bedingfield
  "dancing-on-my-own": "6aqNCrRA7vs7v6QvRpI50t", // Dancing On My Own by Robyn
  "golden": "45S5WTQEGOB1VHr1Q4FuPl", // Golden by Harry Styles
  "liability": "6Kkt27YmFyIFrcX3QXFi2o", // Liability by Lorde
  "run-the-world": "1uXbwHHfgsXcUKfSZw5ZJ0", // Run the World (Girls) by Beyoncé
  "irreplaceable": "6RX5iL93VZ5fKmyvNXvF1r", // Irreplaceable by Beyoncé
  "crazy-in-love": "5IVuqXILoxVWvWEPm82Jxr", // Crazy In Love (feat. JAŸ-Z) by Beyoncé, JAŸ-Z
  "thinkin-bout-you": "7DfFc7a6Rwfi3YQMRbDMau", // Thinkin Bout You by Frank Ocean
  "pink-white": "3xKsf9qdS1CyvXSMEid6g8", // Pink + White by Frank Ocean
  "redbone": "3vQ4T78TTMOjQXGfXVKQJo", // Redbone by Childish Gambino
  "cranes-in-the-sky": "48EjSdYh8wz2gBxxqzrsLe", // Cranes in the Sky by Solange
  "feeling-good": "6Rqn2GFlmvmV4w9Ala0I1e", // Feeling Good by Nina Simone
  "respect": "7s25THrKz86DM225dOYwnr", // Respect by Aretha Franklin
  "lovely-day": "0bRXwKfigvpKZUurwqAlEh", // Lovely Day by Bill Withers
  "hit-the-road-jack": "28oWUQCEDG6sK0HTev979v", // Hit the Road Jack by Ray Charles
  "i-will-survive": "7rIovIsXE6kMn629b7kDig", // I Will Survive by Gloria Gaynor
  "hey-ya": "2PpruBYCo4H7WOBJ7Q2EwM", // Hey Ya! by Outkast
  "lose-yourself": "5Z01UMMf7V1o0MzF86s6WJ", // Lose Yourself by Eminem
  "alright": "3iVcZ5G6tvkXZkZKlMpIUs", // Alright by Kendrick Lamar
  "empire-state-of-mind": "2igwFfvr1OAGX9SKDCPBwO", // Empire State Of Mind by JAŸ-Z, Alicia Keys
  "doo-wop": "0uEp9E98JB5awlA084uaIg", // Doo Wop (That Thing) by Ms. Lauryn Hill
  "cant-hold-us": "3bidbhpOYeV4knp8AIu8Xn", // Can't Hold Us (feat. Ray Dalton) by Macklemore & Ryan Lewis, Ray Dalton
  "feel-good-inc": "0d28khcov6AiegSCpG5TuT", // Feel Good Inc. by Gorillaz, De La Soul
  "dont-stop-me-now": "1NHWG8zxSEypSRF3UufrnO", // Don't Stop Me Now by Queen
  "under-pressure": "2nrG5UtAcqXbYttu7MXP1p", // Under Pressure (feat. David Bowie) by Queen, David Bowie
  "mr-brightside": "003vvx7Niy0yvhvHt4a68B", // Mr. Brightside by The Killers
  "do-i-wanna-know": "5FVd6KXrgO9B3JPmC8OPst", // Do I Wanna Know? by Arctic Monkeys
  "shut-up-and-dance": "4kbj5MwxO1bq9wjT5g9HaA", // Shut Up and Dance by WALK THE MOON
  "dreams": "1lbXEepatjRVjoG8pZMtdp", // Dreams by Fleetwood Mac
  "eye-of-the-tiger": "2HHtWyy5CgaQbC7XSoOb0e", // Eye of the Tiger by Survivor
  "everybody-wants-to-rule": "4RvWPyQ5RL0ao9LPZeSouE", // Everybody Wants To Rule The World by Tears For Fears
  "the-middle": "6GG73Jik4jUlQCkKg9JuGO", // The Middle by Jimmy Eat World
  "stressed-out": "3CRDbSIZ4r5MsZ0YwxuEkn", // Stressed Out by Twenty One Pilots
  "banana-pancakes": "0BgbobvykXxEvxo2HhCuvM", // Banana Pancakes by Jack Johnson
  "fast-car": "2M9ro2krNb7nr7HSprkEgo", // Fast Car by Tracy Chapman
  "somewhere-only-we-know": "1SKPmfSYaPsETbRHaiA18G", // Somewhere Only We Know by Keane
  "space-song": "1ZgMsA55GIY7ICkQh5MILA", // Space Song by Beach House
  "motion-sickness": "25Syi9wnfn6ZGAmiOBypPq", // Motion Sickness by Phoebe Bridgers
  "ribs": "2MvvoeRt8NcOXWESkxWn3g", // Ribs by Lorde
  "titanium": "0TDLuuLlV54CkRRUOahJb4", // Titanium (feat. Sia) by David Guetta, Sia
  "weightless": "6kkwzB6hXLIONkEk9JciA6", // Weightless by Marconi Union
  "wake-me-up": "0nrRP2bk19rLc0orkWPQk2", // Wake Me Up by Avicii
  "levels": "6Xe9wT5xeZETPwtaP2ynUz", // Levels - Original Version by Avicii
  "midnight-city": "6GyFP1nfCDB8lbD2bG0Hq9", // Midnight City by M83
  "higher-love": "6oJ6le65B3SEqPwMRNXWjY", // Higher Love by Kygo, Whitney Houston
  "need-you-now": "7GAaTpSoTWUTbP2Yxlt4Hd", // Need You Now by Lady A
  "man-i-feel-like-a-woman": "6sxptembJVty4sNtcPMAVz", // Man! I Feel Like A Woman! by Shania Twain
  "9-to-5": "4w3tQBXhn5345eUXDGBWZG", // 9 to 5 by Dolly Parton
  "shouldve-said-no": "6CdaXOq1MWe2JHDalTG01d", // Should've Said No by Taylor Swift
  "country-roads": "1QbOvACeYanja5pbnJbAmk", // Take Me Home, Country Roads by John Denver
  "rainbow": "79qxwHypONUt3AFq0WPpT9", // Rainbow by Kacey Musgraves
  "telepatia": "6tDDoYIxWvMLTdKpjFkc1B", // telepatía by Kali Uchis
  "despecha": "53tfEupEzQRtVFOeZvk7xq", // DESPECHÁ by ROSALÍA
  "gasolina": "5YoITs1m0q8UOQ4AW7N5ga", // Gasolina by Daddy Yankee
  "hips-dont-lie": "3d0WouFnFmr0K3kjeza3fF", // Hips Don't Lie (feat. Wyclef Jean) by Shakira, Wyclef Jean
  "mi-gente": "7COfe3P7KgfwDwIRB8LIDw", // Mi Gente by J Balvin, Willy William
  "dakiti": "47EiUVwUp4C9fGccaPuUCS", // DÁKITI by Bad Bunny, JHAYCO
  "ojitos-lindos": "3k3NWokhRRkEPhCzPmV8TW", // Ojitos Lindos by Bad Bunny, Bomba Estéreo
  "waka-waka": "6bNB5gxFX6Q87DbQWb8OWZ", // Waka Waka (This Time for Africa) [The Official 2010 FIFA World Cup (TM) Song] (feat. Freshlyground) by Shakira, Freshlyground
  "vivir-mi-vida": "3QHMxEOAGD51PDlbFPHLyJ", // Vivir Mi Vida by Marc Anthony
  "butter": "1mWdTewIgB3gtBM3TOSFhB", // Butter by BTS
  "spring-day": "2j1fFjWHCI9KJSwcuYAOyF", // Spring Day by BTS
  "life-goes-on": "5FVbvttjEvQ8r2BgUcJgNg", // Life Goes On by BTS
  "answer-love-myself": "2X3UgVLSA4wYriGIQyYmMA", // Answer : Love Myself by BTS
  "mic-drop": "4gZGAVECoiutzp64KSHNjE", // MIC Drop by BTS
  "ddu-du-ddu-du": "4lQsB3ERTWSNaAN1IkuNRl", // DDU-DU DDU-DU by BLACKPINK
  "gangnam-style": "03UrZgTINDqvnUMbbIMhql", // Gangnam Style (강남스타일) by PSY
  "ditto": "3r8RuvgbX9s7ammBn07D3W", // Ditto by NewJeans
  "hype-boy": "0a4MMyCrzT0En247IhqZbD", // Hype Boy by NewJeans
  "anti-hero": "0V3wPSX9ygBnCm8psDIegu", // Anti-Hero by Taylor Swift
  "drivers-license": "5wANPM4fQCJwkGd4rN57mH", // drivers license by Olivia Rodrigo
  "good-4-u": "4ZtFanR9U6ndgddUvNcjcG", // good 4 u by Olivia Rodrigo
  "as-it-was": "4Dvkj6JhhA12EX05fT7y2e", // As It Was by Harry Styles
  "blinding-lights": "0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights by The Weeknd
  "dancing-queen": "0GjEhVFGZW8afUYGChu3Rr", // Dancing Queen by ABBA
  "stronger-kelly": "1nInOsHbtotAmEOQhtvnzP", // Stronger (What Doesn't Kill You) by Kelly Clarkson
  "since-u-been-gone": "6JY1IdkZGeIcPegKxjSKeb", // Since U Been Gone by Kelly Clarkson
  "teenage-dream": "235LXPXfi0SmOaS9TaCh3c", // Teenage Dream by Katy Perry
  "roar": "6F5c58TMEs1byxUstkzVeM", // Roar by Katy Perry
  "bad-romance": "0SiywuOBRcynK0uKGWdCnn", // Bad Romance by Lady Gaga
  "rain-on-me": "7ju97lgwC2rKQ6wwsf9no9", // Rain On Me (with Ariana Grande) by Lady Gaga, Ariana Grande
  "cruel-summer": "1BxfuPKGuaTgP7aM0Bbdwr", // Cruel Summer by Taylor Swift
  "greedy": "3rUGC1vUpkDG9CZFHMur1t", // greedy by Tate McRae
  "take-on-me": "2WfaOiMkCvy7F5fcp2zZ8L", // Take on Me by a-ha
  "electric-feel": "3FtYbEfBqAlGO46NUDQSAt", // Electric Feel by MGMT
  "kids-mgmt": "1jJci4qxiYcOHhQR247rEU", // Kids by MGMT
  "take-me-out": "20I8RduZC2PWMWTDCZuuAN", // Take Me Out by Franz Ferdinand
  "dog-days-are-over": "456WNXWhDwYOSf5SpTuqxd", // Dog Days Are Over by Florence + The Machine
  "shake-it-out": "71iSmEeF0qRVyULABxP75P", // Shake It Out by Florence + The Machine
  "ho-hey": "0DwClY2t9YAWHBROMIgrXb", // Ho Hey by The Lumineers
  "riptide": "7yq4Qj7cqayVTp3FF9CWbm", // Riptide by Vance Joy
  "little-talks": "2ihCaVdNZmnHZWt0fvAM7B", // Little Talks by Of Monsters and Men
  "seven-nation-army": "3dPQuX8Gs42Y7b454ybpMR", // Seven Nation Army by The White Stripes
  "heat-waves": "3USxtqRwSYz57Ewm6wWRMp", // Heat Waves by Glass Animals
  "less-i-know": "6K4t31amVTZDgR3sKmwUJJ", // The Less I Know The Better by Tame Impala
  "feel-it-still": "6QgjcU0zLnzq5OrUoSZ3OK", // Feel It Still by Portugal. The Man
  "on-top-of-the-world": "213x4gsFDm04hSqIUkg88w", // On Top Of The World by Imagine Dragons
  "sweater-weather": "2QjOHCTQ1Jl3zawyYOpxh6", // Sweater Weather by The Neighbourhood
  "good-days": "4PMqSO5qyjpvzhlLI5GnID", // Good Days by SZA
  "golden-jill-scott": "28EL5veTZtx38TqxIZwFyQ", // Golden by Jill Scott
  "survivor-dc": "2Mpj1Ul5OFPyyP4wB62Rvi", // Survivor by Destiny's Child
  "say-my-name": "7H6ev70Weq6DdpZyyTmUXk", // Say My Name by Destiny's Child
  "no-scrubs": "1KGi9sZVMeszgZOWivFpxs", // No Scrubs by TLC
  "leave-the-door-open": "4pryE6cN2gFL1FVF5fYINl", // Leave The Door Open by Bruno Mars, Anderson .Paak, Silk Sonic
  "rise-up": "0tV8pOpiNsKqUys0ilUcXz", // Rise Up by Andra Day
  "say-so": "3Dv1eDb0MEgF93GpLXlucZ", // Say So by Doja Cat
  "diamonds": "6O20JhBJPePEkBdrB5sqRx", // Diamonds by Rihanna
  "young-dumb-broke": "5Z3GHaZ6ec9bsiI5BenrbY", // Young Dumb & Broke by Khalid
  "bood-up": "4squZv12LD9M8ooJfoVgZS", // Boo'd Up by Ella Mai
  "love-on-top": "1z6WtY7X4HQJvzxC4UgkSf", // Love On Top by Beyoncé
  "humble": "7KXjTSCq5nL1LoYtL7XAwS", // HUMBLE. by Kendrick Lamar
  "old-town-road": "0F7FA14euOIX8KcbEturGH", // Old Town Road by Lil Nas X
  "ms-jackson": "0I3q5fE6wg7LIfHGngUTnV", // Ms. Jackson by Outkast
  "super-bass": "3hlksXnvbKogFdPbpO9vel", // Super Bass by Nicki Minaj
  "gods-plan": "6DCZcSspjsKoFjzjrWoCdn", // God's Plan by Drake
  "hotline-bling": "0wwPcA6wtMf6HUMpIRdeP7", // Hotline Bling by Drake
  "passionfruit": "5mCPDVBb16L4XQwDdbRUpz", // Passionfruit by Drake
  "wavin-flag": "0zREtnLmVnt8KUJZZbSdla", // Wavin' Flag by K'NAAN
  "nice-for-what": "3CA9pLiwRIGtUBiMjbZmRw", // Nice For What by Drake
  "unity": "4OxXBAN51tjVBEjSwuWWbv", // U.N.I.T.Y. by Queen Latifah
  "mirror-lil-wayne": "5hUYsaOyMY32yjRXeuQwGj", // Mirror by Lil Wayne, Bruno Mars
  "aint-it-fun": "1j8z4TTjJ1YOdoFEDwJTQa", // Ain't It Fun by Paramore
  "i-want-to-break-free": "5lmMeytpSOBTzFYRS32fwA", // I Want To Break Free by Queen
  "smells-like-teen-spirit": "4CeeEOM32jQcH3eN9Q2dGj", // Smells Like Teen Spirit by Nirvana
  "basket-case": "6L89mwZXSOwYl76YXfX13s", // Basket Case by Green Day
  "boulevard-of-broken-dreams": "1hwJKpe0BPUsq6UUrwBWTw", // Boulevard of Broken Dreams by Green Day
  "go-your-own-way": "07GvNcU1WdyZJq3XxP0kZa", // Go Your Own Way - 2004 Remaster by Fleetwood Mac
  "ironic": "4oGTdOClZUxcM2H3UmXlwL", // Ironic by Alanis Morissette
  "livin-on-a-prayer": "37ZJ0p5Jm13JPevGcx4SkF", // Livin' On A Prayer by Bon Jovi
  "here-comes-the-sun": "6dGnYIeXmHdcikdzNNDMm2", // Here Comes The Sun - Remastered 2009 by The Beatles
  "bohemian-rhapsody": "2JiDi0qAXsPwhPqA2qaKGt", // Bohemian Rhapsody by Queen
  "africa": "2374M0fQpWi3dLnB54qaLX", // Africa by TOTO
  "one-more-time": "0DiWol3AO6WpXZgp0goxAV", // One More Time by Daft Punk
  "get-lucky": "69kOkLUCkxIZYexIgSG8rq", // Get Lucky (feat. Pharrell Williams and Nile Rodgers) by Daft Punk, Pharrell Williams, Nile Rodgers
  "lean-on": "4UKJUbcuStnnxLeJmVJsSc", // Lean On by Major Lazer, MØ, DJ Snake
  "dont-you-worry-child": "6o3HCF2T2iy8QkNxauobSn", // Don't You Worry Child (feat. John Martin) by Swedish House Mafia, John Martin
  "something-just-like-this": "1dNIEtp7AY3oDAKCGg2XkH", // Something Just Like This by The Chainsmokers, Coldplay
  "clarity": "60wwxj6Dd9NJlirf84wr2c", // Clarity by Zedd, Foxes
  "strobe": "4kJWtxDDNb9oAk3h7sX3N4", // Strobe by deadmau5
  "teardrop": "67Hna13dNDkZvBpTXRIaOJ", // Teardrop by Massive Attack, Elizabeth Fraser
  "intro-the-xx": "2usrT8QIbIk9y0NEtQwS4j", // Intro by The xx
  "im-good-blue": "4uUG5RXrOk84mYEfFvj3cK", // I'm Good (Blue) by David Guetta, Bebe Rexha
  "harder-better": "5W3cjX2J3tjhG8zb6u0qHn", // Harder, Better, Faster, Stronger by Daft Punk
  "faded": "7gHs73wELdeycvS48JfIos", // Faded by Alan Walker
  "without-me": "6FZDfxM3a3UCqtzo5pxSLZ", // Without Me by Halsey
  "aint-no-mountain": "7tqhbajSfrz2F7E1Z75ASX", // Ain't No Mountain High Enough by Marvin Gaye, Tammi Terrell
  "lets-stay-together": "63xdwScd1Ai1GigAwQxE8y", // Let's Stay Together by Al Green
  "a-change-is-gonna-come": "0YfOnJWqmAKaUvEL1QcNop", // A Change Is Gonna Come by Sam Cooke
  "rescue-me": "1GY8zOFi8rC39xXnD0tKO8", // Rescue Me by Fontella Bass
  "valerie": "6kopmMZiyLmw7h66uXcXR7", // Valerie (feat. Amy Winehouse) - Version Revisited by Mark Ronson, Amy Winehouse
  "aint-no-sunshine": "1k1Bqnv2R0uJXQN4u6LKYt", // Ain't No Sunshine by Bill Withers
  "dont-worry-be-happy": "5YbgcwHjQhdT1BYQ4rxWlD", // Don't Worry Be Happy by Bobby McFerrin
  "move-on-up": "2cK7SJ2O3CqDRHeixvFKgh", // Move On Up by Curtis Mayfield
  "i-say-a-little-prayer": "3NfxSdJnVdon1axzloJgba", // I Say a Little Prayer by Aretha Franklin
  "crazy-gnarls": "1vxw6aYJls2oq3gW0DujAo", // Crazy by Gnarls Barkley, CeeLo Green, Danger Mouse
  "aint-nobody": "2NVpYQqdraEcQwqT7GhUkh", // Ain't Nobody by Chaka Khan
  "september": "2grjqo0Frpf2okIBiifQKs", // September by Earth, Wind & Fire
  "mercy-duffy": "1zusIxNqJu8i4g6P6hJ2Qa", // Mercy by Duffy
  "wagon-wheel": "3xdjjKMcMOFgo1eQrfbogM", // Wagon Wheel by Darius Rucker
  "follow-your-arrow": "4CLPNURPcKztF9RRdcWLGP", // Follow Your Arrow by Kacey Musgraves
  "space-cowboy": "5bum4HbCDFoB9wpsc0sQky", // Space Cowboy by Kacey Musgraves
  "slow-burn": "6ET9kf9riLETWs9lePUEAI", // Slow Burn by Kacey Musgraves
  "something-in-the-orange": "3WMj8moIAXJhHsyLaqIIHI", // Something in the Orange by Zach Bryan
  "boot-scootin-boogie": "7Fq9RwQxSn3kW85PrDUf0M", // Boot Scootin' Boogie by Brooks & Dunn
  "chicken-fried": "0LQtEJt7x0s6knb6RKdRYc", // Chicken Fried by Zac Brown Band
  "mamas-broken-heart": "2mXsZsJBThTaJXbNcg5QD4", // Mama's Broken Heart by Miranda Lambert
  "house-that-built-me": "02eD9ymfJOJOhM97HYp5R9", // The House That Built Me by Miranda Lambert
  "cowboy-take-me-away": "3rXCZRMiMZp0feGcYXpwYX", // Cowboy Take Me Away by The Chicks
  "wide-open-spaces": "6cjwec9ii5uLK7CDfPBYt1", // Wide Open Spaces by The Chicks
  "any-man-of-mine": "0pdfN7nOHMYmKykzu1cyfm", // Any Man Of Mine by Shania Twain
  "love-story": "1D4PL9B8gOg78jiHg3FvBb", // Love Story by Taylor Swift
  "our-song": "1j6gmK6u4WNI33lMZ8dC1s", // Our Song by Taylor Swift
  "despacito": "6habFhsOp2NvshLv26DqMb", // Despacito by Luis Fonsi, Daddy Yankee
  "la-bicicleta": "0sXvAOmXgjR2QUqLK1MltU", // La Bicicleta by Carlos Vives, Shakira
  "bailando": "6PSKhwo0mVcOdjUOhVJd5p", // Bailando - Spanish Version by Enrique Iglesias, Descemer Bueno, Gente De Zona
  "tqg": "2oMjKuKUEJFuLiVmTq7Vjx", // TQG by KAROL G, Shakira
  "bzrp-53": "4nrPB8O7Y7wsOCJdgXkthe", // Shakira: Bzrp Music Sessions, Vol. 53/66 by Bizarrap, Shakira
  "provenza": "3HqcNJdZ2seoGxhn0wVNDK", // PROVENZA by KAROL G
  "la-vida-es-un-carnaval": "1BwrMGGhPA6GarWIYaFrW8", // La Vida Es Un Carnaval by Celia Cruz
  "tusa": "7k4t7uLgtOxPwTpFmtJNTY", // Tusa by KAROL G, Nicki Minaj
  "corazon-partio": "0wQCKR9OFjYu5Kzrk7WivJ", // Corazón partío by Alejandro Sanz
  "color-esperanza": "3T07pNAEVr9adeIG9i1ex4", // Color Esperanza by Diego Torres
  "danza-kuduro": "2ynaRz7EuNbDrNrlr3QUjP", // Danza Kuduro - Version MTO by Lucenzo, Don Omar
  "echame-la-culpa": "0mlAOSILGRys2IbvyOT5VJ", // Échame La Culpa by Luis Fonsi, Demi Lovato
  "soy-yo": "4Egb5xP6cniUx0kgZd5zLB", // Soy Yo by Bomba Estéreo
  "latinoamerica": "1xuYajTJZh8zZrPRmUaagf", // Latinoamérica (feat. Totó la Momposina, Susana Baca & Maria Rita) by Calle 13
  "dynamite": "5QDLhrAOJJdNAmCTJ8xMyW", // Dynamite by BTS
  "permission-to-dance": "3XYRV7ZSHqIRDG87DKTtry", // Permission to Dance by BTS
  "love-dive": "0Q5VnK2DYzRyfqQRJuUtvi", // LOVE DIVE by IVE
  "fancy-twice": "2qQpFbqqkLOGySgNK8wBXt", // FANCY by TWICE
  "next-level": "2zrhoHlFKxFTRF5aMyxMoQ", // Next Level by aespa
  "gods-menu": "4XPXrcpyNr30Km6aPiflJy", // God’s Menu by Stray Kids
  "super-shy": "5sdQOyqq2IDhvmx2lHOpwd", // Super Shy by NewJeans
  "feel-special": "3Hz3tTQwOdM6XkA0ALB2G9", // Feel Special by TWICE
  "through-the-night": "3P3UA61WRQqwCXaoFOTENd", // Through the Night by IU
  "eight": "0pYacDCZuRhcrwGUA5nTBe", // eight (Prod. & Feat. SUGA of BTS) by IU, SUGA
  "antifragile": "4fsQ0K37TOXa3hEQfjEic1", // ANTIFRAGILE by LE SSERAFIM
  "fearless-lesserafim": "296nXCOv97WJNRWzIBQnoj", // FEARLESS by LE SSERAFIM
  "love-scenario": "3d3ELsqKlQ7WA0a10Isu3l", // LOVE SCENARIO by iKON
  "fake-love": "6m1TWFMeon7ai9XLOzdbiR", // FAKE LOVE by BTS
};
