"use client";

import { useEffect, useMemo, useState } from "react";
import { RECIPES } from "@/data/recipes/index.ts";
import { planWeek, swapDay } from "@/plan/planner.ts";
import { buildShoppingList } from "@/plan/shopping.ts";
import { PlanView } from "./PlanView";
import { Setup } from "./Setup";
import { ShoppingView } from "./ShoppingView";
import { RECIPE_BY_ID, toRequest, toUseItems, useSaved, type Settings } from "./state";

type Tab = "ny" | "plan" | "indkob";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "ny", label: "Ny plan", icon: "✦" },
  { id: "plan", label: "Madplan", icon: "▦" },
  { id: "indkob", label: "Indkøb", icon: "✓" },
];

export function MadplanApp() {
  const [saved, update, loaded] = useSaved();
  const [tab, setTab] = useState<Tab | null>(null);

  useEffect(() => {
    if (loaded && tab === null) setTab(saved.planIds.length ? "plan" : "ny");
  }, [loaded, tab, saved.planIds.length]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const plan = useMemo(() => saved.planIds.map((id) => RECIPE_BY_ID.get(id)!).filter(Boolean), [saved.planIds]);
  const useItems = useMemo(() => toUseItems(saved.settings.use), [saved.settings.use]);
  const shopping = useMemo(
    () => buildShoppingList(plan, saved.settings.people, useItems),
    [plan, saved.settings.people, useItems],
  );

  function makePlan(settings: Settings) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const { recipes } = planWeek(toRequest(settings, seed), RECIPES);
    update(() => ({
      settings,
      seed,
      planIds: recipes.map((r) => r.id),
      startDate: new Date().toISOString().slice(0, 10),
      checked: [],
    }));
    setTab("plan");
    window.scrollTo(0, 0);
  }

  function swap(day: number) {
    update((s) => ({
      ...s,
      planIds: swapDay(plan, day, toRequest(s.settings, Math.floor(Math.random() * 2 ** 31)), RECIPES).map((r) => r.id),
    }));
  }

  function toggleChecked(id: string) {
    update((s) => ({
      ...s,
      checked: s.checked.includes(id) ? s.checked.filter((c) => c !== id) : [...s.checked, id],
    }));
  }

  if (!loaded || tab === null) return <main className="app" />;

  return (
    <>
      <main className="app">
        {tab === "ny" && <Setup initial={saved.settings} onSubmit={makePlan} />}
        {tab === "plan" && (
          <PlanView
            plan={plan}
            settings={saved.settings}
            startDate={saved.startDate}
            useItems={useItems}
            onSwap={swap}
            onReshuffle={() => makePlan(saved.settings)}
            onNew={() => setTab("ny")}
          />
        )}
        {tab === "indkob" && (
          <ShoppingView
            list={shopping}
            hasPlan={plan.length > 0}
            checked={saved.checked}
            onToggle={toggleChecked}
            onReset={() => update((s) => ({ ...s, checked: [] }))}
            onNew={() => setTab("ny")}
          />
        )}
      </main>
      <nav className="tabbar" aria-label="Navigation">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "active" : ""}
            aria-current={t.id === tab ? "page" : undefined}
            onClick={() => {
              setTab(t.id);
              window.scrollTo(0, 0);
            }}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
