export type FontCategory = "serif" | "sans-serif" | "monospace";

export type PairingContext =
  | "editorial"
  | "finance"
  | "health"
  | "technology"
  | "education"
  | "branding"
  | "multilingual";

export interface Pairing {
  font: string;
  googleFont: string;
  contexts: PairingContext[];
  rationale: string;
}

export interface BaseFont {
  id: string;
  name: string;
  category: FontCategory;
  googleFont: string;
  specimen: string;
  position: { x: number; y: number };
  pairings: Pairing[];
}

export const BASE_FONTS: BaseFont[] = [
  // ─────────────────────────────── SERIFS ───────────────────────────────
  {
    id: "instrument-serif",
    name: "Instrument Serif",
    category: "serif",
    googleFont: "Instrument+Serif",
    specimen: "Sharp & refined",
    position: { x: 14, y: 16 },
    pairings: [
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["editorial", "branding"],
        rationale:
          "High-contrast display serif against a low-contrast geometric sans. Instrument's tight apertures and sharp terminals do the personality work at headline sizes; DM Sans's generous x-height and open counters keep body copy invisible. The stroke-modulation gap is the hierarchy — no weight tricks needed.",
      },
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["technology", "branding"],
        rationale:
          "Deliberate tension: Instrument's calligraphic sharpness against Space Grotesk's mechanical quirk. Both have opinionated details (Instrument's beaked terminals, Grotesk's chopped counters), but at different scales, so they argue productively instead of competing. Best when the serif stays above 40px.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["branding", "editorial"],
        rationale:
          "Satoshi's near-monoline strokes and slightly condensed proportions recede cleanly under Instrument's flourish. X-heights land within a few percent of each other, so mixed-size lockups (serif headline, sans eyebrow) align optically without manual compensation.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["editorial", "finance"],
        rationale:
          "Switzer's neo-grotesque neutrality gives Instrument a Swiss grid to be sharp against. In dense layouts — data callouts under editorial headlines — Switzer's tabular figures and even color hold up where a warmer sans would go mushy.",
      },
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["editorial", "technology"],
        rationale:
          "Chivo's grotesque sturdiness anchors Instrument's delicacy. The pairing works because Chivo's slightly narrow set width matches Instrument's tight fit — line lengths stay rhythmically consistent when headline and standfirst sit adjacent.",
      },
    ],
  },
  {
    id: "fraunces",
    name: "Fraunces",
    category: "serif",
    googleFont: "Fraunces",
    specimen: "Wonky old soul",
    position: { x: 26, y: 12 },
    pairings: [
      {
        font: "Epilogue",
        googleFont: "Epilogue",
        contexts: ["branding", "editorial"],
        rationale:
          "Both are variable fonts built for optical-size play: Fraunces's SOFT/WONK axes at display, Epilogue's tight grotesque at text. Setting Fraunces at high optical size against Epilogue's plainspoken body creates a soft/hard contrast that reads intentional, not accidental.",
      },
      {
        font: "Plus Jakarta Sans",
        googleFont: "Plus+Jakarta+Sans",
        contexts: ["branding", "health"],
        rationale:
          "Jakarta's rounded terminals echo Fraunces's soft-serif warmth without imitating it — related temperature, different skeleton. In health contexts the pairing reads reassuring rather than clinical; Jakarta's open apertures keep small UI text legible where warmth usually costs clarity.",
      },
      {
        font: "General Sans",
        googleFont: "General+Sans",
        contexts: ["editorial", "branding"],
        rationale:
          "General Sans is crisp enough to let Fraunces be the only eccentric on the page. The weight ranges align well — General's Medium sits at the same optical weight as Fraunces Text Regular, so paragraph-level mixing doesn't create patchy color.",
      },
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["editorial", "education"],
        rationale:
          "A low-risk anchor for a high-personality serif. DM Sans's geometric skeleton and large x-height normalize the reading rhythm after Fraunces's wonky headline moment. Ideal ratio: Fraunces above 32px, DM Sans at 15–17px body.",
      },
      {
        font: "Sora",
        googleFont: "Sora",
        contexts: ["technology", "branding"],
        rationale:
          "Counterintuitive but strong: Sora's engineered coolness pushes against Fraunces's old-style warmth. The tension only works because both share slightly condensed counters — there's a structural rhyme underneath the personality clash.",
      },
      {
        font: "Baloo 2",
        googleFont: "Baloo+2",
        contexts: ["education", "multilingual"],
        rationale:
          "Fraunces at soft settings meets Baloo's heavy rounded forms — a warm display duo for bilingual children's-education contexts. Baloo carries Devanagari with the same chubby stroke logic as its Latin, so the pairing survives script alternation without a temperature drop.",
      },
    ],
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    category: "serif",
    googleFont: "Playfair+Display",
    specimen: "Editorial gravity",
    position: { x: 10, y: 30 },
    pairings: [
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["editorial", "finance"],
        rationale:
          "Classic magazine logic: Didone-adjacent display against a workhorse grotesque. Chivo's firm vertical stress mirrors Playfair's high-contrast axis, so columns of dense financial copy under a Playfair headline still feel like one type system.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["editorial", "branding"],
        rationale:
          "Switzer's restraint is the point — Playfair supplies all the contrast a page needs, and any sans with personality would double it. Switzer's slightly small x-height also flatters Playfair's tall elegant caps in mixed lockups.",
      },
      {
        font: "Outfit",
        googleFont: "Outfit",
        contexts: ["branding", "editorial"],
        rationale:
          "Fashion-editorial pairing: Playfair's hairline serifs against Montreal's studio-grade neutrality. Montreal's tight tracking at display sizes lets a small caps eyebrow sit under a Playfair masthead without visual noise.",
      },
      {
        font: "Lexend",
        googleFont: "Lexend",
        contexts: ["education", "editorial"],
        rationale:
          "Playfair's romance for headlines, Lexend's proficiency-tested letterforms for long reading. The extreme contrast delta between them is what makes hierarchy effortless — readers never confuse voice (serif) with content (sans).",
      },
      {
        font: "Plus Jakarta Sans",
        googleFont: "Plus+Jakarta+Sans",
        contexts: ["branding", "health"],
        rationale:
          "Jakarta softens Playfair's formality for consumer-facing premium work. Weight balance matters here: Jakarta Medium against Playfair Bold keeps the sans from disappearing under the serif's thick stems.",
      },
    ],
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    category: "serif",
    googleFont: "Cormorant+Garamond",
    specimen: "Candlelit elegance",
    position: { x: 22, y: 28 },
    pairings: [
      {
        font: "General Sans",
        googleFont: "General+Sans",
        contexts: ["branding", "editorial"],
        rationale:
          "Cormorant's small x-height and long extenders need a sans that won't shout over them. General Sans at Regular sits quietly; the trick is sizing — Cormorant needs to run ~15% larger than General to match apparent size, and this pairing rewards that discipline.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["editorial", "branding"],
        rationale:
          "Renaissance proportions against Swiss rationalism — five centuries of tension in one lockup. Works because both share moderate stroke contrast at text sizes; Switzer isn't so monoline that Cormorant looks frail beside it.",
      },
      {
        font: "Outfit",
        googleFont: "Outfit",
        contexts: ["branding"],
        rationale:
          "Luxury-brand pairing: Cormorant supplies heritage, Montreal supplies now. Montreal's generous apertures keep all-caps navigation legible at 11px, which frees Cormorant to be purely a display voice.",
      },
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["editorial", "education"],
        rationale:
          "DM Sans's big x-height compensates for Cormorant's small one — the pairing needs deliberate optical-size matching, and that visible craft is the appeal. Use Cormorant only above 28px; it was drawn from display-size Garamond sources and thins out below that.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["branding", "editorial"],
        rationale:
          "Satoshi's mechanical-humanist hybrid gives Cormorant a modern counterweight without coldness. Their italic angles nearly match (~11°), so mixed-style pull quotes hold a consistent slant rhythm.",
      },
    ],
  },
  {
    id: "dm-serif-display",
    name: "DM Serif Display",
    category: "serif",
    googleFont: "DM+Serif+Display",
    specimen: "Didone, democratized",
    position: { x: 34, y: 22 },
    pairings: [
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["branding", "editorial"],
        rationale:
          "Drawn as siblings by the same foundry on shared vertical metrics — x-heights and cap heights align by design, not by luck. The safest superfamily pairing in the set, which makes it the right default for systems handed to non-designers.",
      },
      {
        font: "Lexend",
        googleFont: "Lexend",
        contexts: ["education", "health"],
        rationale:
          "DM Serif's high contrast delivers emotional weight at display; Lexend's wide, even strokes deliver measured reading below it. The pairing's value is the legibility floor — patient-facing or learner-facing copy never inherits the display font's fragility.",
      },
      {
        font: "Plus Jakarta Sans",
        googleFont: "Plus+Jakarta+Sans",
        contexts: ["branding", "technology"],
        rationale:
          "Jakarta's subtle geometry keeps a product UI feeling contemporary while DM Serif carries marketing moments. Their shared largish x-height means the serif-to-sans handoff between hero and interface doesn't jolt.",
      },
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["editorial", "finance"],
        rationale:
          "Didone display over grotesque text is the oldest newspaper formula there is; this is its webfont translation. Chivo's firmness holds dense numeric tables that DM Serif headlines can sit above without the page splitting into two languages.",
      },
      {
        font: "Epilogue",
        googleFont: "Epilogue",
        contexts: ["branding", "editorial"],
        rationale:
          "Epilogue's variable weight axis lets you tune the sans until its stem weight optically matches DM Serif's thin strokes rather than its thick ones — the refined move that keeps the pairing airy instead of heavy.",
      },
    ],
  },
  {
    id: "libre-baskerville",
    name: "Libre Baskerville",
    category: "serif",
    googleFont: "Libre+Baskerville",
    specimen: "Screen-tuned classic",
    position: { x: 16, y: 42 },
    pairings: [
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["editorial", "finance"],
        rationale:
          "Libre Baskerville was re-drawn with a taller x-height and looser fit specifically for screens, which puts it unusually close to grotesque proportions. Chivo meets it there — the two share body-text density, so long-form pages with mixed serif/sans sections keep even color.",
      },
      {
        font: "Lexend",
        googleFont: "Lexend",
        contexts: ["education", "health"],
        rationale:
          "Both faces are legibility-first designs from different traditions. Baskerville's transitional stress aids word-shape recognition in long passages; Lexend handles UI and captions where serifs clutter. A pairing chosen for reading science, not vibes.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["editorial", "technology"],
        rationale:
          "Transitional serif against neo-grotesque: enough historical distance to create hierarchy, enough shared rationality to feel like one system. Switzer's uniform stroke weight makes Baskerville's gentle modulation register as texture rather than noise.",
      },
      {
        font: "Sora",
        googleFont: "Sora",
        contexts: ["technology", "editorial"],
        rationale:
          "A deliberate era clash — 18th-century book face, 21st-century fintech sans. It works at wide size deltas only: Sora for compact labels and data, Baskerville for reading measure. At similar sizes they fight; the spec must enforce the gap.",
      },
      {
        font: "General Sans",
        googleFont: "General+Sans",
        contexts: ["editorial", "branding"],
        rationale:
          "General Sans's slightly squared curves give Baskerville's roundness a modern frame. Weight mapping is clean: General Medium ≈ Baskerville Regular in optical weight, so cross-family emphasis rules stay simple.",
      },
    ],
  },

  // ────────────────────────────── SANS-SERIFS ──────────────────────────────
  {
    id: "dm-sans",
    name: "DM Sans",
    category: "sans-serif",
    googleFont: "DM+Sans",
    specimen: "Quiet workhorse",
    position: { x: 48, y: 18 },
    pairings: [
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["editorial", "branding"],
        rationale:
          "The reverse of the set's signature pairing: DM Sans as the system voice, Instrument as the accent. DM's low-contrast geometry means Instrument's sharp modulation reads as an event, and the near-matched x-heights keep inline serif emphasis from bouncing the baseline.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "DM Sans is neutral enough to host Fraunces at its wonkiest settings. Because DM has almost no stroke contrast, Fraunces's optical-size axis can swing from soft to sharp across breakpoints without the body font needing to respond.",
      },
      {
        font: "DM Serif Display",
        googleFont: "DM+Serif+Display",
        contexts: ["branding", "editorial"],
        rationale:
          "Same-foundry siblings on shared metrics — cap heights, x-heights, and vertical rhythm align out of the box. The pairing to reach for when a design system must survive many hands.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["editorial", "branding"],
        rationale:
          "Maximum x-height contrast in the set: DM's tall, open body against Cormorant's petite one. Handled with deliberate size compensation (~115% on Cormorant) it produces an elegant, high-craft texture; unhandled, it fails — which is exactly why it demonstrates skill.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "editorial"],
        rationale:
          "For bilingual English–Hindi editorial: Eczar's Devanagari headlines carry real ink presence, and DM Sans's even monoline body doesn't compete with the knotted density of Devanagari conjuncts. Set DM Sans slightly looser to match Devanagari's naturally wider rhythm.",
      },
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["technology"],
        rationale:
          "Sans-on-sans pairing that works through personality delta rather than category contrast: DM stays invisible while Space Grotesk's cropped terminals mark interactive or code-adjacent moments. Reserve Grotesk for labels and numerals to keep the roles legible.",
      },
    ],
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    category: "sans-serif",
    googleFont: "Space+Grotesk",
    specimen: "Techno-optimist",
    position: { x: 60, y: 12 },
    pairings: [
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["technology", "branding"],
        rationale:
          "Two sharp-edged personalities in deliberate tension — Grotesk's mechanical crops against Instrument's calligraphic beaks. It holds together because both are tightly fitted and slightly condensed; the shared density reads as intent.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "Warm-wonky serif against cool-quirky sans. The pairing's risk is doubled eccentricity, so the spec matters: Fraunces at low WONK for text, full personality only above 48px, Grotesk confined to UI chrome and figures.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial", "technology"],
        rationale:
          "Grotesk descends from Space Mono's skeleton, giving it a latent monospace rhythm that flatters Baskerville's bookish measure — terminal-meets-library. Strong for developer-facing editorial where prose and code references interleave.",
      },
      {
        font: "Mukta",
        googleFont: "Mukta",
        contexts: ["multilingual", "technology"],
        rationale:
          "For bilingual tech UI: Mukta's Devanagari is drawn monoline at nearly the same stroke weight as Grotesk's Latin, so alternating scripts mid-interface hold consistent color. Match at body size by Devanagari loop height rather than Latin x-height — Mukta needs ~5% up-sizing.",
      },
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["technology", "finance"],
        rationale:
          "Grotesque-on-grotesque, differentiated by temperament: Chivo plays it straight in dense data surfaces while Grotesk carries brand moments. Their nearly identical x-heights make the handoff between dashboard and marketing seamless.",
      },
    ],
  },
  {
    id: "plus-jakarta-sans",
    name: "Plus Jakarta Sans",
    category: "sans-serif",
    googleFont: "Plus+Jakarta+Sans",
    specimen: "Friendly precision",
    position: { x: 54, y: 32 },
    pairings: [
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "health"],
        rationale:
          "Shared warmth, different structures: Jakarta's rounded terminals rhyme with Fraunces's soft serifs without copying them. For health brands this lands as approachable-but-credentialed — the serif supplies authority the rounded sans alone lacks.",
      },
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["branding", "editorial"],
        rationale:
          "Jakarta Medium holds its own against Playfair Bold's heavy stems — weight balance is the whole game here, since Jakarta Regular disappears under a Didone. Premium-consumer pairing when tuned, muddy when not.",
      },
      {
        font: "DM Serif Display",
        googleFont: "DM+Serif+Display",
        contexts: ["branding", "technology"],
        rationale:
          "Both carry a hint of geometry under humanist skin, so the pairing feels like one brand speaking in two registers. Jakarta's large x-height matches DM Serif's closely enough for tight hero lockups.",
      },
      {
        font: "Hind",
        googleFont: "Hind",
        contexts: ["multilingual", "health"],
        rationale:
          "Bilingual product-UI pairing: Hind's humanist Devanagari shares Jakarta's open apertures and even stroke weight, so mixed-script form labels and buttons keep one voice. Hind's Latin can even substitute at small sizes to reduce font payload.",
      },
      {
        font: "Clash Display",
        googleFont: "Clash+Display",
        contexts: ["branding", "technology"],
        rationale:
          "Clash's blunt, tight-set display forms against Jakarta's polite body — hierarchy through attitude delta rather than category. Confine Clash above 40px; its closed apertures collapse at text sizes and Jakarta must own everything below.",
      },
    ],
  },
  {
    id: "epilogue",
    name: "Epilogue",
    category: "sans-serif",
    googleFont: "Epilogue",
    specimen: "Variable ambition",
    position: { x: 68, y: 24 },
    pairings: [
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["editorial", "branding"],
        rationale:
          "Two variable-first designs: Fraunces flexes optical size and wonk, Epilogue flexes weight and width. A system built on this pair can tune contrast per breakpoint in CSS rather than swapping fonts — the pairing is an engineering argument as much as an aesthetic one.",
      },
      {
        font: "DM Serif Display",
        googleFont: "DM+Serif+Display",
        contexts: ["branding", "editorial"],
        rationale:
          "Epilogue's weight axis can be dialed until its stems optically match DM Serif's hairlines, keeping display lockups light. At body sizes Epilogue's tall x-height carries dense copy the display serif never touches.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["editorial", "branding"],
        rationale:
          "Extreme contrast pairing — Epilogue's tight modern grotesque against Cormorant's airy Renaissance forms. The x-height gulf demands size compensation, but the payoff is a page with genuine typographic depth of field.",
      },
      {
        font: "Clash Display",
        googleFont: "Clash+Display",
        contexts: ["branding", "technology"],
        rationale:
          "Same Indian-foundry lineage (ITF/Fontshare orbit), shared tight fit and squared curves — Clash reads as Epilogue's louder sibling. Use Clash for display, Epilogue variable for everything else; the family resemblance keeps the system coherent.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Eczar's high-impact Devanagari display over Epilogue's neutral Latin body suits bilingual long-form. Eczar's weight range (Regular→Black) maps onto Epilogue's variable axis, so cross-script emphasis levels can be matched by optical weight instead of guesswork.",
      },
    ],
  },
  {
    id: "sora",
    name: "Sora",
    category: "sans-serif",
    googleFont: "Sora",
    specimen: "Orbital clarity",
    position: { x: 78, y: 14 },
    pairings: [
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["technology", "editorial"],
        rationale:
          "Fintech sans meets book serif — the pairing signals 'engineered but literate.' Sora's wide, even strokes handle numerals and labels; Baskerville handles anything a human reads for more than ten seconds. Enforce the role split by size.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["branding", "technology"],
        rationale:
          "Sora's engineered coolness makes Instrument's sharpness feel precise rather than decorative. Both are tightly drawn with firm terminals, so the pairing keeps a hard edge across categories — good for brands selling exactness.",
      },
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["technology"],
        rationale:
          "Two tech-coded sans faces split by rigidity: Sora is stricter, Grotesk is quirkier. Works as a system where Sora owns data density (its tabular figures are excellent) and Grotesk owns voice. Similar x-heights prevent seams.",
      },
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["finance", "editorial"],
        rationale:
          "Old-money serif over new-money sans — a wealth-tech pairing. Playfair's vertical-stress elegance headlines; Sora's unmodulated strokes keep charts and tickers steady at 11–13px where a modulated face would flicker.",
      },
      {
        font: "Noto Sans",
        googleFont: "Noto+Sans",
        contexts: ["multilingual", "technology"],
        rationale:
          "For products localizing beyond Latin: Sora fronts the brand, Noto Sans provides the script-complete fallback with a matched x-height so the swap is nearly invisible. Pin both to the same vertical metrics to stop layout shift across locales.",
      },
    ],
  },
  {
    id: "lexend",
    name: "Lexend",
    category: "sans-serif",
    googleFont: "Lexend",
    specimen: "Reading, unblocked",
    position: { x: 86, y: 26 },
    pairings: [
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["education", "editorial"],
        rationale:
          "Lexend's expanded spacing and low-contrast strokes were tuned for reading fluency; Playfair brings the gravitas a curriculum brand needs. The extreme structural distance means neither ever gets mistaken for the other's job.",
      },
      {
        font: "DM Serif Display",
        googleFont: "DM+Serif+Display",
        contexts: ["health", "education"],
        rationale:
          "Display serif for emotional headlines, evidence-driven sans for everything a patient or learner must actually parse. Lexend's generous default tracking also buys legibility on low-quality projector and clinic-kiosk screens.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["education", "editorial"],
        rationale:
          "Two legibility-first designs a century of theory apart. Baskerville for immersive passages, Lexend for instructions, captions, and UI — a split based on reading mode (deep vs. scanning) rather than decoration.",
      },
      {
        font: "Baloo 2",
        googleFont: "Baloo+2",
        contexts: ["education", "multilingual"],
        rationale:
          "Early-learning bilingual pairing: Baloo's rounded display warmth for headings, Lexend's fluency-tuned body for exercises. Baloo's Devanagari keeps identical roundness across scripts, so Hindi-medium and English-medium worksheets share one visual voice.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["editorial", "branding"],
        rationale:
          "Fraunces supplies the personality Lexend deliberately omits. Because Lexend's letterforms are wide and airy, Fraunces should run snug and large — the density inversion (loose body, tight display) is what makes the page feel composed.",
      },
    ],
  },
  {
    id: "bricolage-grotesque",
    name: "Bricolage Grotesque",
    category: "sans-serif",
    googleFont: "Bricolage+Grotesque",
    specimen: "Mischief in grids",
    position: { x: 44, y: 44 },
    pairings: [
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["editorial", "branding"],
        rationale:
          "Bricolage's irreverent grotesque details against Cormorant's courtly elegance — a high/low collision that only works because Bricolage's optical-size axis lets its text cut calm down while display sizes stay unruly.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial"],
        rationale:
          "Baskerville plays the straight man. Its screen-tuned even color gives Bricolage's odd notches and flared joins something stable to deviate from; without a sober body face, Bricolage's quirks read as errors.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["branding", "technology"],
        rationale:
          "Two grotesques split by temperament — Satoshi neutral, Bricolage mischievous. Their x-heights and set widths are close enough that swapping between them per-section keeps the grid identical while the mood shifts. A useful trick for portfolio sites, frankly.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["editorial", "branding"],
        rationale:
          "Both faces have sharp, opinionated terminals; pairing them is controlled excess. Restrict each to a distinct size band (Instrument >40px, Bricolage 14–20px) so the personalities alternate rather than overlap.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Two loud faces from craft-driven foundries. Eczar's spiky Devanagari display and Bricolage's flared Latin share an appetite for ink; matched at optical weight (Eczar SemiBold ≈ Bricolage Bold) they give bilingual zines a single rowdy voice instead of two competing ones.",
      },
    ],
  },
  {
    id: "satoshi",
    name: "Satoshi",
    category: "sans-serif",
    googleFont: "Satoshi",
    specimen: "Neutral, not boring",
    position: { x: 58, y: 46 },
    pairings: [
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["branding", "editorial"],
        rationale:
          "Satoshi's mix of grotesque bones and geometric finish recedes exactly as much as Instrument's sharpness demands. Near-matched x-heights make inline serif emphasis sit flush — the detail that separates a system from a mood board.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["branding"],
        rationale:
          "Modern-neutral against Renaissance-delicate. Satoshi's monoline evenness means Cormorant's fine hairlines are the only modulation on the page, which is what keeps a luxury layout from feeling busy.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "Satoshi absorbs UI, navigation, and body duties so Fraunces can operate purely as a display instrument. Weight mapping is straightforward — Satoshi Medium ≈ Fraunces Text Regular — keeping cross-family hierarchy rules teachable.",
      },
      {
        font: "Bricolage Grotesque",
        googleFont: "Bricolage+Grotesque",
        contexts: ["branding", "technology"],
        rationale:
          "The same-grid/different-mood pairing: closely matched proportions, divergent personalities. Systems can promote Bricolage for campaign moments and fall back to Satoshi for product without re-flowing a single layout.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "branding"],
        rationale:
          "Bilingual brand pairing: Eczar's assertive Devanagari headline over Satoshi's cool Latin body. The contrast is the strategy — the Indic script carries the identity's heat while Satoshi keeps interface temperature low. Up-size Satoshi ~4% next to Devanagari body text to equalize apparent size.",
      },
    ],
  },
  {
    id: "cabinet-grotesk",
    name: "Cabinet Grotesk",
    category: "sans-serif",
    googleFont: "Cabinet+Grotesk",
    specimen: "Compact swagger",
    position: { x: 70, y: 38 },
    pairings: [
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "Cabinet's tight apertures and confident curves meet Fraunces's soft wonk — both have swagger, but Cabinet's is structural and Fraunces's is calligraphic, so they occupy different channels. Keep Cabinet in the Bold–Black range where its personality lives.",
      },
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["editorial", "branding"],
        rationale:
          "Cabinet Black subheads under Playfair headlines create a two-tier display system with real tonal range; a plainer sans then handles body. Cabinet's compact set width lets dense kickers sit under Playfair's wide caps without overhang.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial"],
        rationale:
          "Cabinet supplies the attitude Baskerville politely lacks; Baskerville supplies the reading endurance Cabinet's closed counters can't sustain. Role separation by size band keeps the truce.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["branding"],
        rationale:
          "Heavy grotesque against hairline old-style — the widest weight-contrast pairing in the set. It works as a two-voice display system (Cabinet Black + Cormorant Light) where the stroke-weight gap itself is the visual identity.",
      },
      {
        font: "Hind",
        googleFont: "Hind",
        contexts: ["multilingual", "branding"],
        rationale:
          "Bilingual campaign pairing: Cabinet's punchy Latin display with Hind's clean Devanagari body. Hind's even, open strokes hold up at caption sizes where Cabinet's tight counters would clog — and its stroke weight sits close to Cabinet Regular, keeping mixed-script color consistent.",
      },
    ],
  },
  {
    id: "general-sans",
    name: "General Sans",
    category: "sans-serif",
    googleFont: "General+Sans",
    specimen: "Crisp diplomat",
    position: { x: 82, y: 42 },
    pairings: [
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["branding", "editorial"],
        rationale:
          "General's slightly squared, even-tempered forms defer to Cormorant's delicacy without going limp. The pairing rewards optical-size discipline: Cormorant ~115% of General's size at equivalent hierarchy levels.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "One eccentric per page: General's crispness lets Fraunces's wonk register as the design's single flourish. Their optical weights align across the Regular–Medium range, so paragraph-level mixing keeps even color.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial", "finance"],
        rationale:
          "Transitional serif for reading, composed sans for structure. General's tabular figures and steady rhythm suit annual-report density; Baskerville lends the prose sections institutional warmth without nostalgia.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Eczar display over General Sans body for bilingual publications: General's neutrality gives Devanagari's dense conjunct clusters breathing room, and its open counters echo Eczar's generous knot spacing at text sizes. Match by apparent height, not point size.",
      },
      {
        font: "Clash Display",
        googleFont: "Clash+Display",
        contexts: ["branding", "technology"],
        rationale:
          "Same-foundry pairing (Fontshare): Clash shouts, General explains. Shared drawing DNA — squared curves, tight fit — makes the loud/quiet split feel like one voice changing volume rather than two fonts negotiating.",
      },
    ],
  },
  {
    id: "switzer",
    name: "Switzer",
    category: "sans-serif",
    googleFont: "Switzer",
    specimen: "Swiss, softened",
    position: { x: 90, y: 54 },
    pairings: [
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["editorial", "branding"],
        rationale:
          "Neo-grotesque restraint under Didone drama — the modernist magazine formula. Switzer's uniform strokes and modest x-height frame Playfair's high contrast instead of competing with it.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["branding", "editorial"],
        rationale:
          "Swiss rationalism meets Renaissance humanism; the pairing's five-century span is its charm. Switzer's moderate weight keeps Cormorant's hairlines from looking anemic by comparison — a genuinely forgiving grotesque for delicate serifs.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["finance", "editorial"],
        rationale:
          "For dense financial editorial: Switzer's tabular figures and even color carry data blocks, Instrument's sharpness carries opinion. The temperature gap (cool grid, hot headline) maps cleanly onto the content's fact/analysis split.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial", "technology"],
        rationale:
          "Both faces prioritize evenness over flourish, so the pairing reads as one rational system across serif and sans. Ideal for documentation-heavy products where long prose and UI share screens.",
      },
      {
        font: "Hind",
        googleFont: "Hind",
        contexts: ["multilingual", "technology"],
        rationale:
          "Bilingual interface pairing: Hind's Devanagari was engineered for UI with the same monoline discipline as Switzer's Latin. Stroke weights align within a hair at Regular, so mixed-script menus and labels hold a single line color — the hardest thing to get right in dual-script UI.",
      },
    ],
  },
  {
    id: "outfit",
    name: "Outfit",
    category: "sans-serif",
    googleFont: "Outfit",
    specimen: "Clean geometry",
    position: { x: 66, y: 54 },
    pairings: [
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["branding", "editorial"],
        rationale:
          "Fashion-studio pairing: Montreal's tight, neutral display setting against Playfair's romantic contrast. Montreal tracks beautifully in all-caps at small sizes, freeing Playfair from every job except being looked at.",
      },
      {
        font: "Cormorant Garamond",
        googleFont: "Cormorant+Garamond",
        contexts: ["branding"],
        rationale:
          "Luxury minimalism: Montreal's silence amplifies Cormorant's whisper. Both are drawn light by default, so the page holds an unusually airy overall color — reserve real weight for one element only or the effect collapses.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["branding", "editorial"],
        rationale:
          "Montreal's studio-grade neutrality is the rare sans that makes Fraunces look more expensive rather than more eccentric. Keep Fraunces's SOFT axis high; sharp settings fight Montreal's smooth curves.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["branding", "editorial"],
        rationale:
          "Two tightly fitted faces with opposite contrast logic — Montreal monoline, Instrument modulated. The shared compactness keeps lockups dense and poster-like; the contrast split keeps them legible.",
      },
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["technology", "branding"],
        rationale:
          "Neutral-vs-quirky grotesque system: Montreal for identity surfaces, Grotesk for product moments needing personality. Close x-heights and both slightly condensed — the swap costs no layout reflow.",
      },
    ],
  },
  {
    id: "clash-display",
    name: "Clash Display",
    category: "sans-serif",
    googleFont: "Clash+Display",
    specimen: "Loud on purpose",
    position: { x: 78, y: 60 },
    pairings: [
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["branding", "technology"],
        rationale:
          "The canonical Fontshare stack: Clash's blunt display weight over Satoshi's neutral engine. Shared foundry proportions mean cap heights align in hero lockups without manual nudging — loud headline, quiet everything else.",
      },
      {
        font: "General Sans",
        googleFont: "General+Sans",
        contexts: ["branding"],
        rationale:
          "Sibling pairing with a wider temperament gap than Clash/Satoshi — General is crisper and more formal, which suits corporate brands wanting one loud moment. Same drawing DNA keeps it coherent.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["branding", "editorial"],
        rationale:
          "Clash's semi-condensed shout against Switzer's Swiss calm. The x-height difference is real (Clash runs taller), so match by cap height in lockups and let body text live entirely in Switzer below 20px.",
      },
      {
        font: "Epilogue",
        googleFont: "Epilogue",
        contexts: ["technology", "branding"],
        rationale:
          "Epilogue's variable axes flex around Clash's fixed attitude — tune Epilogue's weight until subheads bridge the gap between Clash Black heroes and Regular body. A three-tier hierarchy from just two families.",
      },
      {
        font: "Mukta",
        googleFont: "Mukta",
        contexts: ["multilingual", "branding"],
        rationale:
          "Bilingual campaign pairing: Clash headlines in Latin, Mukta carrying Devanagari at matched optical weight (Mukta ExtraBold ≈ Clash SemiBold in apparent blackness). Mukta's clean loops keep Hindi headlines punchy without the clotting heavier Devanagari fonts suffer at display sizes.",
      },
    ],
  },
  {
    id: "chivo",
    name: "Chivo",
    category: "sans-serif",
    googleFont: "Chivo",
    specimen: "Newsroom steel",
    position: { x: 52, y: 60 },
    pairings: [
      {
        font: "Playfair Display",
        googleFont: "Playfair+Display",
        contexts: ["editorial", "finance"],
        rationale:
          "The broadsheet formula webified: Didone display, grotesque text. Chivo's firm vertical stress echoes Playfair's axis, so the page reads as one editorial system even at Bloomberg-terminal density.",
      },
      {
        font: "Libre Baskerville",
        googleFont: "Libre+Baskerville",
        contexts: ["editorial"],
        rationale:
          "Screen-tuned serif and no-nonsense grotesque with nearly matched text density — long articles can alternate serif prose and sans infographics without a color jump between sections.",
      },
      {
        font: "DM Serif Display",
        googleFont: "DM+Serif+Display",
        contexts: ["editorial", "finance"],
        rationale:
          "DM Serif brings Didone drama at lower licensing friction than custom news faces; Chivo holds tables, tickers, and captions steady. Chivo's true tabular figures are the load-bearing detail for finance work.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["editorial", "technology"],
        rationale:
          "Both slightly narrow and tightly fitted, giving mixed headline/standfirst stacks a consistent line rhythm. Instrument supplies the edge, Chivo the endurance.",
      },
      {
        font: "Hind",
        googleFont: "Hind",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Bilingual news pairing: Chivo's Latin and Hind's Devanagari share monoline construction and open apertures, holding even color when headlines alternate scripts edition to edition. Hind needs ~1.06× size at body to match Chivo's apparent height — bake it into the type scale.",
      },
    ],
  },

  // ─────────────────────── INDIC-ORIGIN / DUAL-SCRIPT ───────────────────────
  {
    id: "mukta",
    name: "Mukta",
    category: "sans-serif",
    googleFont: "Mukta",
    specimen: "Open borders",
    position: { x: 14, y: 66 },
    pairings: [
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["multilingual", "technology"],
        rationale:
          "Mukta's monoline Devanagari matches Grotesk's stroke weight almost exactly at Regular, so bilingual tech UI keeps uniform line color when scripts alternate mid-layout. Mukta's seven weights let you shadow Grotesk's hierarchy step for step.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["multilingual", "branding"],
        rationale:
          "Both are quiet, evenly drawn workhorses — the rare cross-script pairing where neither font is 'the exotic one.' Match by Devanagari loop height to Latin x-height (~1.05× on Mukta) and mixed paragraphs hold a single rhythm.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["multilingual", "finance"],
        rationale:
          "For bilingual financial interfaces: Switzer's tabular Latin figures beside Mukta's Devanagari numerals at matched optical weight. Mukta's open knots stay legible at the 11px sizes dense dashboards demand — many Devanagari fonts don't.",
      },
      {
        font: "Clash Display",
        googleFont: "Clash+Display",
        contexts: ["multilingual", "branding"],
        rationale:
          "Campaign pairing: Clash's Latin shout answered by Mukta ExtraBold's Devanagari. Weight-matching across scripts is the craft here — apparent blackness, not nominal weight, since Devanagari's horizontal shirorekha adds visual density Latin lacks.",
      },
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["multilingual", "education"],
        rationale:
          "Bilingual learning-material pairing: both faces favor open counters and generous apertures, the features that matter most for early readers in either script. Their x-height/loop-height ratio is close enough that ruled worksheets align across languages.",
      },
    ],
  },
  {
    id: "hind",
    name: "Hind",
    category: "sans-serif",
    googleFont: "Hind",
    specimen: "Civic clarity",
    position: { x: 24, y: 76 },
    pairings: [
      {
        font: "Plus Jakarta Sans",
        googleFont: "Plus+Jakarta+Sans",
        contexts: ["multilingual", "health"],
        rationale:
          "Hind was designed for Indian government UI — its humanist Devanagari shares Jakarta's open apertures and even stroke weight, so bilingual health-service forms keep one voice across scripts. At small sizes Hind's own Latin can substitute for Jakarta to cut font payload.",
      },
      {
        font: "Switzer",
        googleFont: "Switzer",
        contexts: ["multilingual", "technology"],
        rationale:
          "Stroke weights align within a hair at Regular, which solves the hardest dual-script problem: consistent line color in mixed menus and labels. Hind's flat, UI-oriented Devanagari matches Switzer's grid temperament exactly.",
      },
      {
        font: "Chivo",
        googleFont: "Chivo",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Bilingual news system: both monoline and open-apertured, holding even texture when Devanagari and Latin headlines alternate. Bake Hind's ~1.06× body up-sizing into the scale rather than eyeballing per layout.",
      },
      {
        font: "Lexend",
        googleFont: "Lexend",
        contexts: ["multilingual", "education"],
        rationale:
          "For bilingual ed-tech: Lexend's fluency-tuned spacing for English passages, Hind's clear conjunct handling for Hindi. Both prioritize letterform disambiguation over style, so the pairing's logic is pedagogical, not aesthetic.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["multilingual", "branding"],
        rationale:
          "Warm Latin serif display over Hind's cool Devanagari-capable body — for bilingual brands that lead in English but serve in Hindi. The temperature gap is deliberate; Hind's neutrality prevents the Devanagari from reading as an afterthought styled differently.",
      },
    ],
  },
  {
    id: "baloo-2",
    name: "Baloo 2",
    category: "sans-serif",
    googleFont: "Baloo+2",
    specimen: "Round & bilingual",
    position: { x: 34, y: 68 },
    pairings: [
      {
        font: "Lexend",
        googleFont: "Lexend",
        contexts: ["multilingual", "education"],
        rationale:
          "Baloo's heavy rounded display for headings, Lexend's fluency-tested body for exercises. Baloo carries identical roundness into Devanagari — stroke terminals, counters, even the shirorekha softens — so bilingual worksheets keep one personality across scripts.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["multilingual", "branding"],
        rationale:
          "Two warm faces, different constructions: Fraunces's soft serifs and Baloo's balloon strokes rhyme in temperature without duplicating structure. For bilingual kids' brands, Fraunces takes English display and Baloo owns everything Devanagari plus playful Latin accents.",
      },
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["multilingual", "education"],
        rationale:
          "DM Sans's geometric calm keeps Baloo's exuberance from tiring the reader — display charm, body discipline. Both have large x-heights (and Baloo's Devanagari loop height matches proportionally), so scale ratios transfer across scripts cleanly.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["multilingual", "branding"],
        rationale:
          "Rounded-heavy display against neutral body gives bilingual consumer apps a friendly face without a childish interface. Match Baloo SemiBold to Satoshi Bold for cross-script emphasis parity — Baloo runs visually heavier per nominal weight.",
      },
      {
        font: "Bricolage Grotesque",
        googleFont: "Bricolage+Grotesque",
        contexts: ["multilingual", "branding"],
        rationale:
          "The set's most playful pairing: Bricolage's flared mischief and Baloo's rounded bounce. It needs strict role separation — Bricolage for Latin display only, Baloo for Devanagari display and all rounded moments — or the page turns to soup. High risk, distinctive reward.",
      },
    ],
  },
  {
    id: "eczar",
    name: "Eczar",
    category: "serif",
    googleFont: "Eczar",
    specimen: "Devanagari thunder",
    position: { x: 12, y: 84 },
    pairings: [
      {
        font: "General Sans",
        googleFont: "General+Sans",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Eczar's high-impact Devanagari display over General's neutral Latin body. General's open counters echo Eczar's generous knot spacing, and its restraint gives dense conjunct clusters room to read. Match by apparent height — Devanagari's frame sits differently than Latin's x-height.",
      },
      {
        font: "Satoshi",
        googleFont: "Satoshi",
        contexts: ["multilingual", "branding"],
        rationale:
          "The heat/cool split as brand strategy: Eczar's spiky, ink-heavy headlines carry the identity's energy while Satoshi keeps interface temperature low. Eczar's five weights map onto Satoshi's range for consistent cross-script emphasis.",
      },
      {
        font: "DM Sans",
        googleFont: "DM+Sans",
        contexts: ["multilingual", "editorial"],
        rationale:
          "For bilingual long-form: DM Sans's even monoline body doesn't compete with Devanagari's natural density, and setting it slightly looser matches the wider rhythm Devanagari text establishes. Eczar Regular also handles Hindi body text credibly — a two-font full system.",
      },
      {
        font: "Epilogue",
        googleFont: "Epilogue",
        contexts: ["multilingual", "technology"],
        rationale:
          "Epilogue's variable weight axis is the practical win: tune the Latin until its optical weight matches whichever Eczar weight the Devanagari demands, per breakpoint, in CSS. Cross-script weight matching as a tunable parameter rather than a fixed compromise.",
      },
      {
        font: "Mukta",
        googleFont: "Mukta",
        contexts: ["multilingual", "editorial"],
        rationale:
          "An all-Indic-foundry system: Eczar's expressive serif Devanagari for display, Mukta's monoline sans Devanagari for body — the serif/sans convention translated fully into Devanagari, which almost no pairing in common use bothers to do. Both cover Latin, so the system is complete in two families.",
      },
    ],
  },
  {
    id: "noto-sans",
    name: "Noto Sans",
    category: "sans-serif",
    googleFont: "Noto+Sans",
    specimen: "Every tongue",
    position: { x: 26, y: 88 },
    pairings: [
      {
        font: "Sora",
        googleFont: "Sora",
        contexts: ["multilingual", "technology"],
        rationale:
          "The localization-infrastructure pairing: Sora fronts the brand in Latin, Noto provides script-complete coverage with a closely matched x-height so fallback swaps are nearly invisible. Pin shared vertical metrics to kill cross-locale layout shift.",
      },
      {
        font: "Instrument Serif",
        googleFont: "Instrument+Serif",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Sharp Latin serif display over Noto's deliberately unopinionated multi-script body. Noto's neutrality is the feature — it renders Devanagari, Bengali, and Tamil at consistent weight and density, so one display voice can sit above any localized edition.",
      },
      {
        font: "Fraunces",
        googleFont: "Fraunces",
        contexts: ["multilingual", "branding"],
        rationale:
          "Personality-forward display, coverage-forward body. Fraunces's warmth prevents the Noto-based system from feeling like an OS default; Noto's harmonized per-script metrics keep that warmth from breaking when the interface speaks three languages on one screen.",
      },
      {
        font: "Eczar",
        googleFont: "Eczar",
        contexts: ["multilingual", "editorial"],
        rationale:
          "Expressive Devanagari display over dependable multi-script body — the inverse of the usual colonial-order pairing where Latin gets the personality font. Eczar's display heat against Noto's even body density gives Hindi-first publications a real typographic hierarchy.",
      },
      {
        font: "Space Grotesk",
        googleFont: "Space+Grotesk",
        contexts: ["multilingual", "technology"],
        rationale:
          "Grotesk marks brand and interactive moments; Noto carries every script users actually type in. Their stroke weights sit close at Regular, so the personality/coverage seam stays subtle even mid-sentence in mixed-script strings.",
      },
    ],
  },
];

// ─── Font loading sources ──────────────────────────────────────────────────
// Google Fonts: loaded via fonts.googleapis.com/css2?family=...
// Fontshare:    loaded via api.fontshare.com/v2/css?f[]=...
export type FontSource = "google" | "fontshare";

export const FONT_LOADING_MAP: Record<string, { source: FontSource; id: string }> = {
  // Google Fonts
  "Instrument Serif":    { source: "google",    id: "Instrument+Serif" },
  "Fraunces":            { source: "google",    id: "Fraunces" },
  "Playfair Display":    { source: "google",    id: "Playfair+Display" },
  "Cormorant Garamond":  { source: "google",    id: "Cormorant+Garamond" },
  "DM Serif Display":    { source: "google",    id: "DM+Serif+Display" },
  "Libre Baskerville":   { source: "google",    id: "Libre+Baskerville" },
  "DM Sans":             { source: "google",    id: "DM+Sans" },
  "Space Grotesk":       { source: "google",    id: "Space+Grotesk" },
  "Plus Jakarta Sans":   { source: "google",    id: "Plus+Jakarta+Sans" },
  "Epilogue":            { source: "google",    id: "Epilogue" },
  "Sora":                { source: "google",    id: "Sora" },
  "Lexend":              { source: "google",    id: "Lexend" },
  "Bricolage Grotesque": { source: "google",    id: "Bricolage+Grotesque" },
  "Chivo":               { source: "google",    id: "Chivo" },
  "Outfit":              { source: "google",    id: "Outfit" },
  "Mukta":               { source: "google",    id: "Mukta" },
  "Hind":                { source: "google",    id: "Hind" },
  "Baloo 2":             { source: "google",    id: "Baloo+2" },
  "Eczar":               { source: "google",    id: "Eczar" },
  "Noto Sans":           { source: "google",    id: "Noto+Sans" },
  // Fontshare (free tier, no license issue)
  "Satoshi":             { source: "fontshare", id: "satoshi" },
  "Cabinet Grotesk":     { source: "fontshare", id: "cabinet-grotesk" },
  "General Sans":        { source: "fontshare", id: "general-sans" },
  "Switzer":             { source: "fontshare", id: "switzer" },
  "Clash Display":       { source: "fontshare", id: "clash-display" },
};

export const getAllFontNames = (): string[] => [
  ...new Set([
    ...BASE_FONTS.map(f => f.name),
    ...BASE_FONTS.flatMap(f => f.pairings.map(p => p.font)),
  ]),
];
