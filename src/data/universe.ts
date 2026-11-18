export type FontCategory = 'serif' | 'sans-serif' | 'monospace' | 'display';
export type FontSource = 'google' | 'fontshare';

export interface UniverseFont {
  readonly id: string;
  readonly name: string;
  readonly category: FontCategory;
  readonly source: FontSource;
  readonly googleFont?: string;
  readonly specimen: string;
  readonly signatureGlyph: string;
  readonly displayAffinity: number;   // 0–10
  readonly visualWeight: number;      // 1–10
  readonly humanistGeometric: number; // -1.0 to +1.0
  readonly tier: 1 | 2 | 3;
  readonly indic: boolean;
}

// ─── INDIC IDs (Devanagari/script-origin fonts with shirorekha treatment) ───
export const INDIC_FONT_IDS = new Set<string>([
  'eczar', 'mukta', 'hind', 'baloo-2', 'noto-sans',
  'tiro-devanagari', 'yatra-one', 'martel', 'laila', 'rozha-one',
  'shrikhand', 'baloo-bhai-2', 'noto-serif-devanagari', 'rajdhani',
  'anek-devanagari', 'halant', 'khand', 'poppins',
]);

// ─── TIER 1 — 16 anchor fonts ────────────────────────────────────────────────
const T1 = new Set<string>([
  'instrument-serif', 'fraunces', 'cormorant-garamond', 'playfair-display',
  'dm-serif-display', 'dm-sans', 'space-grotesk', 'satoshi',
  'cabinet-grotesk', 'bricolage-grotesque', 'mukta', 'clash-display',
  'syne', 'shrikhand', 'inter', 'jetbrains-mono',
]);

// ─── TIER 2 — ~50 secondary fonts ────────────────────────────────────────────
const T2 = new Set<string>([
  'libre-baskerville', 'lora', 'merriweather', 'source-serif-4', 'crimson-pro',
  'eb-garamond', 'bitter', 'roboto-slab', 'spectral', 'bodoni-moda',
  'abril-fatface', 'dm-serif-text', 'elsie', 'yeseva-one', 'alegreya',
  'epilogue', 'sora', 'lexend', 'chivo', 'outfit', 'general-sans',
  'switzer', 'plus-jakarta-sans', 'poppins', 'nunito', 'raleway',
  'work-sans', 'josefin-sans', 'fira-sans', 'source-sans-3', 'ibm-plex-sans',
  'jost', 'barlow', 'manrope', 'figtree', 'lato', 'roboto', 'open-sans',
  'eczar', 'hind', 'baloo-2', 'noto-sans', 'tiro-devanagari',
  'yatra-one', 'rozha-one', 'noto-serif-devanagari', 'rajdhani',
  'fira-code', 'source-code-pro', 'space-mono',
  'unbounded', 'archivo', 'sentient',
]);

function tier(id: string): 1 | 2 | 3 {
  if (T1.has(id)) return 1;
  if (T2.has(id)) return 2;
  return 3;
}

function indic(id: string): boolean {
  return INDIC_FONT_IDS.has(id);
}

function f(
  id: string, name: string, category: FontCategory, source: FontSource,
  specimen: string, _signatureGlyph: string, // ignored — derived below
  displayAffinity: number, visualWeight: number, humanistGeometric: number,
  googleFont?: string,
): UniverseFont {
  // 'Aa' across all fonts — capital + lowercase = the universal font specimen.
  // Devanagari origin: 'अआ' mirrors the Aa logic in script.
  const signatureGlyph = INDIC_FONT_IDS.has(id) ? 'अआ' : 'Aa';
  return { id, name, category, source, googleFont, specimen, signatureGlyph,
           displayAffinity, visualWeight, humanistGeometric,
           tier: tier(id), indic: indic(id) };
}

export const FONT_UNIVERSE: readonly UniverseFont[] = [
  // ── EXISTING 25 ────────────────────────────────────────────────────────────
  f('instrument-serif','Instrument Serif','serif','google','Sharp & refined','R',8,4,0.1,'Instrument+Serif'),
  f('fraunces','Fraunces','serif','google','Wonky old soul','a',7,6,-0.6,'Fraunces'),
  f('playfair-display','Playfair Display','serif','google','Didone drama, evening wear','Q',7,5,0.2,'Playfair+Display'),
  f('cormorant-garamond','Cormorant Garamond','serif','google','Hairline garalde perfume','f',6,2,-0.8,'Cormorant+Garamond'),
  f('dm-serif-display','DM Serif Display','display','google','Fat didone headline machine','g',9,7,0.1,'DM+Serif+Display'),
  f('libre-baskerville','Libre Baskerville','serif','google','Reads all day politely','Q',3,5,-0.3,'Libre+Baskerville'),
  f('dm-sans','DM Sans','sans-serif','google','Quietly geometric everyday','g',4,4,0.5,'DM+Sans'),
  f('space-grotesk','Space Grotesk','sans-serif','google','Techy with sly quirks','G',6,5,0.4,'Space+Grotesk'),
  f('plus-jakarta-sans','Plus Jakarta Sans','sans-serif','google','City branding, warm edges','a',4,4,0.3,'Plus+Jakarta+Sans'),
  f('epilogue','Epilogue','sans-serif','google','Editorial, endlessly variable','y',5,4,0.3,'Epilogue'),
  f('sora','Sora','sans-serif','google','Clean future, no chrome','S',5,4,0.7,'Sora'),
  f('lexend','Lexend','sans-serif','google','Engineered for easy reading','x',3,4,0.8,'Lexend'),
  f('chivo','Chivo','sans-serif','google','Grotesque with a spine','C',4,5,0.2,'Chivo'),
  f('outfit','Outfit','sans-serif','google','Pure circles, zero fuss','O',5,4,0.9,'Outfit'),
  f('satoshi','Satoshi','sans-serif','fontshare',"The internet's house geometric",'S',4,4,0.6),
  f('cabinet-grotesk','Cabinet Grotesk','sans-serif','fontshare','Curvy grotesk, big personality','G',6,5,0.1),
  f('general-sans','General Sans','sans-serif','fontshare','Dependable, never boring','a',4,4,0.4),
  f('switzer','Switzer','sans-serif','fontshare','Helvetica, but softer edges','R',3,4,0.2),
  f('clash-display','Clash Display','display','fontshare','Big, blocky, unapologetic','A',10,7,0.6),
  f('bricolage-grotesque','Bricolage Grotesque','sans-serif','google','Weird uncle of grotesks','g',7,5,-0.2,'Bricolage+Grotesque'),
  f('eczar','Eczar','serif','google','The shirorekha holds everything','क',6,6,-0.8,'Eczar'),
  f('mukta','Mukta','sans-serif','google','Workhorse across seven scripts','म',3,4,-0.4,'Mukta'),
  f('hind','Hind','sans-serif','google','UI voice of Devanagari','ह',3,4,-0.3,'Hind'),
  f('baloo-2','Baloo 2','display','google','Chubby, cheerful, unstoppable','ब',8,9,-0.5,'Baloo+2'),
  f('noto-sans','Noto Sans','sans-serif','google','Every language, no tofu','न',2,4,0.0,'Noto+Sans'),

  // ── SERIFS & SLABS ─────────────────────────────────────────────────────────
  f('lora','Lora','serif','google','Brushed roots, screen manners','g',3,5,-0.5,'Lora'),
  f('merriweather','Merriweather','serif','google','Sturdy pixels, long reads','M',3,6,-0.2,'Merriweather'),
  f('pt-serif','PT Serif','serif','google','Civic Russian pragmatism','т',2,5,-0.1,'PT+Serif'),
  f('source-serif-4','Source Serif 4','serif','google','Fournier, refactored for screens','a',3,5,-0.3,'Source+Serif+4'),
  f('crimson-pro','Crimson Pro','serif','google','Book smell in vector form','e',3,4,-0.7,'Crimson+Pro'),
  f('eb-garamond','EB Garamond','serif','google','1592, faithfully resurrected','e',3,3,-0.9,'EB+Garamond'),
  f('bitter','Bitter','serif','google','Slab that reads sweetly','b',3,6,0.2,'Bitter'),
  f('roboto-slab','Roboto Slab','serif','google','Android grew bookish shelves','R',3,5,0.4,'Roboto+Slab'),
  f('zilla-slab','Zilla Slab','serif','google',"Mozilla's smooth-shouldered slab",'Z',4,5,0.3,'Zilla+Slab'),
  f('cardo','Cardo','serif','google','Made for classicists, literally','æ',3,4,-0.7,'Cardo'),
  f('spectral','Spectral','serif','google','Crisp editorial, faint glow','a',4,4,-0.4,'Spectral'),
  f('alike','Alike','serif','google','Upright, calm, slightly antique','k',3,4,-0.4,'Alike'),
  f('amiri','Amiri','serif','google','Naskh tradition meets Latin','ع',4,4,-0.9,'Amiri'),
  f('domine','Domine','serif','google','Newspaper body, Sunday best','D',3,6,-0.1,'Domine'),
  f('vollkorn','Vollkorn','serif','google','Wholegrain bread-and-butter serif','g',3,6,-0.5,'Vollkorn'),
  f('frank-ruhl-libre','Frank Ruhl Libre','serif','google','Hebrew classic, Latin guest','א',4,5,-0.4,'Frank+Ruhl+Libre'),
  f('gelasio','Gelasio','serif','google','Georgia, metric for metric','G',2,5,-0.2,'Gelasio'),
  f('grenze-gotisch','Grenze Gotisch','display','google','Blackletter dancing with roman','G',9,7,-0.8,'Grenze+Gotisch'),
  f('bodoni-moda','Bodoni Moda','serif','google','Razor contrast, fashion masthead','B',8,5,0.5,'Bodoni+Moda'),
  f('abril-fatface','Abril Fatface','display','google','Poster ink laid thick','A',10,8,0.2,'Abril+Fatface'),
  f('dm-serif-text','DM Serif Text','serif','google','Didone tuned for paragraphs','g',5,6,0.1,'DM+Serif+Text'),
  f('elsie','Elsie','display','google','Perfume-bottle didone flourish','E',9,6,0.0,'Elsie'),
  f('yeseva-one','Yeseva One','display','google','Voluptuous, wine-dark headlines','Y',9,7,-0.3,'Yeseva+One'),
  f('playfair','Playfair','serif','google','Playfair, now fully variable','Q',7,5,0.2,'Playfair'),
  f('old-standard-tt','Old Standard TT','serif','google','Nineteenth-century lecture notes','Q',4,4,-0.2,'Old+Standard+TT'),
  f('sorts-mill-goudy','Sorts Mill Goudy','serif','google','Goudy, gently letterpressed','y',3,4,-0.8,'Sorts+Mill+Goudy'),
  f('libre-caslon-text','Libre Caslon Text','serif','google','When in doubt, Caslon','A',3,5,-0.6,'Libre+Caslon+Text'),
  f('josefin-slab','Josefin Slab','serif','google','Typewriter meets art deco','J',6,3,0.7,'Josefin+Slab'),
  f('neuton','Neuton','serif','google','Dutch economy, tight fit','n',3,5,-0.3,'Neuton'),
  f('gentium-book-plus','Gentium Book Plus','serif','google','Linguists trust this face','ɡ',2,4,-0.7,'Gentium+Book+Plus'),
  f('alegreya','Alegreya','serif','google','Calligraphic sparkle for novels','R',3,5,-0.8,'Alegreya'),
  f('arvo','Arvo','serif','google','Boxy slab, honest grid','A',5,6,0.6,'Arvo'),
  f('literata','Literata','serif','google','Built to disappear into books','a',2,5,-0.4,'Literata'),
  f('newsreader','Newsreader','serif','google','Optically sized broadsheet voice','N',4,4,-0.3,'Newsreader'),
  f('petrona','Petrona','serif','google','Semi-serif with quiet swagger','P',4,4,-0.2,'Petrona'),
  f('faustina','Faustina','serif','google','Condensed news, open apertures','f',3,5,-0.3,'Faustina'),
  f('piazzolla','Piazzolla','serif','google','Tango phrasing in serif','z',4,5,-0.5,'Piazzolla'),
  f('hepta-slab','Hepta Slab','serif','google','Hairline to boulder, one axis','H',6,7,0.1,'Hepta+Slab'),
  f('besley','Besley','serif','google','Clarendon with British reserve','R',5,6,0.0,'Besley'),
  f('ibarra-real-nova','Ibarra Real Nova','serif','google','Spanish royal press revival','ñ',4,4,-0.4,'Ibarra+Real+Nova'),
  f('noticia-text','Noticia Text','serif','google','Slab-flavored daily news','N',2,5,0.0,'Noticia+Text'),
  f('stix-two-text','STIX Two Text','serif','google','Times, peer-reviewed and improved','∑',2,5,-0.2,'STIX+Two+Text'),
  f('unna','Unna','serif','google','Bodoni cousin, softer heart','U',5,5,0.1,'Unna'),
  f('aleo','Aleo','serif','google','Rounded slab, Lato companion','e',4,5,0.3,'Aleo'),
  f('rokkitt','Rokkitt','serif','google','Geometric slab, launch-ready','k',4,5,0.5,'Rokkitt'),
  f('kreon','Kreon','serif','google','Friendly slab, rounded corners','K',4,6,0.2,'Kreon'),
  f('crete-round','Crete Round','serif','google','Slab softened by sea air','C',4,6,-0.1,'Crete+Round'),
  f('biorhyme','BioRhyme','display','google','Extended slab, laboratory chic','B',8,6,0.6,'BioRhyme'),
  f('brygada-1918','Brygada 1918','serif','google','Polish independence, revived digitally','ż',4,4,-0.5,'Brygada+1918'),
  f('solway','Solway','serif','google','Low-contrast slab, hiking boots','S',4,6,0.1,'Solway'),
  f('ibm-plex-serif','IBM Plex Serif','serif','google','Corporate serif with soul','a',3,5,0.2,'IBM+Plex+Serif'),
  f('alegreya-sans','Alegreya Sans','sans-serif','google','Calligraphy that dropped serifs','a',3,4,-0.7,'Alegreya+Sans'),

  // ── SANS-SERIFS ────────────────────────────────────────────────────────────
  f('inter','Inter','sans-serif','google','The default of defaults','a',2,4,0.3,'Inter'),
  f('roboto','Roboto','sans-serif','google','A billion screens agree','R',2,4,0.2,'Roboto'),
  f('open-sans','Open Sans','sans-serif','google','Neutral, open, everywhere already','g',2,4,-0.2,'Open+Sans'),
  f('lato','Lato','sans-serif','google','Summer warmth, winter discipline','L',3,4,-0.1,'Lato'),
  f('poppins','Poppins','sans-serif','google','Geometric circles, Devanagari heart','प',5,5,0.3,'Poppins'),
  f('nunito','Nunito','sans-serif','google','Rounded terminals, gentle voice','n',4,5,0.2,'Nunito'),
  f('raleway','Raleway','sans-serif','google','Elegant thin, crossed w','w',5,3,0.5,'Raleway'),
  f('work-sans','Work Sans','sans-serif','google','Grotesque that clocks in','W',3,4,0.1,'Work+Sans'),
  f('josefin-sans','Josefin Sans','sans-serif','google','Deco lines, vintage geometry','J',6,3,0.8,'Josefin+Sans'),
  f('karla','Karla','sans-serif','google','Grotesque with crooked charm','K',3,4,-0.1,'Karla'),
  f('fira-sans','Fira Sans','sans-serif','google','Firefox OS, still burning','f',2,4,-0.3,'Fira+Sans'),
  f('source-sans-3','Source Sans 3','sans-serif','google',"Adobe's understated first open",'a',2,4,-0.3,'Source+Sans+3'),
  f('ubuntu','Ubuntu','sans-serif','google','Linux with rounded shoulders','u',3,4,-0.2,'Ubuntu'),
  f('rubik','Rubik','sans-serif','google','Rounded corners, sturdy cube','R',4,5,0.4,'Rubik'),
  f('overpass','Overpass','sans-serif','google','Highway Gothic goes digital','O',3,4,0.3,'Overpass'),
  f('ibm-plex-sans','IBM Plex Sans','sans-serif','google','Big Blue, human scale','a',2,4,0.1,'IBM+Plex+Sans'),
  f('red-hat-display','Red Hat Display','sans-serif','google','Open source, boardroom polish','g',6,5,0.5,'Red+Hat+Display'),
  f('jost','Jost','sans-serif','google','Futura, freed and variable','J',5,4,0.9,'Jost'),
  f('kanit','Kanit','sans-serif','google','Thai loops, Latin edges','K',5,5,0.6,'Kanit'),
  f('barlow','Barlow','sans-serif','google','California plates and freeways','B',3,4,0.4,'Barlow'),
  f('cabin','Cabin','sans-serif','google','Gill Sans in flannel','a',3,4,-0.2,'Cabin'),
  f('exo-2','Exo 2','sans-serif','google','Sci-fi that learned manners','x',6,4,0.7,'Exo+2'),
  f('oxanium','Oxanium','sans-serif','google','Beveled corners, game HUD','X',7,4,0.8,'Oxanium'),
  f('urbanist','Urbanist','sans-serif','google','Low-contrast geometric minimalism','U',4,4,0.8,'Urbanist'),
  f('manrope','Manrope','sans-serif','google','Semi-condensed startup uniform','a',3,4,0.5,'Manrope'),
  f('albert-sans','Albert Sans','sans-serif','google','Scandinavian geometry, dry wit','A',4,4,0.6,'Albert+Sans'),
  f('be-vietnam-pro','Be Vietnam Pro','sans-serif','google','Hanoi streets, crisp diacritics','ệ',3,4,0.3,'Be+Vietnam+Pro'),
  f('figtree','Figtree','sans-serif','google','Friendly geometry, ripe fruit','g',3,4,0.5,'Figtree'),
  f('hanken-grotesk','Hanken Grotesk','sans-serif','google','Warm grotesk, quiet confidence','k',3,4,-0.1,'Hanken+Grotesk'),
  f('onest','Onest','sans-serif','google','Honest by name, honest','O',3,4,0.4,'Onest'),
  f('mulish','Mulish','sans-serif','google','Minimalist workhorse, no drama','M',2,4,0.2,'Mulish'),
  f('heebo','Heebo','sans-serif','google','Roboto speaks fluent Hebrew','ה',2,4,0.2,'Heebo'),
  f('public-sans','Public Sans','sans-serif','google','Government-issue, surprisingly likeable','P',2,4,0.1,'Public+Sans'),
  f('schibsted-grotesk','Schibsted Grotesk','sans-serif','google','Nordic newsroom, sharp ink','S',5,5,0.2,'Schibsted+Grotesk'),
  f('instrument-sans','Instrument Sans','sans-serif','google','Neo-grotesque with a wink','R',4,4,0.3,'Instrument+Sans'),
  f('gabarito','Gabarito','sans-serif','google','Rounded geometry, exam-ready','G',4,5,0.6,'Gabarito'),
  f('nunito-sans','Nunito Sans','sans-serif','google','Nunito, corners un-rounded','n',2,4,0.2,'Nunito+Sans'),
  f('commissioner','Commissioner','sans-serif','google','Low-contrast humanist, flared option','C',3,4,-0.2,'Commissioner'),
  f('familjen-grotesk','Familjen Grotesk','sans-serif','google','Swedish family-run grotesk','j',4,4,0.1,'Familjen+Grotesk'),
  f('saira','Saira','sans-serif','google','Sporty, stretchy, semi-condensed','S',4,4,0.5,'Saira'),
  f('geologica','Geologica','sans-serif','google','Layered strata, variable slant','G',4,4,0.6,'Geologica'),
  f('merriweather-sans','Merriweather Sans','sans-serif','google','The serif took off serifs','M',3,5,-0.3,'Merriweather+Sans'),
  f('pt-sans','PT Sans','sans-serif','google','Public transit, Cyrillic fluent','т',2,4,-0.1,'PT+Sans'),

  // ── DISPLAY ────────────────────────────────────────────────────────────────
  f('unbounded','Unbounded','display','google','Wide-load futurist billboard','U',9,6,0.9,'Unbounded'),
  f('syne','Syne','display','google','Art-space wayfinding, off-kilter','y',8,5,0.7,'Syne'),
  f('big-shoulders','Big Shoulders','display','google','Chicago stockyards, condensed grit','B',8,5,0.5,'Big+Shoulders'),

  // ── INDIC-ORIGIN ───────────────────────────────────────────────────────────
  f('tiro-devanagari','Tiro Devanagari Hindi','serif','google','Scholarly nib, classical breath','ध',3,4,-0.8,'Tiro+Devanagari+Hindi'),
  f('yatra-one','Yatra One','display','google','Brush-painted truck-art energy','य',9,7,-0.8,'Yatra+One'),
  f('martel','Martel','serif','google','Long-form Devanagari dignity','त',3,5,-0.6,'Martel'),
  f('laila','Laila','sans-serif','google','Soft loops, open counters','ल',3,4,-0.5,'Laila'),
  f('rozha-one','Rozha One','display','google','Didone contrast meets Devanagari','र',9,7,-0.3,'Rozha+One'),
  f('shrikhand','Shrikhand','display','google','Sweet, thick, festival loud','श',10,9,-0.6,'Shrikhand'),
  f('baloo-bhai-2','Baloo Bhai 2','display','google',"Baloo's Gujarati big brother",'भ',8,9,-0.5,'Baloo+Bhai+2'),
  f('noto-serif-devanagari','Noto Serif Devanagari','serif','google','Devanagari body text, standardized','द',2,5,-0.4,'Noto+Serif+Devanagari'),
  f('rajdhani','Rajdhani','sans-serif','google','Squared-off capital city tech','ज',5,4,-0.3,'Rajdhani'),
  f('anek-devanagari','Anek Devanagari','sans-serif','google','Variable width, many voices','अ',4,4,-0.4,'Anek+Devanagari'),
  f('halant','Halant','serif','google','Banner headlines, bilingual poise','घ',4,4,-0.6,'Halant'),
  f('khand','Khand','sans-serif','google','Condensed impact, dual script','ख',6,5,-0.3,'Khand'),

  // ── MONOSPACE ──────────────────────────────────────────────────────────────
  f('jetbrains-mono','JetBrains Mono','monospace','google','Tall x-height, happy IDE','l',3,4,0.5,'JetBrains+Mono'),
  f('fira-code','Fira Code','monospace','google','Ligatures do the arrows','≠',3,4,0.1,'Fira+Code'),
  f('source-code-pro','Source Code Pro','monospace','google','Quiet terminal, honest columns','0',2,4,0.0,'Source+Code+Pro'),
  f('ibm-plex-mono','IBM Plex Mono','monospace','google','Punch cards, reissued fondly','i',4,4,0.2,'IBM+Plex+Mono'),
  f('roboto-mono','Roboto Mono','monospace','google','Android console, no surprises','m',2,4,0.3,'Roboto+Mono'),
  f('space-mono','Space Mono','monospace','google','Retro-future teletype swagger','a',7,5,0.4,'Space+Mono'),
  f('inconsolata','Inconsolata','monospace','google','Humanist code, warm pixels','t',2,4,-0.3,'Inconsolata'),
  f('courier-prime','Courier Prime','monospace','google','Screenplays, final draft only','C',5,4,-0.2,'Courier+Prime'),
  f('dm-mono','DM Mono','monospace','google','Numbers that behave','0',4,3,0.5,'DM+Mono'),
  f('martian-mono','Martian Mono','monospace','google','Wide, grumpy, off-world grotesque','M',6,6,0.3,'Martian+Mono'),

  // ── FONTSHARE ADDITIONS ────────────────────────────────────────────────────
  f('archivo','Archivo','sans-serif','fontshare','Grotesque built for archives','A',3,5,0.3),
  f('sentient','Sentient','serif','fontshare','Old-style serif, quietly aware','S',4,4,-0.6),
  f('ranade','Ranade','sans-serif','fontshare','Rounded geometry, Pune roots','R',5,5,0.6),
  f('telma','Telma','display','fontshare','Brush calligraphy gone variable','e',9,6,-0.9),
  f('supreme','Supreme','sans-serif','fontshare','Neo-grotesque, effortlessly premium','S',3,4,0.2),
] as const satisfies readonly UniverseFont[];
