"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AdminField, ResourcePageConfig } from "./admin-types";
import styles from "./admin.module.css";

type Row = Record<string, unknown> & { id?: string };

function initialValue(field: AdminField) {
  if (field.kind === "boolean") return false;
  if (field.kind === "number") return 0;
  if (field.kind === "json") return field.key === "allowed_roles" || field.key === "tags" || field.key === "permissions" ? "[]" : "{}";
  return "";
}

function toForm(row: Row, fields: AdminField[]) {
  return Object.fromEntries(fields.map((field) => {
    const value = row[field.key];
    if (field.kind === "json") return [field.key, JSON.stringify(value ?? (field.key === "allowed_roles" || field.key === "tags" || field.key === "permissions" ? [] : {}), null, 2)];
    if (field.kind === "datetime" && typeof value === "string") return [field.key, value.slice(0, 16)];
    return [field.key, value ?? initialValue(field)];
  }));
}

function payloadFrom(form: Record<string, unknown>, fields: AdminField[]) {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = form[field.key];
    if (field.kind === "json") {
      try { result[field.key] = JSON.parse(String(value || (field.key === "tags" ? "[]" : "{}"))); }
      catch { throw new Error(`Trường “${field.label}” chưa phải JSON hợp lệ.`); }
    } else if (field.kind === "number") result[field.key] = Number(value);
    else if (field.kind === "datetime") result[field.key] = value ? new Date(String(value)).toISOString() : null;
    else result[field.key] = value;
  }
  return result;
}

function summary(row: Row, fields: AdminField[]) {
  const keys = ["name","site_name","title_vi","label_vi","display_name","email","route","slug","platform","source_path","block_key","id"];
  for (const key of keys) if (row[key]) return String(row[key]);
  for (const field of fields) if (row[field.key]) return String(row[field.key]);
  return "Mục chưa đặt tên";
}

export function AdminResourcePanel({ config, filter }: { config: ResourcePageConfig; filter?: (row: Row) => boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const filteredRows = useMemo(() => filter ? rows.filter(filter) : rows, [filter, rows]);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/${config.resource}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error || "Không thể tải dữ liệu."); return; }
    setRows(body.data || []);
    const first = (body.data || []).find((row: Row) => !filter || filter(row));
    if (first && config.allowCreate === false) { setSelected(first); setForm(toForm(first, config.fields)); }
  }, [config.allowCreate, config.fields, config.resource, filter]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function edit(row: Row) { setSelected(row); setForm(toForm(row, config.fields)); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function createNew() { setSelected(null); setForm(Object.fromEntries(config.fields.map((field) => [field.key, initialValue(field)]))); setMessage(""); }

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const payload = payloadFrom(form, config.fields);
      const response = await fetch(selected?.id ? `/api/admin/${config.resource}/${selected.id}` : `/api/admin/${config.resource}`, { method: selected?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không thể lưu.");
      setMessage("Đã lưu thay đổi."); await load(); if (body.data) edit(body.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu."); }
    setBusy(false);
  }

  async function remove(row: Row) {
    if (!row.id || !confirm(`Xóa “${summary(row, config.fields)}”?`)) return;
    const response = await fetch(`/api/admin/${config.resource}/${row.id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error || "Không thể xóa."); return; }
    if (selected?.id === row.id) createNew(); await load();
  }

  return <div className={styles.resourcePage}>
    <header className={styles.pageHeader}><div><p>ADMIN / {config.resource.toUpperCase()}</p><h1>{config.title}</h1><span>{config.description}</span></div>{config.allowCreate !== false ? <button onClick={createNew}>+ Thêm {config.itemLabel || "mục"}</button> : null}</header>
    <div className={styles.resourceGrid}>
      <form className={styles.editor} onSubmit={save}>
        <div className={styles.editorTop}><strong>{selected?.id ? "Chỉnh sửa" : "Tạo mới"}</strong>{selected?.id ? <code>{selected.id}</code> : null}</div>
        <div className={styles.fields}>{config.fields.map((field) => <Field key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />)}</div>
        {message ? <p className={styles.notice} role="status">{message}</p> : null}
        <button className={styles.save} type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu thay đổi"}<span>→</span></button>
      </form>
      <section className={styles.list}><div className={styles.listHead}><strong>{filteredRows.length} mục</strong><button onClick={() => void load()}>Làm mới</button></div>{filteredRows.length ? filteredRows.map((row) => <article key={String(row.id)} className={selected?.id === row.id ? styles.selected : ""}><button className={styles.rowMain} onClick={() => edit(row)}><strong>{summary(row, config.fields)}</strong><span>{String(row.slug || row.route || row.email || row.href || row.status || "")}</span></button><button className={styles.delete} onClick={() => void remove(row)} aria-label="Xóa">×</button></article>) : <p className={styles.empty}>Chưa có dữ liệu. Bấm “Thêm” để tạo mục đầu tiên.</p>}</section>
    </div>
  </div>;
}

function Field({ field, value, onChange }: { field: AdminField; value: unknown; onChange: (value: unknown) => void }) {
  if (field.kind === "boolean") return <label className={styles.checkbox}><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span><strong>{field.label}</strong>{field.help ? <small>{field.help}</small> : null}</span></label>;
  if (field.kind === "reference" && field.reference) return <ReferenceField field={field} value={value} onChange={onChange} />;
  const common = { value: String(value ?? ""), required: field.required, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value) };
  return <label className={field.kind === "textarea" || field.kind === "json" ? styles.wide : ""}><span>{field.label}</span>{field.help ? <small>{field.help}</small> : null}{field.kind === "textarea" || field.kind === "json" ? <textarea {...common} rows={field.kind === "json" ? 8 : 5} spellCheck={field.kind !== "json"} /> : field.kind === "select" ? <select {...common}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input {...common} type={field.kind === "number" ? "number" : field.kind === "datetime" ? "datetime-local" : "text"} />}</label>;
}

function ReferenceField({ field, value, onChange }: { field: AdminField; value: unknown; onChange: (value: unknown) => void }) {
  const reference = field.reference!;
  const [options, setOptions] = useState<Row[]>([]);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/${reference.resource}`, { cache: "no-store" }).then((response) => response.json()).then((body) => { if (alive) setOptions(body.data ?? []); }).catch(() => undefined);
    return () => { alive = false; };
  }, [reference.resource]);
  const label = (row: Row) => reference.labelKeys.map((key) => row[key]).find(Boolean) || row.id;
  return <label><span>{field.label}</span>{field.help ? <small>{field.help}</small> : null}<select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
    {reference.allowEmpty !== false && <option value="">— Không chọn —</option>}
    {options.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(label(row))}</option>)}
  </select></label>;
}
