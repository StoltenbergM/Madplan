"use client";

import { useState } from "react";
import { INGREDIENT_BY_ID } from "@/data/ingredients.ts";
import type { Recipe } from "@/data/types.ts";
import { amountUsed, scale, type UseItem } from "@/plan/planner.ts";
import { formatAmount } from "@/plan/shopping.ts";
import { USE_OPTIONS } from "@/data/groups.ts";
import { dayLabel, PROTEIN_LABEL, type Settings } from "./state";

function RecipeDetails({ recipe, people }: { recipe: Recipe; people: number }) {
  const factor = scale(recipe, people);
  return (
    <div className="recipe">
      <h3>Ingredienser til {people}</h3>
      <ul className="ingredients">
        {recipe.ingredients.map((item) => {
          const ingredient = INGREDIENT_BY_ID.get(item.id)!;
          return (
            <li key={item.id}>
              <span className="amount">{formatAmount(item.amount * factor, ingredient.unit)}</span>
              <span>
                {ingredient.name}
                {item.note && <span className="muted">, {item.note}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <h3>Sådan gør du</h3>
      <ol className="steps">
        {recipe.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {people !== recipe.servings && (
        <p className="muted small">Mængderne er omregnet fra en opskrift til {recipe.servings} personer.</p>
      )}
    </div>
  );
}

function labelFor(item: UseItem): string {
  return USE_OPTIONS.find((o) => o.ids.join() === item.ids.join())?.label ?? item.ids.join(", ");
}

export function PlanView(props: {
  plan: Recipe[];
  settings: Settings;
  startDate: string;
  useItems: UseItem[];
  onSwap: (day: number) => void;
  onReshuffle: () => void;
  onNew: () => void;
}) {
  const { plan, settings, startDate, useItems, onSwap, onReshuffle, onNew } = props;
  const [open, setOpen] = useState<string | null>(null);

  if (!plan.length) {
    return (
      <div className="stack empty">
        <h1>Ingen madplan endnu</h1>
        <p className="muted">Vælg antal dage og personer, så finder appen retterne.</p>
        <button className="primary" onClick={onNew}>
          Lav en madplan
        </button>
      </div>
    );
  }

  const unit = (item: UseItem) => INGREDIENT_BY_ID.get(item.ids[0])!.unit;

  return (
    <div className="stack">
      <header className="page-head row">
        <div>
          <h1>Madplan</h1>
          <p className="muted">
            {plan.length} {plan.length === 1 ? "dag" : "dage"} · {settings.people}{" "}
            {settings.people === 1 ? "person" : "personer"}
          </p>
        </div>
        <button className="secondary" onClick={onReshuffle}>
          Bland igen
        </button>
      </header>

      {useItems.length > 0 && (
        <section className="card usage">
          <h2>Dine varer</h2>
          <ul>
            {useItems.map((item, i) => {
              const used = plan.reduce((sum, r) => sum + amountUsed(r, item, settings.people), 0);
              const pct = Math.min(100, Math.round((used / item.amount) * 100));
              return (
                <li key={i}>
                  <div className="usage-text">
                    <span>{labelFor(item)}</span>
                    <span className="muted small">
                      bruger {formatAmount(used, unit(item))} af {formatAmount(item.amount, unit(item))}
                    </span>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ol className="days">
        {plan.map((recipe, day) => {
          const isOpen = open === `${day}:${recipe.id}`;
          return (
            <li key={`${day}:${recipe.id}`} className="card day">
              <p className="day-label">{dayLabel(startDate, day)}</p>
              <h2 className="day-title">{recipe.title}</h2>
              <p className="muted small">
                {recipe.minutes} min · {PROTEIN_LABEL[recipe.protein]}
                {recipe.tags.length > 0 && ` · ${recipe.tags.join(", ")}`}
              </p>
              <div className="day-actions">
                <button className="secondary" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : `${day}:${recipe.id}`)}>
                  {isOpen ? "Skjul opskrift" : "Se opskrift"}
                </button>
                <button className="ghost" onClick={() => onSwap(day)}>
                  Byt ret
                </button>
              </div>
              {isOpen && <RecipeDetails recipe={recipe} people={settings.people} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
