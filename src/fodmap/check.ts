import { RULES, type FodmapRule, type FodmapType, type Status } from "./rules.ts";

/** Hvilke FODMAP-grupper der skal begrænses. */
export type Profile = { restrict: FodmapType[] };

export const FRUCTAN_PROFILE: Profile = { restrict: ["fructan"] };
export const FULL_PROFILE: Profile = { restrict: ["fructan", "gos", "lactose", "fructose", "polyol"] };

export type Match = {
  rule: FodmapRule;
  /** Den del af teksten der matchede. */
  matched: string;
  status: Status;
  note?: string;
  /** Højt i en FODMAP-gruppe som profilen ikke begrænser. */
  outsideProfile: boolean;
};

export type IngredientResult = {
  text: string;
  status: Status | "unknown";
  matches: Match[];
};

export type RecipeIssue = {
  severity: "error" | "warning";
  ingredient?: string;
  message: string;
  swap?: string;
};

export type RecipeResult = {
  ok: boolean;
  issues: RecipeIssue[];
  /** Ingredienser uden nogen regel – bør gennemses. */
  unknown: string[];
};

const SEVERITY: Record<Status, number> = { low: 0, limit: 1, check: 2, high: 3 };

const TYPE_LABEL: Record<FodmapType, string> = {
  fructan: "fruktaner",
  gos: "GOS",
  lactose: "laktose",
  fructose: "fruktose",
  polyol: "polyoler",
};

type Candidate = { rule: FodmapRule; start: number; end: number };

const LETTER = /\p{L}/u;

function isWholeWord(text: string, start: number, end: number): boolean {
  return !LETTER.test(text[start - 1] ?? "") && !LETTER.test(text[end] ?? "");
}

function findCandidates(text: string): Candidate[] {
  const found: Candidate[] = [];
  for (const rule of RULES) {
    const aliases = [
      ...rule.aliases.map((a) => ({ alias: a, whole: false })),
      ...(rule.wholeWord ?? []).map((a) => ({ alias: a, whole: true })),
    ];
    for (const { alias, whole } of aliases) {
      for (let i = text.indexOf(alias); i !== -1; i = text.indexOf(alias, i + 1)) {
        const end = i + alias.length;
        if (!whole || isWholeWord(text, i, end)) found.push({ rule, start: i, end });
      }
    }
  }
  return found;
}

/** Længste match vinder; overlappende kortere matches kasseres. */
function pickLongest(candidates: Candidate[]): Candidate[] {
  const sorted = [...candidates].sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: Candidate[] = [];
  for (const c of sorted) {
    if (!taken.some((t) => c.start < t.end && t.start < c.end)) taken.push(c);
  }
  return taken.sort((a, b) => a.start - b.start);
}

function resolve(rule: FodmapRule, text: string, profile: Profile): Omit<Match, "rule" | "matched"> {
  let status = rule.status;
  let note = rule.note;
  const exception = rule.exceptions?.find((e) => e.pattern.test(text));
  if (exception) {
    status = exception.status;
    note = exception.note ?? note;
  }
  const outsideProfile = status !== "low" && !rule.types.some((t) => profile.restrict.includes(t));
  return { status: outsideProfile ? "low" : status, note, outsideProfile };
}

/**
 * Vurderer én ingredienslinje ("2 fed hvidløg") eller en produkt-
 * ingrediensliste ("hvedemel, vand, løgpulver …").
 */
export function checkIngredient(text: string, profile: Profile = FRUCTAN_PROFILE): IngredientResult {
  const normalized = text.normalize("NFC").toLowerCase();
  const matches: Match[] = [];
  for (const c of pickLongest(findCandidates(normalized))) {
    if (matches.some((m) => m.rule.id === c.rule.id)) continue;
    matches.push({ rule: c.rule, matched: normalized.slice(c.start, c.end), ...resolve(c.rule, normalized, profile) });
  }
  const status = matches.length
    ? matches.reduce<Status>((worst, m) => (SEVERITY[m.status] > SEVERITY[worst] ? m.status : worst), "low")
    : "unknown";
  return { text, status, matches };
}

function typesText(rule: FodmapRule): string {
  return rule.types.map((t) => TYPE_LABEL[t]).join(" og ");
}

/** Tjekker en hel ret. `ok` er false hvis noget er højt i en begrænset FODMAP-gruppe. */
export function checkRecipe(ingredients: string[], profile: Profile = FRUCTAN_PROFILE): RecipeResult {
  const issues: RecipeIssue[] = [];
  const unknown: string[] = [];
  const limited = new Map<string, string>();

  for (const text of ingredients) {
    const result = checkIngredient(text, profile);
    if (result.status === "unknown") unknown.push(text);
    for (const m of result.matches) {
      const note = m.note ? ` ${m.note}` : "";
      if (m.status === "high") {
        issues.push({
          severity: "error",
          ingredient: text,
          message: `${m.rule.name} er højt i ${typesText(m.rule)}.${note}`,
          swap: m.rule.swap,
        });
      } else if (m.status === "limit") {
        limited.set(m.rule.id, m.rule.name);
        issues.push({
          severity: "warning",
          ingredient: text,
          message: `${m.rule.name}: kun lille portion (${typesText(m.rule)}).${note}`,
          swap: m.rule.swap,
        });
      } else if (m.status === "check") {
        issues.push({
          severity: "warning",
          ingredient: text,
          message: `${m.rule.name}: tjek ingredienslisten.${note}`,
          swap: m.rule.swap,
        });
      }
    }
  }

  if (limited.size >= 2) {
    issues.push({
      severity: "warning",
      message: `Flere ingredienser med portionsgrænse (${[...limited.values()].join(", ")}). FODMAP'er lægges sammen i samme måltid, så hold portionerne små.`,
    });
  }

  return { ok: !issues.some((i) => i.severity === "error"), issues, unknown };
}
