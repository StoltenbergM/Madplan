# Madplan

Lav-FODMAP madplan og indkøbsliste ud fra ugens tilbud i danske supermarkeder (Netto, Rema 1000 m.fl.).

## Status

- [x] FODMAP-regler og tjek af ingredienser/retter (`src/fodmap/`)
- [ ] Hentning af tilbud (én adapter pr. kæde)
- [ ] Matchning af tilbudsvarer til ingredienser
- [ ] Madplan via Claude, valideret af FODMAP-tjekket
- [ ] Indkøbsliste (samlede mængder, pakkestørrelser, afdelinger, priser)
- [ ] Web-app (Next.js, mobilvenlig)

## Kom i gang

Kræver Node 22.18+ (kører TypeScript direkte).

```sh
npm install
npm test
npm run tjek -- "2 fed hvidløg" "1 porre, kun den grønne del"
npm run tjek -- --alle "200 g champignon"   # alle FODMAP-grupper, ikke kun fruktaner
```

## FODMAP-reglerne

`src/fodmap/rules.ts` bygger på Monash Universitys data. Hvor en grænse er usikker, er reglen sat forsigtigt. Tjek tvivlstilfælde i Monash-appen.

- **low**: fint i normale portioner
- **limit**: kun lille portion. Flere i samme ret giver en advarsel
- **high**: undgå. Retten afvises, og der foreslås et alternativ
- **check**: læs ingredienslisten (bouillon, krydderiblandinger, pølser, saucer)

Profilen bestemmer, hvilke grupper der tæller. Standard er kun fruktaner (`FRUCTAN_PROFILE`).

## Tilbudsdata

Ingen af kæderne har et offentligt tilbuds-API. Brug til privat brug og i en lille delt kreds, og gem kun det, planen skal bruge.
