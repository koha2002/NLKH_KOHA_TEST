"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "./PdfLocalStudio.module.css";

type Task = "merge" | "extract" | "remove" | "reorder" | "rotate" | "watermark" | "numbers" | "images";

const tasks: Array<{ id: Task; icon: string; vi: string; en: string }> = [
  { id: "merge", icon: "⇉", vi: "Gộp PDF", en: "Merge PDF" },
  { id: "extract", icon: "✂", vi: "Tách / trích trang", en: "Extract pages" },
  { id: "remove", icon: "−", vi: "Xóa trang", en: "Remove pages" },
  { id: "reorder", icon: "↕", vi: "Sắp xếp trang", en: "Reorder pages" },
  { id: "rotate", icon: "↻", vi: "Xoay trang", en: "Rotate pages" },
  { id: "watermark", icon: "W", vi: "Đóng dấu chữ", en: "Text watermark" },
  { id: "numbers", icon: "#", vi: "Đánh số trang", en: "Page numbers" },
  { id: "images", icon: "▧", vi: "Ảnh thành PDF", en: "Images to PDF" },
];

function download(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function parsePages(value: string, total: number, keepOrder = false) {
  const result: number[] = [];
  for (const raw of value.split(",").map((part) => part.trim()).filter(Boolean)) {
    const match = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      const start = Number(match[1]);
      const end = Number(match[2]);
      const direction = start <= end ? 1 : -1;
      for (let page = start; direction > 0 ? page <= end : page >= end; page += direction) result.push(page - 1);
    } else if (/^\d+$/.test(raw)) result.push(Number(raw) - 1);
    else throw new Error(`Cú pháp trang không hợp lệ: ${raw}`);
  }
  if (!result.length) throw new Error("Hãy nhập ít nhất một số trang.");
  if (result.some((index) => index < 0 || index >= total)) throw new Error(`Trang phải nằm trong khoảng 1-${total}.`);
  return keepOrder ? result : [...new Set(result)];
}

export function PdfLocalStudio() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [task, setTask] = useState<Task>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [pageSpec, setPageSpec] = useState("1-3");
  const [watermark, setWatermark] = useState("NGUYỄN LÊ KHÁNH HÒA");
  const [angle, setAngle] = useState("90");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const active = useMemo(() => tasks.find((item) => item.id === task)!, [task]);
  const multiple = task === "merge" || task === "images";
  const accept = task === "images" ? "image/png,image/jpeg,.png,.jpg,.jpeg" : "application/pdf,.pdf";

  const changeTask = (next: Task) => {
    setTask(next);
    setFiles([]);
    setMessage("");
  };

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles(multiple ? selected : selected.slice(0, 1));
    setMessage("");
    event.target.value = "";
  };

  const process = async () => {
    if (!files.length) return setMessage(vi ? "Hãy chọn tệp trước." : "Select a file first.");
    if (task === "merge" && files.length < 2) return setMessage(vi ? "Gộp PDF cần ít nhất 2 tệp." : "Merging requires at least two PDFs.");
    setBusy(true);
    setMessage("");
    try {
      const { PDFDocument, StandardFonts, degrees, rgb } = await import("pdf-lib");
      if (task === "images") {
        const output = await PDFDocument.create();
        for (const file of files) {
          const buffer = await file.arrayBuffer();
          const image = file.type.includes("png") ? await output.embedPng(buffer) : await output.embedJpg(buffer);
          const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
          const width = image.width * scale;
          const height = image.height * scale;
          const page = output.addPage([width, height]);
          page.drawImage(image, { x: 0, y: 0, width, height });
        }
        download(await output.save(), "images-to-pdf.pdf");
      } else if (task === "merge") {
        const output = await PDFDocument.create();
        for (const file of files) {
          const source = await PDFDocument.load(await file.arrayBuffer());
          (await output.copyPages(source, source.getPageIndices())).forEach((page) => output.addPage(page));
        }
        download(await output.save(), "merged.pdf");
      } else {
        const source = await PDFDocument.load(await files[0].arrayBuffer());
        const total = source.getPageCount();
        if (task === "extract" || task === "reorder") {
          const selected = parsePages(pageSpec, total, task === "reorder");
          const output = await PDFDocument.create();
          (await output.copyPages(source, selected)).forEach((page) => output.addPage(page));
          download(await output.save(), task === "extract" ? "extracted-pages.pdf" : "reordered.pdf");
        } else if (task === "remove") {
          const removed = new Set(parsePages(pageSpec, total));
          const kept = source.getPageIndices().filter((index) => !removed.has(index));
          if (!kept.length) throw new Error("Không thể xóa toàn bộ trang PDF.");
          const output = await PDFDocument.create();
          (await output.copyPages(source, kept)).forEach((page) => output.addPage(page));
          download(await output.save(), "pages-removed.pdf");
        } else if (task === "rotate") {
          const selected = pageSpec.trim() ? new Set(parsePages(pageSpec, total)) : new Set(source.getPageIndices());
          source.getPages().forEach((page, index) => {
            if (selected.has(index)) page.setRotation(degrees((page.getRotation().angle + Number(angle)) % 360));
          });
          download(await source.save(), "rotated.pdf");
        } else {
          const font = await source.embedFont(StandardFonts.Helvetica);
          source.getPages().forEach((page, index) => {
            const { width, height } = page.getSize();
            if (task === "watermark") {
              const size = Math.max(20, Math.min(48, width / 12));
              const textWidth = font.widthOfTextAtSize(watermark, size);
              page.drawText(watermark, { x: (width - textWidth) / 2, y: height / 2, size, font, color: rgb(.25, .35, .55), opacity: .22, rotate: degrees(35) });
            } else {
              const label = `${index + 1} / ${source.getPageCount()}`;
              page.drawText(label, { x: width / 2 - font.widthOfTextAtSize(label, 10) / 2, y: 18, size: 10, font, color: rgb(.25, .28, .34) });
            }
          });
          download(await source.save(), task === "watermark" ? "watermarked.pdf" : "numbered.pdf");
        }
      }
      setMessage(vi ? "Đã xử lý xong và tải kết quả. Tệp không rời khỏi thiết bị." : "Done. The result was downloaded and your file never left this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (vi ? "Không thể xử lý tệp." : "Unable to process the file."));
    } finally {
      setBusy(false);
    }
  };

  const needsPages = ["extract", "remove", "reorder", "rotate"].includes(task);
  return (
    <section className={styles.studio}>
      <div className={styles.heading}>
        <div><p>LOCAL PDF / 08</p><h1>{vi ? "Xử lý PDF ngay trên thiết bị." : "Process PDFs on your device."}</h1></div>
        <p>{vi ? "Tám tác vụ chạy trong trình duyệt, không gửi tài liệu lên server. Nén PDF chuyên sâu vẫn cần dịch vụ API và được cấu hình riêng trong Admin." : "Eight browser-only tasks. Files are never uploaded. Advanced compression still requires an API configured separately in Admin."}</p>
      </div>
      <div className={styles.taskGrid}>
        {tasks.map((item) => <button key={item.id} className={task === item.id ? styles.selected : ""} onClick={() => changeTask(item.id)}><span>{item.icon}</span>{vi ? item.vi : item.en}</button>)}
      </div>
      <div className={styles.workArea}>
        <div className={styles.pick}>
          <span>{active.icon}</span><h2>{vi ? active.vi : active.en}</h2>
          <p>{task === "images" ? (vi ? "Chọn ảnh JPG/PNG theo đúng thứ tự cần ghép." : "Choose JPG/PNG images in the desired order.") : (vi ? "Chọn PDF từ máy. Dữ liệu chỉ được đọc trong trình duyệt." : "Choose PDF files. Data stays inside your browser.")}</p>
          <input ref={inputRef} hidden type="file" accept={accept} multiple={multiple} onChange={choose} />
          <button onClick={() => inputRef.current?.click()}>{vi ? "Chọn tệp" : "Choose files"} <b>＋</b></button>
          <small>{files.length ? files.map((file) => file.name).join(" · ") : (vi ? "Chưa chọn tệp" : "No file selected")}</small>
        </div>
        <div className={styles.settings}>
          <p>02 / {vi ? "THIẾT LẬP" : "SETTINGS"}</p>
          {needsPages && <label>{task === "reorder" ? (vi ? "Thứ tự trang mới" : "New page order") : (vi ? "Các trang áp dụng" : "Pages")}<input value={pageSpec} onChange={(event) => setPageSpec(event.target.value)} placeholder="1-3,5,8" /><small>{vi ? "Dùng dấu phẩy và khoảng, ví dụ 1-3,5,8." : "Use commas and ranges, e.g. 1-3,5,8."}</small></label>}
          {task === "rotate" && <label>{vi ? "Góc xoay" : "Rotation"}<select value={angle} onChange={(event) => setAngle(event.target.value)}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>}
          {task === "watermark" && <label>{vi ? "Nội dung dấu" : "Watermark text"}<input value={watermark} onChange={(event) => setWatermark(event.target.value)} /></label>}
          {!needsPages && task !== "watermark" && <div className={styles.noSettings}>{vi ? "Tác vụ này không cần thiết lập thêm." : "No additional settings are required."}</div>}
          {message && <div className={styles.message} role="status">{message}</div>}
          <button className={styles.run} disabled={busy} onClick={process}>{busy ? (vi ? "Đang xử lý…" : "Processing…") : (vi ? "Xử lý và tải xuống" : "Process & download")} <span>↓</span></button>
        </div>
      </div>
    </section>
  );
}
