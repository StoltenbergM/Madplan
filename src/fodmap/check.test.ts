import { test } from "node:test";
import assert from "node:assert/strict";
import { checkIngredient, checkRecipe, FULL_PROFILE } from "./check.ts";

const status = (text: string) => checkIngredient(text).status;

test("løg og hvidløg er høje", () => {
  for (const t of ["2 fed hvidløg", "1 rødløg", "3 skalotteløg", "1 tsk løgpulver", "løgsalt", "Hvidløgspulver", "1 porre"]) {
    assert.equal(status(t), "high", t);
  }
});

test("længste match vinder for sikre alternativer", () => {
  for (const t of ["2 spsk hvidløgsolie", "1 bundt purløg", "asafoetida"]) {
    assert.equal(status(t), "low", t);
  }
});

test("grønne dele af porre og forårsløg er lave", () => {
  assert.equal(status("1 porre, kun den grønne del"), "low");
  assert.equal(status("3 forårsløg, kun grøn top"), "low");
  assert.equal(status("3 forårsløg"), "high");
});

test("hvede og rug er høje, glutenfri og speltsurdej er OK", () => {
  assert.equal(status("250 g spaghetti"), "high");
  assert.equal(status("400 g frisk pasta"), "high");
  assert.equal(status("2 skiver rugbrød"), "high");
  assert.equal(status("2 dl mel"), "high");
  assert.equal(status("250 g glutenfri pasta"), "low");
  assert.equal(status("200 g risnudler"), "low");
  assert.equal(status("2 skiver speltsurdejsbrød"), "low");
  assert.equal(status("glutenfrit brød"), "check");
});

test("'mel' matcher kun som helt ord", () => {
  assert.equal(status("½ cantaloupe melon"), "low");
  assert.equal(status("1 cantaloupemelon"), "low");
  assert.equal(status("1 vandmelon"), "high");
});

test("kendte lave varer er lave, ukendte markeres", () => {
  assert.equal(status("500 g kyllingebryst"), "low");
  assert.equal(status("4 dl basmatiris"), "low");
  assert.equal(status("1 dåse kokosmælk"), "low");
  assert.equal(status("quorn"), "unknown");
});

test("skjulte kilder kræver tjek af ingredienslisten", () => {
  assert.equal(status("1 bouillonterning"), "check");
  assert.equal(status("400 g krydret hakket oksekød"), "check");
  assert.equal(status("1 glas pesto"), "check");
});

test("profilen styrer hvilke FODMAP-grupper der tæller", () => {
  // Champignon er høj i polyoler, ikke fruktaner.
  const fructanOnly = checkIngredient("200 g champignon");
  assert.equal(fructanOnly.status, "low");
  assert.equal(fructanOnly.matches[0].outsideProfile, true);
  assert.equal(checkIngredient("200 g champignon", FULL_PROFILE).status, "high");
  assert.equal(checkIngredient("1 dåse kikærter, skyllede", FULL_PROFILE).status, "limit");
  assert.equal(checkIngredient("5 dl laktosefri mælk", FULL_PROFILE).status, "low");
  assert.equal(checkIngredient("5 dl letmælk", FULL_PROFILE).status, "high");
});

test("produktets ingrediensliste kan tjekkes", () => {
  const label = "Hvedemel, vand, rapsolie, salt, gær, løgpulver";
  const r = checkIngredient(label);
  assert.equal(r.status, "high");
  assert.deepEqual(r.matches.filter((m) => m.status === "high").map((m) => m.rule.id), ["hvede", "loeg"]);
});

test("checkRecipe afviser høje ingredienser og foreslår alternativ", () => {
  const r = checkRecipe(["500 g kyllingebryst", "2 fed hvidløg", "4 dl ris"]);
  assert.equal(r.ok, false);
  const error = r.issues.find((i) => i.severity === "error");
  assert.match(error?.swap ?? "", /hvidløgsolie/);
});

test("checkRecipe advarer når flere portionsbegrænsede ingredienser stables", () => {
  const r = checkRecipe(["1 rødbede", "100 g rosenkål", "500 g kartofler"]);
  assert.equal(r.ok, true);
  assert.ok(r.issues.some((i) => !i.ingredient && /lægges sammen/.test(i.message)));
});
