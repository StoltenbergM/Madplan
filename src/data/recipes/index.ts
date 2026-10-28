import type { Recipe } from "../types.ts";
import { RECIPES as kylling } from "./kylling.ts";
import { RECIPES as koed } from "./koed.ts";
import { RECIPES as vegetar } from "./vegetar.ts";
import { RECIPES as egne } from "./egne.ts";

export const RECIPES: Recipe[] = [...kylling, ...koed, ...vegetar, ...egne.map((r) => ({ ...r, mine: true }))];
