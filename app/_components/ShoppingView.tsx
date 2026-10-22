"use client";

import { useState } from "react";
import { formatAmount, formatBuy, type ShoppingLine, type ShoppingList } from "@/plan/shopping.ts";

function Line({ line, checked, onToggle, buy }: { line: ShoppingLine; checked: boolean; onToggle: () => void; buy: string }) {
  const { ingredient } = line;
  // Pakker vises til højre; den præcise mængde står under, så man kan vælge en anden pakkestørrelse.
  const total = line.packs ? `${formatAmount(line.amount, ingredient.unit)} i alt` : null;
  return (
    <li className={checked ? "line checked" : "line"}>
      <label>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="line-body">
          <span className="line-name">
            {ingredient.name}
            {line.onOffer && <span className="badge offer">Tilbud</span>}
            {line.checkLabel && <span className="badge check">Tjek etiket</span>}
          </span>
          {total && <span className="muted small">{total}</span>}
        </span>
        <span className="line-buy">{buy}</span>
      </label>
    </li>
  );
}

function asText(list: ShoppingList): string {
  const parts = ["Indkøbsliste"];
  for (const { section, lines } of list.sections) {
    parts.push("", section, ...lines.map((l) => `- ${formatBuy(l)} ${l.ingredient.name}`));
  }
  if (list.pantry.length) {
    parts.push("", "Tjek at du har", ...list.pantry.map((l) => `- ${l.ingredient.name} (${formatAmount(l.amount, l.ingredient.unit)})`));
  }
  return parts.join("\n");
}

export function ShoppingView(props: {
  list: ShoppingList;
  hasPlan: boolean;
  checked: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onNew: () => void;
}) {
  const { list, hasPlan, checked, onToggle, onReset, onNew } = props;
  const [copied, setCopied] = useState(false);

  if (!hasPlan) {
    return (
      <div className="stack empty">
        <h1>Ingen indkøbsliste endnu</h1>
        <p className="muted">Listen laves ud fra din madplan.</p>
        <button className="primary" onClick={onNew}>
          Lav en madplan
        </button>
      </div>
    );
  }

  const toBuy = list.sections.flatMap((s) => s.lines);
  const left = toBuy.filter((l) => !checked.includes(l.ingredient.id)).length;

  async function share() {
    const text = asText(list);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Indkøbsliste", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Brugeren lukkede delingsdialogen.
    }
  }

  return (
    <div className="stack">
      <header className="page-head row">
        <div>
          <h1>Indkøb</h1>
          <p className="muted">{left === 0 ? "Alt er i kurven 🎉" : `${left} af ${toBuy.length} varer tilbage`}</p>
        </div>
        <button className="secondary" onClick={share}>
          {copied ? "Kopieret" : "Del liste"}
        </button>
      </header>

      {list.sections.map(({ section, lines }) => (
        <section key={section} className="card">
          <h2>{section}</h2>
          <ul className="lines">
            {lines.map((line) => (
              <Line
                key={line.ingredient.id}
                line={line}
                buy={formatBuy(line)}
                checked={checked.includes(line.ingredient.id)}
                onToggle={() => onToggle(line.ingredient.id)}
              />
            ))}
          </ul>
        </section>
      ))}

      {list.pantry.length > 0 && (
        <details className="card">
          <summary>
            <h2>Tjek at du har</h2>
            <span className="muted small">{list.pantry.length} ting fra skabet – olie, krydderier m.m.</span>
          </summary>
          <ul className="lines">
            {list.pantry.map((line) => (
              <Line
                key={line.ingredient.id}
                line={line}
                buy={formatAmount(line.amount, line.ingredient.unit)}
                checked={checked.includes(line.ingredient.id)}
                onToggle={() => onToggle(line.ingredient.id)}
              />
            ))}
          </ul>
        </details>
      )}

      {list.covered.length > 0 && (
        <section className="card">
          <h2>Det har du allerede</h2>
          <ul className="plain muted small">
            {list.covered.map((line) => (
              <li key={line.ingredient.id}>{line.ingredient.name}</li>
            ))}
          </ul>
        </section>
      )}

      {checked.length > 0 && (
        <button className="ghost" onClick={onReset}>
          Fjern alle flueben
        </button>
      )}
    </div>
  );
}
