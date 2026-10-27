import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDish } from "./diet.ts";

test("hvidløg er aldrig tilladt, hvidløgsolie er fin", () => {
  assert.equal(checkDish([{ name: "hvidløg", gramsPerPerson: 1 }]).ok, false);
  assert.equal(checkDish([{ name: "hvidløgsolie" }]).ok, true);
});

test("lidt løg er fint, meget løg er ikke", () => {
  assert.equal(checkDish([{ name: "løg", gramsPerPerson: 20 }]).ok, true);
  const tooMuch = checkDish([{ name: "løg", gramsPerPerson: 15 }, { name: "rødløg", gramsPerPerson: 15 }]);
  assert.equal(tooMuch.ok, false);
  assert.match(tooMuch.issues.map((i) => i.message).join(), /For meget løg: 30 g/);
});

test("lidt mel eller rasp er fint, hvedepasta som tilbehør er ikke", () => {
  assert.equal(checkDish([{ name: "hvedemel", gramsPerPerson: 10 }]).ok, true);
  assert.equal(checkDish([{ name: "spaghetti", gramsPerPerson: 100 }]).ok, false);
  assert.equal(checkDish([{ name: "glutenfri pasta", gramsPerPerson: 100 }]).ok, true);
});

test("løg og gluten kræver en mængde i gram", () => {
  assert.equal(checkDish([{ name: "løg" }]).ok, false);
});

test("andre FODMAP'er er tilladt", () => {
  const r = checkDish([
    { name: "letmælk" },
    { name: "champignon" },
    { name: "blomkål" },
    { name: "kidneybønner (dåse)" },
    { name: "æble" },
  ]);
  assert.deepEqual(r.issues, []);
});

test("højst to fruktankilder i samme ret", () => {
  const r = checkDish([
    { name: "løg", gramsPerPerson: 10 },
    { name: "rasp", gramsPerPerson: 5 },
    { name: "frosne ærter" },
  ]);
  assert.equal(r.ok, false);
});

test("varer der kan indeholde hvidløg giver en advarsel, ikke en fejl", () => {
  const r = checkDish([{ name: "bouillon uden hvidløg" }, { name: "karrypulver" }]);
  assert.equal(r.ok, true);
  assert.equal(r.issues.filter((i) => i.severity === "warning").length, 2);
});
