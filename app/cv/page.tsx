"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import styles from "./cv.module.css";

type Profile = { id:string; name:string; role_vi:string; role_en:string; headline_vi:string; headline_en:string; summary_vi:string; summary_en:string; birth_date?:string; address_vi:string; address_en:string; phone?:string; email?:string; photo_url?:string; pdf_url?:string };
type Section = { id:string; section_type:string; title_vi:string; title_en:string; subtitle_vi:string; subtitle_en:string; period:string; description_vi:string; description_en:string; organization:string; url?:string; data?:Record<string, unknown> };

const sectionLabels: Record<string, { vi:string; en:string }> = {
  experience:{ vi:"Kinh nghiệm", en:"Experience" }, education:{ vi:"Học vấn", en:"Education" }, certificate:{ vi:"Chứng chỉ", en:"Certificates" },
  skill:{ vi:"Kỹ năng", en:"Skills" }, project:{ vi:"Dự án", en:"Projects" }, language:{ vi:"Ngôn ngữ", en:"Languages" }, custom:{ vi:"Thông tin khác", en:"Additional information" },
};

export default function CvPage() {
  const { language, t } = useLanguage();
  const cv = t.cv;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetch("/api/public/cv").then((response) => response.json()).then((payload) => { setProfile(payload.profile ?? null); setSections(payload.sections ?? []); }).catch(() => setProfile(null));
  }, []);

  const grouped = useMemo(() => sections.reduce<Record<string, Section[]>>((result, section) => {
    (result[section.section_type] ??= []).push(section); return result;
  }, {}), [sections]);
  const local = (row: Section, key: "title" | "subtitle" | "description") => row[`${key}_${language}` as keyof Section] as string || row[`${key}_vi` as keyof Section] as string;

  if (!profile) return <main className={styles.loading}><p>{language === "vi" ? "CV chưa được xuất bản trong Admin." : "No CV has been published in Admin."}</p></main>;
  const role = language === "vi" ? profile.role_vi : profile.role_en || profile.role_vi;

  return <main>
    <section className={styles.hero}><div className={`container ${styles.heroGrid}`}>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>{cv.eyebrow}</p><h1>{language === "vi" ? profile.headline_vi : profile.headline_en || profile.headline_vi}</h1><p>{language === "vi" ? profile.summary_vi : profile.summary_en || profile.summary_vi}</p>
        <div className={styles.actions}>{profile.pdf_url && <a href={profile.pdf_url}>{cv.download}<span>↓</span></a>}{profile.email && <a href={`mailto:${profile.email}`}>{cv.email}<span>↗</span></a>}</div>
      </div>
      <div className={styles.identityCard}>{profile.photo_url ? <img src={profile.photo_url} alt={profile.name} /> : <div className={styles.photoFallback}>{profile.name.split(" ").slice(-2).map((part) => part[0]).join("")}</div>}<div><strong>{profile.name}</strong><span>{role}</span></div><p>POWER SYSTEMS · AUTOMATION</p></div>
    </div></section>

    <section className={`container ${styles.summary}`}>
      <aside className={styles.sidebar}>
        <section><h2>{cv.personal}</h2><dl>
          {profile.birth_date && <div><dt>{cv.born}</dt><dd>{profile.birth_date}</dd></div>}
          <div><dt>{cv.address}</dt><dd>{language === "vi" ? profile.address_vi : profile.address_en || profile.address_vi}</dd></div>
          {profile.phone && <div><dt>{cv.phone}</dt><dd><a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a></dd></div>}
          {profile.email && <div><dt>Email</dt><dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd></div>}
        </dl></section>
        {Object.entries(grouped).filter(([type]) => type !== "experience").map(([type, rows]) => <section key={type}><h2>{sectionLabels[type]?.[language] ?? type}</h2>{rows.map((row) => <article key={row.id}><p className={styles.year}>{row.period}</p><h3>{local(row,"title")}</h3>{row.organization && <strong>{row.organization}</strong>}<p>{local(row,"subtitle") || local(row,"description")}</p></article>)}</section>)}
      </aside>
      <div className={styles.experience}><div className={styles.sectionTitle}><span>02</span><h2>{cv.experience}</h2></div><div className={styles.timeline}>
        {(grouped.experience ?? []).map((row) => <article key={row.id}><span className={styles.dot}/><p className={styles.jobTime}>{row.period}</p><h3>{row.organization || local(row,"title")}</h3><h4>{row.organization ? local(row,"title") : local(row,"subtitle")}</h4><p>{local(row,"description")}</p></article>)}
        {!grouped.experience?.length && <p>{language === "vi" ? "Thêm mục Kinh nghiệm trong Admin để hiển thị tại đây." : "Add Experience sections in Admin to display them here."}</p>}
      </div></div>
    </section>
  </main>;
}
