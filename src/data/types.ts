export type Section =
  | "Frugt & grønt"
  | "Kød & fisk"
  | "Mejeri & æg"
  | "Brød & kolonial"
  | "Dåser & glas"
  | "Frost"
  | "Krydderier & olie";

export type Unit = "g" | "ml" | "stk" | "spsk" | "tsk" | "bundt";

export type Ingredient = {
  id: string;
  /** Navnet FODMAP-tjekket kører på, så det skal være præcist ("porre (kun grønne del)"). */
  name: string;
  section: Section;
  unit: Unit;
  /** Typisk pakkestørrelse i butikken, i samme enhed som `unit`. */
  pack?: { size: number; label: string };
  /** Noget de fleste har i skabet (salt, olie, krydderier) – vises separat. */
  pantry?: boolean;
};

export type Protein = "kylling" | "kalkun" | "okse" | "svin" | "lam" | "vegetar";

export const TAGS = [
  "hurtig", "ovnret", "gryderet", "suppe", "pasta", "ris", "wok", "salat", "tacos", "burger",
  "karry", "klassiker", "børnevenlig", "kan fryses", "rester",
] as const;

export type Tag = (typeof TAGS)[number];

export type RecipeIngredient = {
  id: string;
  /** Mængde til `Recipe.servings` personer, i ingrediensens enhed. */
  amount: number;
  note?: string;
};

export type Recipe = {
  id: string;
  title: string;
  servings: number;
  minutes: number;
  protein: Protein;
  tags: Tag[];
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Hvor opskriften kommer fra, fx "juliebruun.com". */
  source?: string;
  /** Fra brugerens egen opskriftssamling. */
  mine?: boolean;
};
