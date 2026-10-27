// Lav-FODMAP regler for danske ingrediensnavne.
//
// Bygger på Monash Universitys FODMAP-data (monashfodmap.com). Hvor en
// portionsgrænse er usikker, er reglen sat forsigtigt ("limit" eller "high").
// Tjek altid tvivlstilfælde i Monash-appen – den opdateres løbende.
//
// Matching: aliaser matches som delstrenge (danske sammensatte ord), og det
// længste alias vinder. Derfor kan "hvidløgsolie" (lav) overtrumfe "hvidløg"
// (høj), og "purløg" overtrumfe "løg".

export type FodmapType = "fructan" | "gos" | "lactose" | "fructose" | "polyol";

/**
 * low   – fint i normale portioner
 * limit – kun lille portion; flere i samme ret lægges sammen
 * high  – undgå
 * check – afhænger af produktet; læs ingredienslisten
 */
export type Status = "low" | "limit" | "high" | "check";

export type Exception = {
  /** Testes mod hele ingrediensteksten (små bogstaver). */
  pattern: RegExp;
  status: Status;
  note?: string;
};

export type FodmapRule = {
  id: string;
  name: string;
  aliases: string[];
  /** Korte aliaser der kun må matche som hele ord (fx "mel" ≠ "melon"). */
  wholeWord?: string[];
  status: Status;
  types: FodmapType[];
  note?: string;
  swap?: string;
  exceptions?: Exception[];
};

const GLUTEN_FREE: Exception = {
  pattern: /glutenfri/,
  status: "check",
  note: "Glutenfri varer er oftest lave, men tjek for inulin/cikorierod.",
};

const LACTOSE_FREE: Exception = { pattern: /laktosefri/, status: "low" };

function low(id: string, name: string, aliases: string[], note?: string): FodmapRule {
  return { id, name, aliases, status: "low", types: [], note };
}

export const RULES: FodmapRule[] = [
  // --- Løg og hvidløg (de største fruktankilder) ---
  {
    id: "hvidloeg",
    name: "Hvidløg",
    aliases: ["hvidløg", "aioli", "tzatziki"],
    status: "high",
    types: ["fructan"],
    note: "Også hvidløgspulver og -salt.",
    swap: "hvidløgsolie – fruktaner er ikke fedtopløselige",
  },
  low("hvidloegsolie", "Hvidløgsolie", ["hvidløgsolie", "hvidløgsinfunderet olie", "olie med hvidløgssmag"]),
  {
    id: "loeg",
    name: "Løg",
    aliases: ["løg"],
    status: "high",
    types: ["fructan"],
    note: "Alle slags: gule, røde, skalotte-, perle-, løgpulver og løgsalt.",
    swap: "grøn top af forårsløg, grønne porretoppe, purløg eller asafoetida",
  },
  {
    id: "foraarsloeg",
    name: "Forårsløg",
    aliases: ["forårsløg"],
    status: "high",
    types: ["fructan"],
    note: "Det hvide løg er højt.",
    swap: "kun den grønne top",
    exceptions: [{ pattern: /grøn|top/, status: "low", note: "Den grønne top er lav." }],
  },
  {
    id: "porre",
    name: "Porre",
    aliases: ["porre", "porrer", "porreløg"],
    status: "high",
    types: ["fructan"],
    note: "Den hvide del er høj.",
    swap: "kun den grønne del",
    exceptions: [{ pattern: /grøn|top/, status: "low", note: "Den grønne del er lav." }],
  },
  low("purloeg", "Purløg", ["purløg"]),
  low("asafoetida", "Asafoetida", ["asafoetida"], "Giver løgsmag uden fruktaner."),

  // --- Korn ---
  {
    id: "hvede",
    name: "Hvede",
    aliases: ["hvedemel", "hvede", "durum", "semulje", "couscous", "bulgur"],
    wholeWord: ["mel"],
    status: "high",
    types: ["fructan"],
    note: "Små mængder, fx til jævning, tåles ofte.",
    swap: "glutenfri melblanding, rismel eller majsstivelse",
    exceptions: [GLUTEN_FREE],
  },
  {
    id: "pasta",
    name: "Hvedepasta",
    aliases: ["pasta", "spaghetti", "penne", "fusilli", "makaroni", "lasagneplade", "tagliatelle", "tortellini", "ravioli"],
    status: "high",
    types: ["fructan"],
    note: "En lille portion tåles af nogle.",
    swap: "glutenfri pasta eller risnudler",
    exceptions: [{ pattern: /glutenfri|\bris|majs|quinoa/, status: "low" }],
  },
  {
    id: "baelgfrugtpasta",
    name: "Pasta af bælgfrugter",
    aliases: ["linsepasta", "kikærtepasta", "bønnepasta"],
    status: "high",
    types: ["gos"],
  },
  {
    id: "nudler",
    name: "Hvedenudler",
    aliases: ["nudler", "ramen", "udon", "ægnudler"],
    status: "high",
    types: ["fructan"],
    swap: "risnudler eller glasnudler",
    exceptions: [{ pattern: /\bris|glas/, status: "low" }],
  },
  {
    id: "broed",
    name: "Hvedebrød",
    aliases: [
      "brød", "franskbrød", "toastbrød", "flute", "baguette", "rundstykke", "burgerbolle",
      "pitabrød", "naan", "tortilla", "wrap", "pizzadej", "pizzabund", "butterdej", "wienerbrød",
      "kiks", "rasp", "paneret",
    ],
    status: "high",
    types: ["fructan"],
    swap: "glutenfrit brød eller surdejsbrød af 100 % spelt",
    exceptions: [{ pattern: /majs/, status: "low" }, GLUTEN_FREE],
  },
  low("speltsurdej", "Speltsurdejsbrød", ["speltsurdejsbrød", "surdejsbrød af spelt", "spelt surdejsbrød"],
    "Surdejen nedbryder fruktanerne – brødet skal være 100 % spelt."),
  {
    id: "spelt",
    name: "Spelt",
    aliases: ["spelt", "speltmel"],
    status: "limit",
    types: ["fructan"],
    note: "Surdejsbrød af 100 % spelt er lavt; almindeligt speltbrød og mel kun i små mængder.",
  },
  {
    id: "rug",
    name: "Rug",
    aliases: ["rugbrød", "rugmel", "rugkerner", "rugknæk", "rugbolle"],
    wholeWord: ["rug"],
    status: "high",
    types: ["fructan"],
    note: "Rugbrød er en af de største fruktankilder i dansk kost.",
    swap: "glutenfrit brød eller speltsurdejsbrød",
    exceptions: [GLUTEN_FREE],
  },
  {
    id: "byg",
    name: "Byg",
    aliases: ["perlebyg", "bygmel", "bygflager", "bygotto", "bygkerner"],
    wholeWord: ["byg"],
    status: "high",
    types: ["fructan"],
    swap: "ris, quinoa eller hirse",
  },
  {
    id: "malt",
    name: "Malt",
    aliases: ["bygmalt", "maltekstrakt"],
    wholeWord: ["malt"],
    status: "check",
    types: ["fructan"],
    note: "Ofte kun spormængder i færdigvarer.",
  },
  {
    id: "havre",
    name: "Havre",
    aliases: ["havregryn", "havre", "havremel"],
    status: "limit",
    types: ["fructan", "gos"],
    note: "Lav i en almindelig skål grød; store portioner er højere.",
  },
  {
    id: "havremaelk",
    name: "Havredrik",
    aliases: ["havremælk", "havredrik"],
    status: "limit",
    types: ["fructan", "gos"],
  },
  {
    id: "inulin",
    name: "Inulin / cikorierod",
    aliases: ["inulin", "cikorierod", "cikorie", "fruktooligosaccharid", "oligofruktose"],
    wholeWord: ["fos"],
    status: "high",
    types: ["fructan"],
    note: "Tilsættes som fibre i brød, yoghurt og proteinbarer.",
  },

  // --- Grøntsager ---
  {
    id: "artiskok",
    name: "Artiskok / jordskok",
    aliases: ["artiskok", "jordskok"],
    status: "high",
    types: ["fructan"],
  },
  {
    id: "asparges",
    name: "Asparges",
    aliases: ["asparges"],
    status: "high",
    types: ["fructan", "fructose"],
    swap: "grønne bønner",
  },
  { id: "roedbede", name: "Rødbede", aliases: ["rødbede"], status: "limit", types: ["fructan", "gos"] },
  { id: "rosenkaal", name: "Rosenkål", aliases: ["rosenkål"], status: "limit", types: ["fructan"] },
  { id: "savoykaal", name: "Savoykål", aliases: ["savoykål"], status: "limit", types: ["fructan"] },
  { id: "fennikel", name: "Fennikel", aliases: ["fennikel"], status: "limit", types: ["fructan"] },
  {
    id: "aerter",
    name: "Grønne ærter",
    aliases: ["ærter", "grønne ærter"],
    status: "limit",
    types: ["fructan", "gos"],
  },
  {
    id: "sukkeraerter",
    name: "Sukkerærter",
    aliases: ["sukkerærter", "sugarsnaps", "snackærter"],
    status: "limit",
    types: ["fructan", "fructose"],
  },
  { id: "butternut", name: "Butternut squash", aliases: ["butternut"], status: "limit", types: ["gos", "polyol"] },
  {
    id: "soed-kartoffel",
    name: "Sød kartoffel",
    aliases: ["søde kartofler", "sød kartoffel", "batat"],
    status: "limit",
    types: ["polyol"],
  },
  { id: "blomkaal", name: "Blomkål", aliases: ["blomkål"], status: "high", types: ["polyol"] },
  {
    id: "champignon",
    name: "Champignon / svampe",
    aliases: ["champignon", "svampe", "portobello", "shiitake"],
    status: "high",
    types: ["polyol"],
    swap: "østershatte",
  },
  {
    id: "selleri",
    name: "Bladselleri",
    aliases: ["selleri", "bladselleri", "stilkselleri"],
    status: "limit",
    types: ["polyol"],
  },
  {
    id: "majs",
    name: "Majs",
    aliases: ["majs", "majskolbe", "majskerner"],
    status: "limit",
    types: ["polyol", "gos"],
  },
  { id: "avocado", name: "Avocado", aliases: ["avocado"], status: "limit", types: ["polyol"] },

  // --- Bælgfrugter ---
  {
    id: "kikaerter",
    name: "Kikærter",
    aliases: ["kikærter", "kikært"],
    status: "high",
    types: ["gos"],
    exceptions: [{ pattern: /dåse|skyllede/, status: "limit", note: "Skyllede kikærter fra dåse tåles i små portioner." }],
  },
  {
    id: "linser",
    name: "Linser",
    aliases: ["linser"],
    status: "high",
    types: ["gos"],
    exceptions: [
      { pattern: /dåse|skyllede/, status: "limit", note: "Skyllede linser fra dåse tåles i små portioner." },
      { pattern: /røde/, status: "limit" },
    ],
  },
  {
    id: "boenner",
    name: "Bønner",
    aliases: ["bønner", "bønne", "flækærter", "gule ærter"],
    status: "high",
    types: ["gos"],
    note: "Kidney-, sorte, hvide og bagte bønner.",
  },
  {
    id: "hummus",
    name: "Hummus",
    aliases: ["hummus"],
    status: "high",
    types: ["fructan", "gos"],
    note: "Hvidløg og kikærter.",
  },
  {
    id: "silketofu",
    name: "Silketofu",
    aliases: ["silketofu", "blød tofu"],
    status: "high",
    types: ["fructan", "gos"],
    swap: "fast tofu",
  },

  // --- Nødder ---
  { id: "cashew", name: "Cashewnødder", aliases: ["cashew"], status: "high", types: ["fructan", "gos"] },
  { id: "pistacie", name: "Pistacienødder", aliases: ["pistacie"], status: "high", types: ["fructan", "gos"] },
  { id: "mandler", name: "Mandler", aliases: ["mandel", "mandler"], status: "limit", types: ["gos"] },
  { id: "hasselnoedder", name: "Hasselnødder", aliases: ["hasselnød"], status: "limit", types: ["gos"] },

  // --- Frugt ---
  {
    id: "vandmelon",
    name: "Vandmelon",
    aliases: ["vandmelon"],
    status: "high",
    types: ["fructan", "fructose", "polyol"],
  },
  {
    id: "melon",
    name: "Melon",
    aliases: ["melon"],
    status: "check",
    types: ["fructan"],
    note: "Vandmelon er høj, cantaloupe er lav.",
    exceptions: [{ pattern: /cantaloupe/, status: "low" }],
  },
  { id: "fersken", name: "Fersken / nektarin", aliases: ["fersken", "nektarin"], status: "high", types: ["fructan", "polyol"] },
  { id: "dadler", name: "Dadler", aliases: ["dadler", "daddel"], status: "high", types: ["fructan"] },
  { id: "figner", name: "Figner", aliases: ["figner", "figen"], status: "high", types: ["fructan"] },
  { id: "svesker", name: "Svesker", aliases: ["svesker"], status: "high", types: ["fructan", "polyol"] },
  { id: "rosiner", name: "Rosiner", aliases: ["rosiner"], status: "limit", types: ["fructan"] },
  { id: "grapefrugt", name: "Grapefrugt", aliases: ["grapefrugt"], status: "limit", types: ["fructan"] },
  { id: "kaki", name: "Kaki / persimmon", aliases: ["kaki", "persimmon", "sharonfrugt"], status: "high", types: ["fructan"] },
  {
    id: "banan",
    name: "Banan",
    aliases: ["banan"],
    status: "limit",
    types: ["fructan"],
    note: "Modne bananer har flere fruktaner.",
    exceptions: [{ pattern: /fast|grøn|umoden/, status: "low" }],
  },
  { id: "aeble", name: "Æble", aliases: ["æble"], status: "high", types: ["fructose", "polyol"] },
  { id: "paere", name: "Pære", aliases: ["pære"], status: "high", types: ["fructose", "polyol"] },
  { id: "mango", name: "Mango", aliases: ["mango"], status: "high", types: ["fructose"] },
  { id: "kirsebaer", name: "Kirsebær", aliases: ["kirsebær"], status: "high", types: ["fructose", "polyol"] },
  { id: "blommer", name: "Blommer", aliases: ["blomme", "blommer"], status: "high", types: ["polyol"] },
  { id: "abrikos", name: "Abrikos", aliases: ["abrikos"], status: "high", types: ["polyol"] },
  { id: "brombaer", name: "Brombær", aliases: ["brombær"], status: "high", types: ["polyol"] },
  { id: "honning", name: "Honning / agave", aliases: ["honning", "agave"], status: "high", types: ["fructose"], swap: "ahornsirup" },

  // --- Mejeri ---
  {
    id: "maelk",
    name: "Mælk",
    aliases: ["mælk", "sødmælk", "letmælk", "minimælk", "skummetmælk", "kærnemælk"],
    status: "high",
    types: ["lactose"],
    swap: "laktosefri mælk",
    exceptions: [LACTOSE_FREE],
  },
  low("kokosmaelk", "Kokosmælk", ["kokosmælk"]),
  low("mandelmaelk", "Mandeldrik", ["mandelmælk", "mandeldrik"]),
  { id: "sojamaelk", name: "Sojadrik", aliases: ["sojamælk", "sojadrik"], status: "check", types: ["gos"], note: "Lav hvis lavet af sojaprotein, høj hvis af hele sojabønner." },
  {
    id: "yoghurt",
    name: "Yoghurt",
    aliases: ["yoghurt", "a38", "ymer", "tykmælk"],
    status: "high",
    types: ["lactose"],
    exceptions: [LACTOSE_FREE],
  },
  {
    id: "floede",
    name: "Fløde / creme fraiche",
    aliases: ["fløde", "creme fraiche", "cremefraiche", "crème fraîche", "skyr", "kvark", "hytteost", "ricotta", "flødeost", "smøreost", "mascarpone"],
    status: "limit",
    types: ["lactose"],
    exceptions: [LACTOSE_FREE],
  },
  low("ost", "Fast ost", ["ost", "cheddar", "parmesan", "mozzarella", "feta", "havarti", "danbo", "pecorino", "gruyère", "halloumi"]),

  // --- Skjult løg/hvidløg/hvede: læs ingredienslisten ---
  low("lavfodmap-bouillon", "Lav-FODMAP bouillon", ["lav-fodmap bouillon", "lav-fodmap fond"]),
  {
    id: "bouillon",
    name: "Bouillon / fond",
    aliases: ["bouillon", "fond", "suppeterning"],
    status: "check",
    types: ["fructan"],
    note: "Indeholder ofte løg og hvidløg.",
    swap: "lav-FODMAP bouillon eller hjemmelavet fond uden løg",
  },
  {
    id: "krydderiblanding",
    name: "Krydderiblanding",
    aliases: ["krydderiblanding", "grillkrydderi", "tacokrydderi", "taco krydderi", "gyroskrydderi", "kebabkrydderi", "fajita", "karry", "karrypasta", "currypasta"],
    status: "check",
    types: ["fructan"],
    note: "Indeholder ofte løg- eller hvidløgspulver.",
  },
  {
    id: "poelse",
    name: "Pølser og pålæg",
    aliases: ["pølse", "chorizo", "salami", "medister", "leverpostej", "postej", "frikadelle", "kødboller", "kødbolle"],
    status: "check",
    types: ["fructan"],
    note: "Indeholder ofte løg, hvidløg eller hvedemel.",
  },
  {
    id: "marineret",
    name: "Marineret / krydret",
    aliases: ["marineret", "marinade", "krydret"],
    status: "check",
    types: ["fructan"],
    note: "Marinader indeholder ofte løg og hvidløg.",
  },
  {
    id: "faerdigsauce",
    name: "Færdigsauce",
    aliases: [
      "pastasauce", "tomatsauce", "pesto", "salsa", "dressing", "bbq", "barbecue", "ketchup",
      "chilisauce", "sweet chili", "sriracha", "worcestershire", "østerssauce", "hoisin", "teriyaki",
      "bearnaise", "remoulade", "dip", "mayonnaise",
    ],
    status: "check",
    types: ["fructan"],
    note: "Tjek for løg, hvidløg og fruktosesirup.",
  },

  // --- Lav-FODMAP basisvarer (så de ikke ender som "ukendt") ---
  low("koed", "Kød", ["kylling", "kalkun", "oksekød", "okse", "bøf", "svinekød", "grisekød", "kalvekød", "lam", "mørbrad", "kotelet", "flæsk", "bacon", "skinke", "hamburgerryg"],
    "Rent kød er lavt – krydret eller marineret kød skal tjekkes."),
  low("fisk", "Fisk og skaldyr", ["laks", "torsk", "sej", "rødspætte", "makrel", "tun", "rejer", "muslinger", "sild", "fisk", "kuller", "ørred"]),
  low("aeg", "Æg", ["æg"]),
  low("tofu", "Fast tofu", ["tofu", "fast tofu", "tempeh"]),
  low("ris", "Ris og glutenfrie kornsorter", ["ris", "basmatiris", "jasminris", "quinoa", "hirse", "boghvede", "polenta", "rismel", "majsstivelse", "maizena", "majsmel", "kartoffelmel", "popcorn", "rispapir", "rismælk", "risdrik", "majstortilla"]),
  low("kartofler", "Kartofler", ["kartofler", "kartoffel"]),
  low("groent", "Lav-FODMAP grøntsager", [
    "gulerod", "gulerødder", "agurk", "tomat", "peberfrugt", "squash", "aubergine", "spinat", "salat",
    "rucola", "grønne bønner", "haricots verts", "edamame", "bønnespirer", "pastinak", "broccoli",
    "hvidkål", "rødkål", "kinakål", "pak choi", "grønkål", "radise", "ingefær", "chili", "oliven",
    "knoldselleri", "rabarber", "østershatte", "kapers", "citrongræs",
  ]),
  low("frugt", "Lav-FODMAP frugt", ["appelsin", "mandarin", "klementin", "kiwi", "ananas", "jordbær", "blåbær", "hindbær", "vindruer", "citron", "lime", "passionsfrugt", "papaya", "cantaloupe"]),
  low("urter", "Krydderurter og krydderier", ["persille", "basilikum", "koriander", "timian", "rosmarin", "oregano", "dild", "mynte", "spidskommen", "paprika", "gurkemeje", "kanel", "peber", "salt", "laurbærblad", "muskat", "estragon", "garam masala", "chiliflager"]),
  low("fedt", "Olie og fedt", ["olie", "olivenolie", "rapsolie", "smør", "margarine"]),
  low("andet", "Øvrige lave varer", ["sojasauce", "tamari", "fiskesauce", "eddike", "sennep", "ahornsirup", "sukker", "farin", "peanutbutter", "peanutsmør", "jordnødder", "peanuts", "valnødder", "macadamia", "pekannødder", "pinjekerner", "chokolade", "kakao", "tomatpuré", "hakkede tomater", "vand", "citronsaft", "sesam", "sovskulør", "hvidvin", "rødvin"]),
];
