// Kosten appen planlægger efter: undgå fruktaner.
//
// - Ingen hvidløg (hvidløgsolie er fin – fruktaner er ikke fedtopløselige).
// - Løg og gluten (hvede, rug, byg) kun i små mængder pr. ret.
// - Andre FODMAP'er (laktose, GOS, polyoler, fruktose) er fine.
//
// Grænserne herunder er de eneste tal der skal ændres, hvis man tåler mere eller mindre.

import { checkIngredient, FRUCTAN_PROFILE } from "./fodmap/check.ts";

type LimitedGroup = {
  name: string;
  /** Regel-id'er fra src/fodmap/rules.ts. */
  rules: string[];
  maxGramsPerPerson: number;
};

export const LIMITED_GROUPS: LimitedGroup[] = [
  { name: "løg", rules: ["loeg", "foraarsloeg", "porre"], maxGramsPerPerson: 25 },
  { name: "gluten", rules: ["hvede", "broed", "pasta", "nudler", "rug", "byg", "spelt"], maxGramsPerPerson: 15 },
];

/** Flere fruktankilder i samme ret lægges sammen. */
export const MAX_LIMITED_PER_DISH = 2;

export type DishItem = {
  name: string;
  /** Mængde i gram pr. person – kræves for løg og gluten. */
  gramsPerPerson?: number;
};

export type DietIssue = { severity: "error" | "warning"; message: string; ingredient?: string };

export type DietResult = { ok: boolean; issues: DietIssue[] };

const fmt = (n: number) => Math.round(n * 10) / 10;

export function checkDish(items: DishItem[]): DietResult {
  const issues: DietIssue[] = [];
  const groupTotals = new Map<LimitedGroup, number>();
  const limited = new Set<string>();

  for (const item of items) {
    for (const m of checkIngredient(item.name, FRUCTAN_PROFILE).matches) {
      if (m.status === "low") continue;

      // Gruppegrænsen gælder kun selve løget/glutenet – ikke undtagelser som glutenfrit brød.
      const group = m.status === m.rule.status ? LIMITED_GROUPS.find((g) => g.rules.includes(m.rule.id)) : undefined;
      if (group) {
        limited.add(item.name);
        if (item.gramsPerPerson === undefined) {
          issues.push({ severity: "error", ingredient: item.name, message: `${item.name}: angiv mængden i gram (${group.name} har en grænse).` });
        } else {
          groupTotals.set(group, (groupTotals.get(group) ?? 0) + item.gramsPerPerson);
        }
      } else if (m.status === "high") {
        issues.push({
          severity: "error",
          ingredient: item.name,
          message: `${m.rule.name} indeholder fruktaner.${m.rule.swap ? ` Brug ${m.rule.swap}.` : ""}`,
        });
      } else if (m.status === "limit") {
        limited.add(item.name);
      } else {
        issues.push({ severity: "warning", ingredient: item.name, message: `${m.rule.name}: tjek etiketten for hvidløg, løg og hvede.` });
      }
    }
  }

  for (const [group, total] of groupTotals) {
    if (total > group.maxGramsPerPerson) {
      issues.push({
        severity: "error",
        message: `For meget ${group.name}: ${fmt(total)} g pr. person (højst ${group.maxGramsPerPerson} g).`,
      });
    }
  }

  if (limited.size > MAX_LIMITED_PER_DISH) {
    issues.push({
      severity: "error",
      message: `For mange fruktankilder i samme ret (${[...limited].join(", ")}) – højst ${MAX_LIMITED_PER_DISH}.`,
    });
  }

  return { ok: !issues.some((i) => i.severity === "error"), issues };
}
