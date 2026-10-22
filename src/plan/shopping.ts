import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import type { Ingredient, Recipe, Section, Unit } from "../data/types.ts";
import { checkIngredient } from "../fodmap/check.ts";
import { scale, type UseItem } from "./planner.ts";

export type ShoppingLine = {
  ingredient: Ingredient;
  /** Samlet behov efter det man har er trukket fra. */
  amount: number;
  /** Hvor mange pakker der skal købes, hvis varen har en pakkestørrelse. */
  packs?: number;
  onOffer: boolean;
  /** Varen skal tjekkes på etiketten (fx glutenfri brød med inulin). */
  checkLabel: boolean;
  /** Retterne der bruger varen. */
  recipes: string[];
};

export type ShoppingList = {
  sections: { section: Section; lines: ShoppingLine[] }[];
  pantry: ShoppingLine[];
  /** Varer man har nok af, så de ikke skal købes. */
  covered: ShoppingLine[];
};

const SECTION_ORDER: Section[] = [
  "Frugt & grønt",
  "Kød & fisk",
  "Mejeri & æg",
  "Brød & kolonial",
  "Dåser & glas",
  "Frost",
  "Krydderier & olie",
];

/** Lidt for lidt af noget man har, er ikke værd at købe en ny pakke for. */
const HAVE_TOLERANCE = 0.15;
/** Lidt mere end én pakke runder ned i stedet for at købe en til. */
const PACK_TOLERANCE = 0.1;

export function packsNeeded(amount: number, size: number): number {
  return Math.max(1, Math.ceil(amount / size - PACK_TOLERANCE));
}

export function buildShoppingList(recipes: Recipe[], people: number, use: UseItem[]): ShoppingList {
  const needs = new Map<string, { amount: number; recipes: string[] }>();
  for (const recipe of recipes) {
    const factor = scale(recipe, people);
    for (const item of recipe.ingredients) {
      const entry = needs.get(item.id) ?? { amount: 0, recipes: [] };
      entry.amount += item.amount * factor;
      if (!entry.recipes.includes(recipe.title)) entry.recipes.push(recipe.title);
      needs.set(item.id, entry);
    }
  }

  // Træk det man har fra, fordelt på de ingredienser varen dækker.
  const covered = new Set<string>();
  for (const item of use.filter((u) => u.source === "har")) {
    let have = item.amount;
    for (const id of item.ids) {
      const need = needs.get(id);
      if (!need || have <= 0) continue;
      const taken = Math.min(have, need.amount);
      need.amount -= taken;
      have -= taken;
      if (need.amount <= item.amount * HAVE_TOLERANCE) covered.add(id);
    }
  }

  const onOffer = new Set(use.filter((u) => u.source === "tilbud").flatMap((u) => u.ids));
  const list: ShoppingList = { sections: [], pantry: [], covered: [] };
  const bySection = new Map<Section, ShoppingLine[]>();

  for (const [id, need] of needs) {
    const ingredient = INGREDIENT_BY_ID.get(id);
    if (!ingredient) throw new Error(`Ukendt ingrediens: ${id}`);
    const line: ShoppingLine = {
      ingredient,
      amount: need.amount,
      packs: ingredient.pack ? packsNeeded(need.amount, ingredient.pack.size) : undefined,
      onOffer: onOffer.has(id),
      checkLabel: checkIngredient(ingredient.name).status === "check",
      recipes: need.recipes,
    };
    if (covered.has(id)) list.covered.push(line);
    else if (ingredient.pantry) list.pantry.push(line);
    else bySection.set(ingredient.section, [...(bySection.get(ingredient.section) ?? []), line]);
  }

  const byName = (a: ShoppingLine, b: ShoppingLine) => a.ingredient.name.localeCompare(b.ingredient.name, "da");
  for (const section of SECTION_ORDER) {
    const lines = bySection.get(section);
    if (lines) list.sections.push({ section, lines: lines.sort(byName) });
  }
  list.pantry.sort(byName);
  list.covered.sort(byName);
  return list;
}

// --- Visning ---

const NUMBER = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 1 });
const FRACTIONS: Record<string, string> = { "0.25": "¼", "0.5": "½", "0.75": "¾" };

const UNIT_LABEL: Record<Unit, [string, string]> = {
  g: ["g", "g"],
  ml: ["ml", "ml"],
  stk: ["stk", "stk"],
  spsk: ["spsk", "spsk"],
  tsk: ["tsk", "tsk"],
  bundt: ["bundt", "bundter"],
};

const PLURAL: Record<string, string> = {
  bakke: "bakker",
  dåse: "dåser",
  "dåse (drænet)": "dåser (drænet)",
  pose: "poser",
  pakke: "pakker",
  bæger: "bægre",
  flaske: "flasker",
};

function roundAmount(amount: number, unit: Unit): number {
  switch (unit) {
    case "g":
    case "ml":
      return amount >= 100 ? Math.round(amount / 10) * 10 : Math.max(5, Math.round(amount / 5) * 5);
    case "stk":
    case "bundt":
      return amount >= 2 ? Math.round(amount * 2) / 2 : Math.max(0.25, Math.round(amount * 4) / 4);
    default:
      return Math.max(0.25, Math.round(amount * 4) / 4);
  }
}

/** "350 g", "1½ stk", "2 bundter". */
export function formatAmount(amount: number, unit: Unit): string {
  const rounded = roundAmount(amount, unit);
  const whole = Math.floor(rounded);
  const fraction = FRACTIONS[String(Math.round((rounded - whole) * 100) / 100)];
  const number = fraction ? `${whole || ""}${fraction}` : NUMBER.format(rounded);
  const [singular, plural] = UNIT_LABEL[unit];
  return `${number} ${rounded > 1 ? plural : singular}`;
}

/** "2 dåser" – eller mængden, hvis varen ikke har en pakkestørrelse. */
export function formatBuy(line: ShoppingLine): string {
  const { pack, unit } = line.ingredient;
  if (!pack || !line.packs) return formatAmount(Math.ceil(line.amount), unit);
  const label = line.packs === 1 ? pack.label : (PLURAL[pack.label] ?? pack.label);
  return `${line.packs} ${label}`;
}
