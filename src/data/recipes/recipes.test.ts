import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "./index.ts";
import { INGREDIENT_BY_ID } from "../ingredients.ts";
import { TAGS } from "../types.ts";
import { checkIngredient, checkRecipe, FULL_PROFILE } from "../../fodmap/check.ts";

// Monash: største lave portion pr. person for ingredienser med portionsgrænse.
const MAX_PER_SERVING: Record<string, number> = {
  "kikaerter-daase": 42,
  "linser-daase": 46,
};

test("opskrifternes id'er er unikke", () => {
  const ids = RECIPES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const recipe of RECIPES) {
  test(`opskrift: ${recipe.title}`, () => {
    assert.equal(recipe.servings, 4, "alle opskrifter skrives til 4 personer");
    assert.ok(recipe.minutes >= 5 && recipe.minutes <= 180, "minutes");
    assert.ok(recipe.steps.length >= 2, "mindst to trin");
    for (const tag of recipe.tags) assert.ok((TAGS as readonly string[]).includes(tag), `ukendt tag ${tag}`);

    const seen = new Set<string>();
    for (const item of recipe.ingredients) {
      assert.ok(INGREDIENT_BY_ID.has(item.id), `ukendt ingrediens ${item.id}`);
      assert.ok(item.amount > 0, `mængde for ${item.id}`);
      assert.ok(!seen.has(item.id), `${item.id} står to gange`);
      seen.add(item.id);
      const max = MAX_PER_SERVING[item.id];
      if (max) assert.ok(item.amount / recipe.servings <= max, `${item.id}: højst ${max} g pr. person`);
    }

    // Biblioteket skal være lav-FODMAP på tværs af alle grupper, ikke kun fruktaner.
    const names = recipe.ingredients.map((i) => INGREDIENT_BY_ID.get(i.id)!.name);
    const result = checkRecipe(names, FULL_PROFILE);
    assert.ok(result.ok, result.issues.map((i) => i.message).join("\n"));
    const limited = names.filter((n) => checkIngredient(n, FULL_PROFILE).status === "limit");
    assert.ok(limited.length <= 1, `højst én ingrediens med portionsgrænse: ${limited.join(", ")}`);
  });
}
