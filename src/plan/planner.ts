import type { Protein, Recipe } from "../data/types.ts";

/** Noget brugeren vil have brugt: varer de har, eller som er på tilbud. */
export type UseItem = {
  /** Ingredienser der tæller, fx alle kyllingetyper for "Kylling". */
  ids: string[];
  /** Mængde i ingrediensernes grundenhed (g, ml, stk …). */
  amount: number;
  source: "har" | "tilbud";
};

export type PlanRequest = {
  days: number;
  people: number;
  use: UseItem[];
  seed: number;
  proteins?: Protein[];
  maxMinutes?: number;
  /** Kun opskrifter fra brugerens egen samling. */
  onlyMine?: boolean;
  /** Opskrifter der ikke må vælges (fx den man lige har byttet væk). */
  exclude?: string[];
};

export type Usage = { item: UseItem; used: number };

export type Plan = {
  recipes: Recipe[];
  usage: Usage[];
};

/** Lille deterministisk PRNG, så samme seed giver samme plan. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scale(recipe: Recipe, people: number): number {
  return people / recipe.servings;
}

/** Hvor meget af `item` retten bruger til `people` personer. */
export function amountUsed(recipe: Recipe, item: UseItem, people: number): number {
  const factor = scale(recipe, people);
  return recipe.ingredients
    .filter((i) => item.ids.includes(i.id))
    .reduce((sum, i) => sum + i.amount * factor, 0);
}

function candidates(req: PlanRequest, recipes: Recipe[]): Recipe[] {
  return recipes.filter(
    (r) =>
      (!req.proteins?.length || req.proteins.includes(r.protein)) &&
      (!req.maxMinutes || r.minutes <= req.maxMinutes) &&
      (!req.onlyMine || r.mine) &&
      !req.exclude?.includes(r.id),
  );
}

/**
 * Vælger én ret pr. dag. Retter der bruger det brugeren har eller har fundet
 * på tilbud foretrækkes, indtil mængderne er brugt op; resten vælges
 * tilfældigt med variation i protein.
 */
export function planWeek(req: PlanRequest, recipes: Recipe[]): Plan {
  const random = rng(req.seed);
  const pool = candidates(req, recipes);
  if (!pool.length) return { recipes: [], usage: req.use.map((item) => ({ item, used: 0 })) };

  const remaining = req.use.map((u) => u.amount);
  const chosen: Recipe[] = [];

  for (let day = 0; day < req.days; day++) {
    let available = pool.filter((r) => !chosen.includes(r));
    if (!available.length) available = pool;

    let best: Recipe | undefined;
    let bestScore = -Infinity;
    for (const recipe of available) {
      let score = random() * 0.25;
      req.use.forEach((item, i) => {
        if (remaining[i] <= 0 || item.amount <= 0) return;
        score += Math.min(remaining[i], amountUsed(recipe, item, req.people)) / item.amount;
      });
      const sameProtein = chosen.filter((c) => c.protein === recipe.protein).length;
      score -= 0.15 * sameProtein;
      if (score > bestScore) {
        bestScore = score;
        best = recipe;
      }
    }

    chosen.push(best!);
    req.use.forEach((item, i) => (remaining[i] -= amountUsed(best!, item, req.people)));
  }

  return {
    recipes: spreadProteins(chosen),
    usage: req.use.map((item) => ({
      item,
      used: chosen.reduce((sum, r) => sum + amountUsed(r, item, req.people), 0),
    })),
  };
}

/** Undgår så vidt muligt samme protein to dage i træk. */
export function spreadProteins(recipes: Recipe[]): Recipe[] {
  const left = [...recipes];
  const ordered: Recipe[] = [];
  while (left.length) {
    const prev = ordered.at(-1)?.protein;
    // Tag den protein der er flest tilbage af først, så de ikke hober sig op til sidst.
    const counts = new Map<Protein, number>();
    for (const r of left) counts.set(r.protein, (counts.get(r.protein) ?? 0) + 1);
    let pick = -1;
    for (let i = 0; i < left.length; i++) {
      if (left[i].protein === prev) continue;
      if (pick === -1 || counts.get(left[i].protein)! > counts.get(left[pick].protein)!) pick = i;
    }
    ordered.push(left.splice(pick === -1 ? 0 : pick, 1)[0]);
  }
  return ordered;
}

/** Byt én dag ud med en anden ret, uden at vælge en der allerede er i planen. */
export function swapDay(plan: Recipe[], day: number, req: PlanRequest, recipes: Recipe[]): Recipe[] {
  const exclude = [...(req.exclude ?? []), ...plan.map((r) => r.id)];
  const others = plan.filter((_, i) => i !== day);
  // Det de andre dage allerede bruger, tæller ikke med for den nye ret.
  const use = req.use.map((item) => ({
    ...item,
    amount: Math.max(0, item.amount - others.reduce((sum, r) => sum + amountUsed(r, item, req.people), 0)),
  }));
  const { recipes: [replacement] } = planWeek({ ...req, use, days: 1, exclude }, recipes);
  if (!replacement) return plan;
  return plan.map((r, i) => (i === day ? replacement : r));
}
