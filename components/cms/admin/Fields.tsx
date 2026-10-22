"use client";

import { useId, useRef, type ReactNode } from "react";

export function Field({ label, value, onChange, type = "text", hint, maxLength = 2000 }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; maxLength?: number;
}) {
  const hintId = useId();
  return <div className="min-w-0">
    <label className="cms-label">{label}
      <input className="cms-field" type={type} value={value} maxLength={maxLength} aria-describedby={hint ? hintId : undefined} onChange={(e) => onChange(e.target.value)} />
    </label>
    {hint && <p id={hintId} className="mt-1 text-xs text-muted">{hint}</p>}
  </div>;
}
export function Select<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[];
}) {
  const id = useId();
  return <div className="min-w-0"><label className="cms-label" htmlFor={id}>{label}</label><select id={id} className="cms-field" value={value} onChange={(e) => {
    const selected = options.find((option) => option.value === e.target.value);
    if (selected) onChange(selected.value);
  }}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
export function TextEditor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  function insert(before: string, after = "") {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = value.slice(start, end) || "votre texte";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    if (next.length > 30000) return;
    onChange(next);
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }
  return <div className="min-w-0">
    <label className="cms-label" htmlFor={id}>{label}</label>
    <textarea id={id} ref={ref} className="cms-field min-h-36" value={value} rows={6} maxLength={30000} onChange={(e) => onChange(e.target.value)} />
    <div className="mt-2 flex flex-wrap gap-2" aria-label={`Mise en forme : ${label}`}>
      <button className="cms-action" type="button" onClick={() => insert("**", "**")}><strong>Gras</strong></button>
      <button className="cms-action" type="button" onClick={() => insert("*", "*")}><em>Italique</em></button>
      <button className="cms-action" type="button" onClick={() => insert("\n\n### ")}>Sous-titre</button>
      <button className="cms-action" type="button" onClick={() => insert("\n- ")}>Liste</button>
      <button className="cms-action" type="button" onClick={() => insert("[", "](/contact)")}>Lien</button>
    </div>
    <p className="mt-2 text-xs text-muted">Texte sans hauteur fixe ; les paragraphes s’adaptent au contenu. Mise en forme Markdown, sans HTML. {value.length.toLocaleString("fr-FR")} / 30 000 caractères.</p>
  </div>;
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  if (item === undefined) return items;
  copy.splice(to, 0, item);
  return copy;
}
export function ListEditor<T>({ label, items, onChange, create, render, max = 100 }: {
  label: string; items: T[]; onChange: (items: T[]) => void; create: () => T;
  render: (item: T, update: (item: T) => void, index: number) => ReactNode; max?: number;
}) {
  const dragging = useRef<number | null>(null);
  return <div className="min-w-0 space-y-4">
    <p className="text-sm font-medium">{label} <span className="text-muted">({items.length})</span></p>
    {items.map((item, index) => <div className="min-w-0 space-y-4 rounded-xl border border-border bg-background p-4"
      key={typeof item === "object" && item !== null && "id" in item && typeof item.id === "string" ? item.id : index}
      onDragOver={(event) => { if (dragging.current !== null) event.preventDefault(); }}
      onDrop={(event) => {
        if (dragging.current === null) return;
        event.preventDefault();
        onChange(moveItem(items, dragging.current, index));
        dragging.current = null;
      }}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" draggable className="cms-action cursor-grab" aria-label={`Déplacer ${label} ${index + 1}`}
          onDragStart={(e) => { dragging.current = index; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(index)); }}
          onDragEnd={() => { dragging.current = null; }}>Déplacer</button>
        <button type="button" className="cms-action" disabled={index === 0} onClick={() => onChange(moveItem(items, index, index - 1))} aria-label={`Monter ${label} ${index + 1}`}>↑</button>
        <button type="button" className="cms-action" disabled={index === items.length - 1} onClick={() => onChange(moveItem(items, index, index + 1))} aria-label={`Descendre ${label} ${index + 1}`}>↓</button>
        <button type="button" className="cms-action ml-auto text-red-300" onClick={() => {
          if (window.confirm(`Retirer cet élément de « ${label} » du brouillon ?`)) onChange(items.filter((_, i) => i !== index));
        }}>Retirer</button>
      </div>
      {render(item, (next) => onChange(items.map((value, i) => i === index ? next : value)), index)}
    </div>)}
    <button type="button" className="cms-action" disabled={items.length >= max} onClick={() => onChange([...items, create()])}>+ Ajouter : {label}</button>
  </div>;
}
