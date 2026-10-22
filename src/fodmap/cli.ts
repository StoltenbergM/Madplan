// Prøv reglerne af fra terminalen:
//   npm run tjek -- "2 fed hvidløg" "1 porre, kun den grønne del"
//   npm run tjek -- --alle "200 g champignon"   (alle FODMAP-grupper)

import { checkRecipe, checkIngredient, FRUCTAN_PROFILE, FULL_PROFILE } from "./check.ts";

const args = process.argv.slice(2);
const profile = args.includes("--alle") ? FULL_PROFILE : FRUCTAN_PROFILE;
const ingredients = args.filter((a) => a !== "--alle");

if (!ingredients.length) {
  console.log('Brug: npm run tjek -- [--alle] "ingrediens" ...');
  process.exit(1);
}

const ICON = { low: "✅", limit: "🟡", check: "🔍", high: "❌", unknown: "❔" } as const;

for (const text of ingredients) {
  const r = checkIngredient(text, profile);
  const names = r.matches.map((m) => m.rule.name + (m.outsideProfile ? " (uden for profil)" : "")).join(", ");
  console.log(`${ICON[r.status]} ${text}${names ? `  — ${names}` : ""}`);
}

const recipe = checkRecipe(ingredients, profile);
console.log(recipe.ok ? "\nRetten er OK." : "\nRetten er IKKE lav-FODMAP:");
for (const i of recipe.issues) {
  console.log(`  ${i.severity === "error" ? "❌" : "⚠️ "} ${i.message}${i.swap ? ` → Byt med: ${i.swap}` : ""}`);
}
