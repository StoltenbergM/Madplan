# Madplan

Madplan og indkøbsliste uden fruktaner, evt. ud fra ugens tilbud i danske supermarkeder (Netto, Rema 1000 m.fl.).

## Kosten

Appen undgår **fruktaner**. Andre FODMAP'er (laktose, bønner, svampe osv.) er fine. Reglerne står i `src/diet.ts`:

- **Ingen hvidløg.** Hvidløgsolie er fin.
- **Lidt løg:** højst 25 g pr. person pr. ret.
- **Lidt gluten** (hvede, rug, byg): højst 15 g pr. person pr. ret, fx mel til en sovs eller rasp. Tilbehøret er glutenfrit.
- Højst to fruktankilder i samme ret.
- Ingen fisk eller skaldyr.

## Status

- [x] FODMAP-regler og tjek af ingredienser/retter (`src/fodmap/`)
- [x] Bibliotek med retter uden fruktaner (`src/data/recipes/`): kylling, kalkun, okse, svin, lam og vegetar
- [x] Planlægning uden API (`src/plan/`): tilfældig plan, eller bygget op om varer man har eller har set på tilbud
- [x] Indkøbsliste: samlede mængder, rundet op til pakker, delt op i afdelinger, med tilbud og "tjek etiket"
- [x] Web-app der kan installeres på telefonen (Next.js, `app/`) og virker offline
- [ ] Hentning af tilbud fra kæderne (kræver netværksadgang)
- [ ] Hosting (fx Vercel)

## Kom i gang

Kræver Node 22.18+ (kører TypeScript direkte).

```sh
npm install
npm run dev        # http://localhost:3000
npm test
npm run tjek -- "2 fed hvidløg" "1 porre, kun den grønne del"
```

## Sådan virker planen

- Retterne står i `src/data/recipes/*.ts` og bruger kun varer fra `src/data/ingredients.ts`.
- `npm test` tjekker hver ret: alle ingredienser findes, og retten overholder kostreglerne i `src/diet.ts`.
- Varer man **har**, trækkes fra indkøbslisten. Varer på **tilbud** foretrækkes, men købes stadig.
- Alt gemmes i browseren på telefonen. Der er ingen server og ingen konto.

## FODMAP-reglerne

`src/fodmap/rules.ts` bygger på Monash Universitys data. Hvor en grænse er usikker, er reglen sat forsigtigt. Tjek tvivlstilfælde i Monash-appen.

- **low**: fint i normale portioner
- **limit**: kun lille portion. Flere i samme ret giver en advarsel
- **high**: undgå. Retten afvises, og der foreslås et alternativ
- **check**: læs ingredienslisten (bouillon, krydderiblandinger, pølser, saucer)

Profilen bestemmer, hvilke grupper der tæller. Standard er kun fruktaner (`FRUCTAN_PROFILE`).

## Tilbudsdata

Ingen af kæderne har et offentligt tilbuds-API. Brug til privat brug og i en lille delt kreds, og gem kun det, planen skal bruge.
