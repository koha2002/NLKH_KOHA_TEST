"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import initialProfile from "../../public/content/cv/profile.json";
import styles from "./cv.module.css";

type Localized = { vi: string; en: string };

type Job = {
  id?: string;
  time: string;
  company: string;
  role: string;
  subtitle?: string;
  description: string;
  url?: string;
};

type Education = {
  id?: string;
  period: string;
  school: Localized;
  major: Localized;
  subtitle?: Localized;
  description?: Localized;
  url?: string;
};

type CompactItem = {
  id?: string;
  period?: string;
  title: Localized;
  subtitle?: Localized;
  organization?: Localized;
  description?: Localized;
  url?: string;
};

type Extra = {
  id: string;
  type: string;
  period: string;
  url?: string;
  title: Localized;
  subtitle: Localized;
  organization: Localized;
  description: Localized;
  data?: Record<string, unknown>;
};

type Profile = {
  visible?: boolean;
  name: string;
  role: Localized;
  headline: Localized;
  summary: Localized;
  born: string;
  address: Localized;
  phone: string;
  phoneHref: string;
  email: string;
  photo: string;
  photoMediaId?: string;
  pdf: string;
  pdfAccess?: "public" | "authenticated" | "hidden";
  pdfMediaId?: string;
  theme?: {
    layout?: string;
    accent?: string;
    show_photo?: boolean;
    show_contact?: boolean;
    show_download_pdf?: boolean;
  };
  education: {
    period: string;
    school: Localized;
    major: Localized;
    subtitle?: Localized;
  };
  educations?: Education[];
  certificates: { vi: string[]; en: string[] };
  certificateItems?: CompactItem[];
  skills: { vi: string[]; en: string[] };
  skillItems?: CompactItem[];
  jobs: { vi: Job[]; en: Job[] };
  extraSections?: Extra[];
};

type PresignDownloadResult = { url?: string };

const extraLabels: Record<string, Localized> = {
  project: { vi: "Dự án", en: "Projects" },
  language: { vi: "Ngôn ngữ", en: "Languages" },
  custom: { vi: "Thông tin thêm", en: "Additional information" },
};

function DetailText({ text }: { text?: string }) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <div className={styles.detailText}>
      {lines.map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <p className={styles.detailLead} key={`${index}-${line}`}>
              {line.slice(3)}
            </p>
          );
        }

        const nested = line.startsWith("◦ ");
        const bullet =
          nested ||
          line.startsWith("• ") ||
          line.startsWith("- ");

        if (bullet) {
          const body = line.replace(/^(?:◦|•|-)\s*/, "");
          return (
            <div
              className={`${styles.detailBullet} ${nested ? styles.detailNested : ""}`}
              key={`${index}-${line}`}
            >
              <span aria-hidden="true">{nested ? "–" : "•"}</span>
              <p>{body}</p>
            </div>
          );
        }

        return <p key={`${index}-${line}`}>{line}</p>;
      })}
    </div>
  );
}

export default function CvPage() {
  const { language, t } = useLanguage();
  const cv = t.cv;

  const [profile, setProfile] =
    useState<Profile | null>(initialProfile as Profile);
  const [pdfMessage, setPdfMessage] = useState("");
  const [signedPhoto, setSignedPhoto] = useState<{ mediaId: string; url: string } | null>(null);

  useEffect(() => {
    fetch("/content/cv/profile.json", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => setProfile(data as Profile))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const mediaId = profile?.photoMediaId;
    // Public CV media is materialized at build time. Only call the Edge
    // presign fallback when the generated profile has no static photo URL.
    if (!mediaId || profile?.photo) return;

    let cancelled = false;
    void import("../../lib/supabase-browser")
      .then(({ invokeEdge }) =>
        invokeEdge("r2-file", {
          action: "presign-download",
          media_id: mediaId,
        }),
      )
      .then((result) => {
        const out = result as PresignDownloadResult;
        if (!cancelled && out.url) {
          setSignedPhoto({ mediaId, url: out.url });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profile?.photo, profile?.photoMediaId]);

  const photoUrl =
    signedPhoto && signedPhoto.mediaId === profile?.photoMediaId
      ? signedPhoto.url
      : profile?.photo || "";

  const extras = useMemo(() => {
    const map = new Map<string, Extra[]>();

    for (const item of profile?.extraSections || []) {
      const key = item.type || "custom";
      map.set(key, [
        ...(map.get(key) || []),
        item,
      ]);
    }

    return [...map.entries()];
  }, [profile]);

  if (!profile || profile.visible === false) {
    return (
      <main className={styles.loading}>
        <p>
          {language === "vi"
            ? "Hồ sơ CV hiện đang được ẩn bởi quản trị viên."
            : "The CV is currently hidden by the administrator."}
        </p>
      </main>
    );
  }

  const theme = profile.theme || {};
  const showPhoto =
    theme.show_photo !== false;
  const showContact =
    theme.show_contact !== false;
  const showPdf =
    theme.show_download_pdf !== false &&
    profile.pdfAccess !== "hidden";

  async function openPdf() {
    setPdfMessage("");

    const currentProfile = profile;

    if (!currentProfile) {
      setPdfMessage(
        language === "vi"
          ? "CV tóm tắt chưa sẵn sàng."
          : "The short résumé is not ready yet.",
      );
      return;
    }

    try {
      const browser =
        currentProfile.pdfAccess === "authenticated" ||
        Boolean(currentProfile.pdfMediaId)
          ? await import("../../lib/supabase-browser")
          : null;

      if (
        currentProfile.pdfAccess ===
        "authenticated"
      ) {
        const {
          data: { session },
        } =
          await browser!.supabase.auth.getSession();

        if (!session) {
          window.location.href =
            "/login?next=/cv";
          return;
        }
      }

      if (currentProfile.pdfMediaId) {
        const out = (await browser!.invokeEdge("r2-file", {
            action: "presign-download",
            media_id:
              currentProfile.pdfMediaId,
          })) as PresignDownloadResult;

        if (!out.url) {
          throw new Error(
            language === "vi"
              ? "Không tạo được liên kết tải CV tóm tắt."
              : "Could not create the short résumé download link.",
          );
        }

        window.open(
          out.url,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      if (currentProfile.pdf) {
        window.open(
          currentProfile.pdf,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }

      throw new Error(
        language === "vi"
          ? "Chưa có file CV tóm tắt."
          : "No short résumé PDF is available yet.",
      );
    } catch (error) {
      setPdfMessage(
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }

  return (
    <main>
      <section className={styles.hero}>
        <div
          className={`container ${styles.heroGrid}`}
        >
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              {cv.eyebrow}
            </p>

            <h1>
              {profile.headline?.[language] ||
                profile.name}
            </h1>

            <p>
              {profile.summary?.[language]}
            </p>

            <div className={styles.actions}>
              {showPdf &&
              (profile.pdf ||
                profile.pdfMediaId) ? (
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    void openPdf();
                  }}
                >
                  {profile.pdfAccess ===
                  "authenticated"
                    ? language === "vi"
                      ? "Đăng nhập để tải CV tóm tắt"
                      : "Login to download short résumé"
                    : language === "vi"
                      ? "Tải CV tóm tắt"
                      : "Download short résumé"}
                  <span>↓</span>
                </a>
              ) : null}

              {showContact &&
              profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                >
                  {cv.email}
                  <span>↗</span>
                </a>
              ) : null}
            </div>

            {pdfMessage ? (
              <p
                style={{
                  marginTop: "10px",
                  color: "var(--muted)",
                }}
              >
                {pdfMessage}
              </p>
            ) : null}
          </div>

          {showPhoto ? (
            <div className={styles.identityCard}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={profile.name}
                  width={320}
                  height={330}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <div
                  className={styles.photoFallback}
                  aria-hidden="true"
                >
                  {profile.name?.trim().slice(0, 1).toUpperCase() || "CV"}
                </div>
              )}

              <div>
                <strong>{profile.name}</strong>
                <span>
                  {profile.role?.[language]}
                </span>
              </div>

              <p>
                POWER SYSTEMS · AUTOMATION ·
                ELECTRICAL ENGINEERING
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section
        className={`container ${styles.summary}`}
      >
        <aside className={styles.sidebar}>
          {showContact ? <section>
            <h2>{cv.personal}</h2>
            <dl>
              {profile.born ? <div><dt>{cv.born}</dt><dd>{profile.born}</dd></div> : null}
              {profile.address?.[language] ? <div><dt>{cv.address}</dt><dd>{profile.address[language]}</dd></div> : null}
              {profile.phone ? <div><dt>{cv.phone}</dt><dd><a href={`tel:${profile.phoneHref}`}>{profile.phone}</a></dd></div> : null}
              {profile.email ? <div><dt>Email</dt><dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd></div> : null}
            </dl>
          </section> : null}

          {((profile.educations?.length ? profile.educations : [profile.education]).filter(Boolean) as Education[]).some(x=>x?.school?.[language] || x?.major?.[language]) ? <section>
            <h2>{cv.education}</h2>
            {(profile.educations?.length ? profile.educations : [profile.education]).filter(Boolean).map((edu:Education,index:number)=>
              (edu.school?.[language] || edu.major?.[language]) ? <div key={edu.id || `${edu.period}-${index}`} style={{marginBottom:index===((profile.educations?.length||1)-1)?"0":"22px"}}>
                {edu.period ? <p className={styles.year}>{edu.period}</p> : null}
                {edu.school?.[language] ? <h3>{edu.url ? <a href={edu.url} target="_blank" rel="noreferrer">{edu.school[language]}</a> : edu.school[language]}</h3> : null}
                {edu.major?.[language] ? <p>{edu.major[language]}</p> : null}
                {edu.subtitle?.[language] ? <p>{edu.subtitle[language]}</p> : null}
                {edu.description?.[language] ? <p>{edu.description[language]}</p> : null}
              </div> : null
            )}
          </section> : null}

          {(profile.certificateItems?.length || profile.certificates?.[language]?.length) ? <section>
            <h2>{cv.certificates}</h2>
            {profile.certificateItems?.length
              ? <ul>{profile.certificateItems.map((item,index)=><li key={item.id||index}>
                  {item.title?.[language] ? (item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title[language]}</a> : item.title[language]) : ""}
                  {item.period ? <span> · {item.period}</span> : null}
                  {item.organization?.[language] ? <span> · {item.organization[language]}</span> : null}
                  {item.subtitle?.[language] ? <span> · {item.subtitle[language]}</span> : null}
                  {item.description?.[language] ? <span> · {item.description[language]}</span> : null}
                </li>)}</ul>
              : <ul>{profile.certificates[language].map((cert) => <li key={cert}>{cert}</li>)}</ul>}
          </section> : null}

          {(profile.skillItems?.length || profile.skills?.[language]?.length) ? <section>
            <h2>{cv.skills}</h2>
            {profile.skillItems?.length
              ? <div className={styles.skills}>{profile.skillItems.map((item,index)=><span key={item.id||index} title={[
                  item.subtitle?.[language],
                  item.organization?.[language],
                  item.description?.[language]
                ].filter(Boolean).join(" · ") || undefined}>
                  {item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title?.[language] || ""}</a> : (item.title?.[language] || "")}
                </span>)}</div>
              : <div className={styles.skills}>{profile.skills[language].map((skill) => <span key={skill}>{skill}</span>)}</div>}
          </section> : null}
        </aside>

        <div className={styles.experience}>
          {profile.jobs?.[language]
            ?.length ? (
            <>
              <div
                className={
                  styles.sectionTitle
                }
              >
                <span>02</span>
                <h2>{cv.experience}</h2>
              </div>

              <div className={styles.timeline}>
                {profile.jobs[
                  language
                ].map((job) => (
                  <article
                    key={
                      job.id ||
                      `${job.time}-${job.company}-${job.role}`
                    }
                  >
                    <span
                      className={styles.dot}
                    />

                    <p
                      className={
                        styles.jobTime
                      }
                    >
                      {job.time}
                    </p>

                    {job.company ? (
                      <h3>
                        {job.url ? (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {job.company}
                          </a>
                        ) : (
                          job.company
                        )}
                      </h3>
                    ) : null}

                    {job.role ? (
                      <h4>{job.role}</h4>
                    ) : null}

                    {job.subtitle ? (
                      <p
                        className={
                          styles.jobSubtitle
                        }
                      >
                        {job.subtitle}
                      </p>
                    ) : null}

                    <DetailText
                      text={job.description}
                    />
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {extras.map(
            ([type, rows], groupIndex) => (
              <section
                key={type}
                style={{
                  marginTop:
                    groupIndex > 0 ||
                    !!profile.jobs?.[
                      language
                    ]?.length
                      ? "46px"
                      : "0",
                }}
              >
                <div
                  className={
                    styles.sectionTitle
                  }
                >
                  <span>
                    {String(
                      groupIndex + 3,
                    ).padStart(2, "0")}
                  </span>

                  <h2>
                    {
                      (
                        extraLabels[type] ||
                        extraLabels.custom
                      )[language]
                    }
                  </h2>
                </div>

                <div
                  className={styles.timeline}
                >
                  {rows.map((item) => (
                    <article key={item.id}>
                      <span
                        className={styles.dot}
                      />

                      {item.period ? (
                        <p
                          className={
                            styles.jobTime
                          }
                        >
                          {item.period}
                        </p>
                      ) : null}

                      <h3>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.organization?.[
                              language
                            ] ||
                              item.title?.[
                                language
                              ]}
                          </a>
                        ) : (
                          item.organization?.[
                            language
                          ] ||
                          item.title?.[
                            language
                          ]
                        )}
                      </h3>

                      {item.organization?.[
                        language
                      ] ? (
                        <h4>
                          {
                            item.title?.[
                              language
                            ]
                          }
                        </h4>
                      ) : null}

                      {item.subtitle?.[
                        language
                      ] ? (
                        <p
                          className={
                            styles.jobSubtitle
                          }
                        >
                          {
                            item.subtitle[
                              language
                            ]
                          }
                        </p>
                      ) : null}

                      <DetailText
                        text={
                          item.description?.[
                            language
                          ]
                        }
                      />
                    </article>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      </section>
    </main>
  );
}