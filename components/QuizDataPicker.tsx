"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "./QuizDataPicker.module.css";

type DataItem = {
  id: string;
  title_vi: string;
  title_en: string;
  description_vi?: string;
  description_en?: string;
  access_url: string;
};

export function QuizDataPicker() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [items, setItems] = useState<DataItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/data?type=quiz_json", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        setItems(payload.items ?? []);
        setAuthenticated(Boolean(payload.authenticated));
      })
      .catch(() => setStatus(vi ? "Không thể tải danh sách dữ liệu." : "Could not load assigned data."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [vi]);

  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  const importSelected = async () => {
    if (!selected) return;
    setImporting(true);
    setStatus(vi ? "Đang tải file vào trình duyệt…" : "Loading into this browser…");
    try {
      const response = await fetch(selected.access_url, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      window.dispatchEvent(new CustomEvent("nlkh-tool-import", {
        detail: { target: "quiz", data, sourceName: vi ? selected.title_vi : selected.title_en },
      }));
      setStatus(vi ? "Đã chuyển file vào Quiz. Dữ liệu được lưu cục bộ trên thiết bị này." : "Imported into Quiz and stored locally on this device.");
    } catch {
      setStatus(vi ? "Không thể đọc file. Hãy kiểm tra quyền tài khoản hoặc định dạng JSON." : "Could not read the file. Check your access or JSON format.");
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <section className={styles.picker}><p>{vi ? "Đang kiểm tra dữ liệu được cấp…" : "Checking assigned data…"}</p></section>;

  return (
    <section className={styles.picker} aria-labelledby="assigned-quiz-title">
      <div>
        <span>ACCOUNT DATA / QUIZ JSON</span>
        <h1 id="assigned-quiz-title">{vi ? "Chọn file từ dữ liệu được cấp" : "Choose from assigned data"}</h1>
        <p>{vi ? "File chỉ được tải tạm vào trình duyệt và Quiz tiếp tục chạy cục bộ." : "The file is loaded into this browser and Quiz continues locally."}</p>
      </div>
      {authenticated ? (
        items.length ? <div className={styles.controls}>
          <label>
            <span className="sr-only">{vi ? "File Quiz" : "Quiz file"}</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">{vi ? "Chọn một file JSON…" : "Choose a JSON file…"}</option>
              {items.map((item) => <option key={item.id} value={item.id}>{vi ? item.title_vi : item.title_en}</option>)}
            </select>
          </label>
          <button type="button" onClick={importSelected} disabled={!selected || importing}>
            {importing ? (vi ? "Đang nhập…" : "Importing…") : (vi ? "Đưa vào Quiz" : "Import into Quiz")}
          </button>
        </div> : <p className={styles.notice}>{vi ? "Tài khoản chưa được cấp file Quiz JSON nào." : "No Quiz JSON file has been assigned to this account."}</p>
      ) : <a className={styles.login} href="/login?next=/tools/quiz">{vi ? "Đăng nhập để xem file được cấp" : "Sign in to view assigned files"} →</a>}
      {status ? <p className={styles.status} role="status">{status}</p> : null}
    </section>
  );
}
