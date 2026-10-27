import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "./index.ts";
import { INGREDIENT_BY_ID } from "../ingredients.ts";
import { TAGS } from "../types.ts";
import { checkDish } from "../../diet.ts";

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
    }

    // Kosten: ingen hvidløg, kun lidt løg og gluten (se src/diet.ts).
    const result = checkDish(
      recipe.ingredients.map((i) => {
        const ingredient = INGREDIENT_BY_ID.get(i.id)!;
        return {
          name: ingredient.name,
          gramsPerPerson: ingredient.unit === "g" ? i.amount / recipe.servings : undefined,
        };
      }),
    );
    assert.ok(result.ok, result.issues.map((i) => i.message).join("\n"));
  });
}
