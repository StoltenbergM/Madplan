import { test } from "node:test";
import assert from "node:assert/strict";
import type { Protein, Recipe } from "../data/types.ts";
import { planWeek, spreadProteins, swapDay, type UseItem } from "./planner.ts";
import { buildShoppingList, formatAmount, formatBuy, packsNeeded } from "./shopping.ts";

function recipe(id: string, protein: Protein, ingredients: [string, number][]): Recipe {
  return {
    id,
    title: id,
    servings: 4,
    minutes: 30,
    protein,
    tags: [],
    ingredients: ingredients.map(([id, amount]) => ({ id, amount })),
    steps: ["a", "b"],
  };
}

const LIBRARY: Recipe[] = [
  recipe("kylling-tomat", "kylling", [["kyllingebryst", 600], ["hakkede-tomater", 800], ["jasminris", 300]]),
  recipe("kylling-karry", "kylling", [["kyllingeoverlaar", 700], ["kokosmaelk", 400], ["basmatiris", 300]]),
  recipe("kylling-ovn", "kylling", [["kyllingebryst", 700], ["kartofler", 1000], ["olivenolie", 2]]),
  recipe("kødsovs", "okse", [["hakket-oksekoed", 500], ["hakkede-tomater", 800], ["glutenfri-pasta", 400]]),
  recipe("lam", "lam", [["lammekoteletter", 600], ["kartofler", 1000], ["dild", 1]]),
  recipe("mørbrad", "svin", [["svinemoerbrad", 600], ["madlavningsfloede", 250], ["jasminris", 300]]),
  recipe("shakshuka", "vegetar", [["aeg", 8], ["hakkede-tomater", 800], ["peberfrugt", 2]]),
  recipe("kalkun", "kalkun", [["kalkunbryst", 600], ["kartofler", 1000], ["persille", 1]]),
];

const KYLLING = ["kyllingebryst", "kyllingeoverlaar", "kyllingelaar", "hakket-kylling"];

test("samme seed giver samme plan, andet seed kan give en anden", () => {
  const req = { days: 5, people: 2, use: [], seed: 42 };
  const a = planWeek(req, LIBRARY).recipes.map((r) => r.id);
  assert.deepEqual(planWeek(req, LIBRARY).recipes.map((r) => r.id), a);
  assert.equal(new Set(a).size, 5, "ingen gentagelser når der er nok retter");
});

test("planen bruger det man har: 1 kg kylling og hakkede tomater til 2 personer", () => {
  const use: UseItem[] = [
    { ids: KYLLING, amount: 1000, source: "har" },
    { ids: ["hakkede-tomater"], amount: 800, source: "tilbud" },
  ];
  const plan = planWeek({ days: 7, people: 2, use, seed: 1 }, LIBRARY);
  const [kylling, tomater] = plan.usage;
  // Tre kyllingeretter à 300–350 g til to personer bruger ca. 1 kg.
  assert.ok(kylling.used >= 900, `kylling brugt: ${kylling.used}`);
  assert.ok(tomater.used >= 800, `tomater brugt: ${tomater.used}`);
  assert.equal(plan.recipes.length, 7);
});

test("samme protein lægges ikke to dage i træk, hvis det kan undgås", () => {
  const [a, b, c, d] = LIBRARY;
  const ordered = spreadProteins([a, b, c, d]); // tre kylling, en okse
  const proteins = ordered.map((r) => r.protein);
  assert.equal(proteins.filter((p) => p === "kylling").length, 3);
  assert.deepEqual(proteins.slice(0, 3), ["kylling", "okse", "kylling"]);
});

test("filtre på protein og tid respekteres", () => {
  const plan = planWeek({ days: 3, people: 2, use: [], seed: 3, proteins: ["lam", "vegetar"] }, LIBRARY);
  assert.ok(plan.recipes.every((r) => r.protein === "lam" || r.protein === "vegetar"));
});

test("byt en dag giver en ret der ikke allerede er i planen", () => {
  const req = { days: 4, people: 2, use: [], seed: 7 };
  const plan = planWeek(req, LIBRARY).recipes;
  const swapped = swapDay(plan, 1, req, LIBRARY);
  assert.notEqual(swapped[1].id, plan[1].id);
  assert.equal(new Set(swapped.map((r) => r.id)).size, 4);
  assert.deepEqual([swapped[0], swapped[2], swapped[3]], [plan[0], plan[2], plan[3]]);
});

test("indkøbslisten lægger sammen, skalerer og runder op til pakker", () => {
  const recipes = [LIBRARY[0], LIBRARY[3]]; // 800 + 800 g hakkede tomater til 4 → 800 g til 2
  const list = buildShoppingList(recipes, 2, []);
  const tomater = list.sections.flatMap((s) => s.lines).find((l) => l.ingredient.id === "hakkede-tomater")!;
  assert.equal(tomater.amount, 800);
  assert.equal(tomater.packs, 2);
  assert.equal(formatBuy(tomater), "2 dåser");
  assert.deepEqual(tomater.recipes, ["kylling-tomat", "kødsovs"]);
});

test("det man har trækkes fra, og en lille mangel tæller som dækket", () => {
  const recipes = [LIBRARY[0], LIBRARY[2]]; // 300 + 350 g kyllingebryst til 2
  const list = buildShoppingList(recipes, 2, [{ ids: KYLLING, amount: 600, source: "har" }]);
  assert.ok(list.covered.some((l) => l.ingredient.id === "kyllingebryst"), "50 g mangler – under 15 %");
  assert.ok(!list.sections.flatMap((s) => s.lines).some((l) => l.ingredient.id === "kyllingebryst"));
});

test("tilbudsvarer markeres, krydderier står for sig", () => {
  const list = buildShoppingList([LIBRARY[2]], 2, [{ ids: ["kartofler"], amount: 1000, source: "tilbud" }]);
  const kartofler = list.sections.flatMap((s) => s.lines).find((l) => l.ingredient.id === "kartofler")!;
  assert.equal(kartofler.onOffer, true);
  assert.deepEqual(list.pantry.map((l) => l.ingredient.id), ["olivenolie"]);
});

test("formatering af mængder", () => {
  assert.equal(formatAmount(347, "g"), "350 g");
  assert.equal(formatAmount(0.5, "stk"), "½ stk");
  assert.equal(formatAmount(1.5, "spsk"), "1½ spsk");
  assert.equal(formatAmount(2, "bundt"), "2 bundter");
  assert.equal(packsNeeded(410, 400), 1);
  assert.equal(packsNeeded(500, 400), 2);
});

test("kun mine opskrifter", () => {
  const mine = { ...LIBRARY[4], id: "min-ret", mine: true };
  const plan = planWeek({ days: 3, people: 2, use: [], seed: 5, onlyMine: true }, [...LIBRARY, mine]);
  assert.ok(plan.recipes.length === 3 && plan.recipes.every((r) => r.id === "min-ret"));
});
