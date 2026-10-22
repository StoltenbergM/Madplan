import type { Recipe } from "../types.ts";
import { RECIPES as kylling } from "./kylling.ts";
import { RECIPES as koed } from "./koed.ts";
import { RECIPES as fiskVegetar } from "./fisk-vegetar.ts";

export const RECIPES: Recipe[] = [...kylling, ...koed, ...fiskVegetar];
