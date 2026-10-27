"use client";

import { useEffect, useState } from "react";
import { USE_OPTION_BY_KEY } from "@/data/groups.ts";
import { RECIPES } from "@/data/recipes/index.ts";
import type { Protein, Recipe } from "@/data/types.ts";
import type { PlanRequest, UseItem } from "@/plan/planner.ts";

export type UseEntry = {
  key: string;
  amount: number;
  /** Mængden er angivet i pakker (fx dåser) i stedet for g/ml/stk. */
  inPacks: boolean;
  source: "har" | "tilbud";
};

export type Settings = {
  days: number;
  people: number;
  use: UseEntry[];
  proteins: Protein[];
  maxMinutes: number | null;
};

export type Saved = {
  settings: Settings;
  planIds: string[];
  seed: number;
  startDate: string;
  checked: string[];
};

export const DEFAULT_SAVED: Saved = {
  settings: { days: 7, people: 2, use: [], proteins: [], maxMinutes: null },
  planIds: [],
  seed: 1,
  startDate: new Date().toISOString().slice(0, 10),
  checked: [],
};

export const RECIPE_BY_ID: ReadonlyMap<string, Recipe> = new Map(RECIPES.map((r) => [r.id, r]));

export const PROTEIN_LABEL: Record<Protein, string> = {
  kylling: "Kylling",
  kalkun: "Kalkun",
  okse: "Okse",
  svin: "Svin",
  lam: "Lam",
  vegetar: "Vegetar",
};

export function toUseItems(entries: UseEntry[]): UseItem[] {
  return entries.flatMap((e) => {
    const option = USE_OPTION_BY_KEY.get(e.key);
    if (!option || !(e.amount > 0)) return [];
    const amount = e.inPacks && option.pack ? e.amount * option.pack.size : e.amount;
    return [{ ids: option.ids, amount, source: e.source }];
  });
}

export function toRequest(settings: Settings, seed: number): PlanRequest {
  return {
    days: settings.days,
    people: settings.people,
    use: toUseItems(settings.use),
    seed,
    proteins: settings.proteins,
    maxMinutes: settings.maxMinutes ?? undefined,
  };
}

const STORAGE_KEY = "madplan:v1";

/** Gemmer appens tilstand i browseren, så planen er der næste gang. */
export function useSaved(): [Saved, (update: (s: Saved) => Saved) => void, boolean] {
  const [saved, setSaved] = useState<Saved>(DEFAULT_SAVED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_SAVED, ...JSON.parse(raw) } as Saved;
        // Retter og proteiner kan være fjernet siden sidst (fx fisk).
        parsed.planIds = parsed.planIds.filter((id) => RECIPE_BY_ID.has(id));
        parsed.settings.proteins = parsed.settings.proteins.filter((p) => p in PROTEIN_LABEL);
        setSaved(parsed);
      }
    } catch {
      // Privat browsing eller ødelagte data: start forfra.
    }
    setLoaded(true);
  }, []);

  const update = (fn: (s: Saved) => Saved) =>
    setSaved((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ikke kritisk – planen virker stadig i denne session.
      }
      return next;
    });

  return [saved, update, loaded];
}

const WEEKDAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export function dayLabel(startDate: string, index: number): string {
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + index);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}
