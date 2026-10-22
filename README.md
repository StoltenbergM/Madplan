# Madplan

Lav-FODMAP madplan og indkøbsliste ud fra ugens tilbud i danske supermarkeder (Netto, Rema 1000 m.fl.).

## Status

- [x] FODMAP-regler og tjek af ingredienser/retter (`src/fodmap/`)
- [x] Bibliotek med 48 lav-FODMAP retter (`src/data/recipes/`): kylling, kød, fisk, skaldyr og vegetar
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
- `npm test` tjekker hver ret: alle ingredienser findes, retten er lav-FODMAP i alle grupper (ikke kun fruktaner), højst én vare med portionsgrænse, og kikærter og linser holder sig under Monash' grænser.
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
