"use client";

import { useMemo, useState } from "react";
import { USE_OPTIONS, USE_OPTION_BY_KEY } from "@/data/groups.ts";
import { RECIPES } from "@/data/recipes/index.ts";
import type { Protein } from "@/data/types.ts";
import { PROTEIN_LABEL, type Settings, type UseEntry } from "./state";

const PROTEINS = Object.keys(PROTEIN_LABEL) as Protein[];
const TIMES: { label: string; value: number | null }[] = [
  { label: "Alle", value: null },
  { label: "Under 30 min", value: 30 },
  { label: "Under 45 min", value: 45 },
];

function Stepper(props: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { label, value, min, max, onChange } = props;
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" aria-label={`Færre ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`Flere ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function UseRow(props: { entry: UseEntry; onChange: (e: UseEntry) => void; onRemove: () => void }) {
  const { entry, onChange, onRemove } = props;
  const option = USE_OPTION_BY_KEY.get(entry.key);
  if (!option) return null;
  return (
    <li className="use-row">
      <div className="use-row-head">
        <span className="use-row-name">{option.label}</span>
        <button type="button" className="icon-button" aria-label={`Fjern ${option.label}`} onClick={onRemove}>
          ×
        </button>
      </div>
      <div className="use-row-controls">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label="Mængde"
          value={entry.amount || ""}
          onChange={(e) => onChange({ ...entry, amount: Number(e.target.value) })}
        />
        <select
          aria-label="Enhed"
          value={entry.inPacks ? "pack" : "unit"}
          onChange={(e) => onChange({ ...entry, inPacks: e.target.value === "pack" })}
        >
          <option value="unit">{option.unit}</option>
          {option.pack && (
            <option value="pack">
              {option.pack.label} à {option.pack.size} {option.unit}
            </option>
          )}
        </select>
        <div className="segmented" role="group" aria-label="Har eller tilbud">
          {(["har", "tilbud"] as const).map((source) => (
            <button
              key={source}
              type="button"
              aria-pressed={entry.source === source}
              onClick={() => onChange({ ...entry, source })}
            >
              {source === "har" ? "Har" : "Tilbud"}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}

export function Setup({ initial, onSubmit }: { initial: Settings; onSubmit: (s: Settings) => void }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [query, setQuery] = useState("");
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(settings.use.map((u) => u.key));
    return USE_OPTIONS.filter((o) => !taken.has(o.key) && o.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, settings.use]);

  function addUse(key: string) {
    const option = USE_OPTION_BY_KEY.get(key)!;
    set({ use: [...settings.use, { key, amount: 1, inPacks: Boolean(option.pack), source: "har" }] });
    setQuery("");
  }

  function toggleProtein(p: Protein) {
    set({ proteins: settings.proteins.includes(p) ? settings.proteins.filter((x) => x !== p) : [...settings.proteins, p] });
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(settings);
      }}
    >
      <header className="page-head">
        <h1>Ny madplan</h1>
        <p className="muted">{RECIPES.length} lav-FODMAP retter – uden løg, hvidløg, hvede og laktose.</p>
      </header>

      <section className="card">
        <Stepper label="Dage" value={settings.days} min={1} max={7} onChange={(days) => set({ days })} />
        <Stepper label="Personer" value={settings.people} min={1} max={8} onChange={(people) => set({ people })} />
      </section>

      <section className="card">
        <h2>Brug disse varer</h2>
        <p className="muted small">
          Valgfrit. Skriv hvad du har i køleskabet eller har set på tilbud – så bygges planen omkring det. Uden varer
          får du en tilfældig plan.
        </p>
        {settings.use.length > 0 && (
          <ul className="use-list">
            {settings.use.map((entry, i) => (
              <UseRow
                key={entry.key}
                entry={entry}
                onChange={(e) => set({ use: settings.use.map((u, j) => (j === i ? e : u)) })}
                onRemove={() => set({ use: settings.use.filter((_, j) => j !== i) })}
              />
            ))}
          </ul>
        )}
        <div className="search">
          <input
            type="search"
            placeholder="Fx kylling, hakkede tomater …"
            aria-label="Tilføj vare"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) {
                e.preventDefault();
                addUse(suggestions[0].key);
              }
            }}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((o) => (
                <li key={o.key}>
                  <button type="button" onClick={() => addUse(o.key)}>
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && suggestions.length === 0 && (
            <p className="muted small">Ingen retter bruger “{query.trim()}”.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Protein</h2>
        <div className="chips">
          <button type="button" aria-pressed={settings.proteins.length === 0} onClick={() => set({ proteins: [] })}>
            Alle
          </button>
          {PROTEINS.map((p) => (
            <button key={p} type="button" aria-pressed={settings.proteins.includes(p)} onClick={() => toggleProtein(p)}>
              {PROTEIN_LABEL[p]}
            </button>
          ))}
        </div>
        <h2>Tid</h2>
        <div className="chips">
          {TIMES.map((t) => (
            <button key={t.label} type="button" aria-pressed={settings.maxMinutes === t.value} onClick={() => set({ maxMinutes: t.value })}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <button type="submit" className="primary">
        Lav madplan
      </button>
    </form>
  );
}
