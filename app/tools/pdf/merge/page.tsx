"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useLanguage } from "../../../../components/LanguageProvider";
import styles from "../pdf.module.css";

type Status = { type: "idle" | "success" | "error"; message: string };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PdfPage() {
  const { t } = useLanguage();
  const copy = t.pdf;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  const addFiles = (items: File[]) => {
    const pdfs = items.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    setFiles((current) => [...current, ...pdfs].slice(0, 20));
    setStatus({ type: "idle", message: "" });
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const merge = async () => {
    if (files.length < 2) {
      setStatus({ type: "error", message: copy.needFiles });
      return;
    }

    setBusy(true);
    setStatus({ type: "idle", message: "" });
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer());
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const output = await merged.save();
      const blob = new Blob([new Uint8Array(output)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "koha-merged.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      setStatus({ type: "success", message: copy.success });
    } catch {
      setStatus({ type: "error", message: copy.error });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
          </div>
          <div className={styles.privacyCard}>
            <span className={styles.shield}>✓</span>
            <div><strong>{copy.private}</strong><p>{copy.offline}</p></div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.workspace}`}>
        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple onChange={handleInput} className="sr-only" id="pdf-files" />
          <span className={styles.fileIcon}>PDF</span>
          <h2>{copy.dropTitle}</h2>
          <p>{copy.dropText}</p>
          <button onClick={() => inputRef.current?.click()}>{copy.choose}<span>＋</span></button>
        </div>

        <div className={styles.filePanel}>
          <div className={styles.panelHeader}>
            <div><span>02</span><h2>{copy.selected}</h2></div>
            {files.length > 0 && <button onClick={() => { setFiles([]); setStatus({ type: "idle", message: "" }); }}>{copy.clear}</button>}
          </div>

          {files.length === 0 ? (
            <div className={styles.empty}>{copy.empty}</div>
          ) : (
            <ol className={styles.fileList}>
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`}>
                  <span className={styles.order}>{String(index + 1).padStart(2, "0")}</span>
                  <div className={styles.fileInfo}><strong>{file.name}</strong><span>{formatSize(file.size)}</span></div>
                  <div className={styles.fileActions}>
                    <button onClick={() => move(index, -1)} disabled={index === 0} title={copy.moveUp} aria-label={`${copy.moveUp}: ${file.name}`}>↑</button>
                    <button onClick={() => move(index, 1)} disabled={index === files.length - 1} title={copy.moveDown} aria-label={`${copy.moveDown}: ${file.name}`}>↓</button>
                    <button onClick={() => remove(index)} title={copy.remove} aria-label={`${copy.remove}: ${file.name}`}>×</button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {status.message && <p className={`${styles.status} ${styles[status.type]}`} role="status">{status.message}</p>}
          <button className={styles.mergeButton} onClick={merge} disabled={busy || files.length < 2}>
            {busy ? copy.merging : copy.merge}<span>↓</span>
          </button>
        </div>
      </section>

      <section className={styles.steps}>
        <div className="container">
          <p>HOW IT WORKS / 03</p>
          <h2>{copy.howTitle}</h2>
          <div>
            {copy.steps.map((step, index) => <article key={step}><span>0{index + 1}</span><p>{step}</p></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}
