import { INGREDIENTS } from "./ingredients.ts";
import type { Unit } from "./types.ts";

/** Det man kan vælge under "Brug disse varer": samlegrupper og enkeltvarer. */
export type UseOption = {
  key: string;
  label: string;
  ids: string[];
  unit: Unit;
  pack?: { size: number; label: string };
};

const GROUPS: UseOption[] = [
  {
    key: "gruppe:kylling",
    label: "Kylling (bryst, lår eller hakket)",
    ids: ["kyllingebryst", "kyllingeoverlaar", "kyllingelaar", "hakket-kylling"],
    unit: "g",
    pack: { size: 500, label: "bakke" },
  },
  {
    key: "gruppe:hakket",
    label: "Hakket kød (okse eller svin)",
    ids: ["hakket-oksekoed", "hakket-svinekoed"],
    unit: "g",
    pack: { size: 500, label: "bakke" },
  },
  {
    key: "gruppe:hvid-fisk",
    label: "Hvid fisk (torsk, sej eller rødspætte)",
    ids: ["torsk", "sej", "roedspaette"],
    unit: "g",
    pack: { size: 400, label: "pakke" },
  },
  {
    key: "gruppe:ris",
    label: "Ris (jasmin eller basmati)",
    ids: ["jasminris", "basmatiris"],
    unit: "g",
    pack: { size: 1000, label: "pose" },
  },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const USE_OPTIONS: UseOption[] = [
  ...GROUPS,
  ...INGREDIENTS.filter((i) => !i.pantry)
    .map((i) => ({ key: i.id, label: capitalize(i.name), ids: [i.id], unit: i.unit, pack: i.pack }))
    .sort((a, b) => a.label.localeCompare(b.label, "da")),
];

export const USE_OPTION_BY_KEY: ReadonlyMap<string, UseOption> = new Map(USE_OPTIONS.map((o) => [o.key, o]));
