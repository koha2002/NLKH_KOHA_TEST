"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { invokeEdge, supabase } from "../../lib/supabase-browser";
import styles from "./cv.module.css";

type Localized = { vi: string; en: string };
type Job = { time: string; company: string; role: string; description: string };
type Extra = { id:string; type:string; period:string; url?:string; title:Localized; subtitle:Localized; organization:Localized; description:Localized; data?:Record<string,unknown> };
type Profile = {
  visible?: boolean;
  name: string; role: Localized; headline: Localized; summary: Localized; born: string; address: Localized;
  phone: string; phoneHref: string; email: string; photo: string; photoMediaId?:string; pdf: string; pdfAccess?:"public"|"authenticated"|"hidden"; pdfMediaId?:string;
  theme?: {layout?:string;accent?:string;show_photo?:boolean;show_contact?:boolean;show_download_pdf?:boolean};
  education: { period: string; school: Localized; major: Localized };
  certificates: { vi: string[]; en: string[] }; skills: { vi: string[]; en: string[] }; jobs: { vi: Job[]; en: Job[] };
  extraSections?: Extra[];
};

const extraLabels:Record<string,Localized>={
  project:{vi:"Dự án",en:"Projects"},language:{vi:"Ngôn ngữ",en:"Languages"},custom:{vi:"Thông tin thêm",en:"Additional information"}
};

export default function CvPage() {
  const { language, t } = useLanguage();
  const cv = t.cv;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded,setLoaded]=useState(false);
  const [pdfMessage,setPdfMessage]=useState("");
  const [photoUrl,setPhotoUrl]=useState("");

  useEffect(() => {
    fetch("/content/cv/profile.json",{cache:"no-store"})
      .then((response) => response.json())
      .then((data)=>setProfile(data))
      .catch(() => setProfile(null))
      .finally(()=>setLoaded(true));
  }, []);

  useEffect(()=>{
    let cancelled=false;
    const fallback=profile?.photo||"";
    setPhotoUrl(fallback);
    if(!profile?.photoMediaId)return;
    invokeEdge("r2-file",{action:"presign-download",media_id:profile.photoMediaId})
      .then((out:any)=>{if(!cancelled&&out?.url)setPhotoUrl(out.url)})
      .catch(()=>{});
    return()=>{cancelled=true};
  },[profile?.photoMediaId,profile?.photo]);

  const extras=useMemo(()=>{
    const map=new Map<string,Extra[]>();
    for(const x of profile?.extraSections||[]){const key=x.type||"custom";map.set(key,[...(map.get(key)||[]),x])}
    return [...map.entries()];
  },[profile]);

  if (!loaded) return <main className={styles.loading}><p>{language === "vi" ? "Đang tải hồ sơ…" : "Loading profile…"}</p></main>;
  if (!profile || profile.visible === false) return <main className={styles.loading}><p>{language === "vi" ? "Hồ sơ CV hiện đang được ẩn bởi quản trị viên." : "The CV is currently hidden by the administrator."}</p></main>;

  const theme=profile.theme||{};
  const showPhoto=theme.show_photo!==false;
  const showContact=theme.show_contact!==false;
  const showPdf=theme.show_download_pdf!==false && profile.pdfAccess!=="hidden";

  async function openPdf(){
    setPdfMessage("");
    const currentProfile = profile;
    if (!currentProfile) {
      setPdfMessage(language === "vi" ? "Hồ sơ CV chưa sẵn sàng." : "The CV profile is not ready yet.");
      return;
    }
    try{
      if(currentProfile.pdfAccess==="authenticated"){
        const{data:{session}}=await supabase.auth.getSession();
        if(!session){window.location.href="/login?next=/cv";return}
      }
      if(currentProfile.pdfMediaId){
        const out:any=await invokeEdge("r2-file",{action:"presign-download",media_id:currentProfile.pdfMediaId});
        if(!out?.url)throw new Error(language==="vi"?"Không tạo được liên kết PDF R2.":"Could not create an R2 PDF link.");
        window.open(out.url,"_blank","noopener,noreferrer");return;
      }
      if(currentProfile.pdf){window.open(currentProfile.pdf,"_blank","noopener,noreferrer");return}
      throw new Error(language==="vi"?"CV chưa có file PDF.":"No PDF resume is available yet.");
    }catch(e){setPdfMessage(e instanceof Error?e.message:String(e))}
  }

  return (
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{cv.eyebrow}</p>
            <h1>{profile.headline?.[language] || profile.name}</h1>
            <p>{profile.summary?.[language]}</p>
            <div className={styles.actions}>
              {showPdf && (profile.pdf || profile.pdfMediaId) ? <a href="#" onClick={(e)=>{e.preventDefault();openPdf()}}>{profile.pdfAccess==="authenticated"?(language==="vi"?"Đăng nhập để tải CV":"Login to download CV"):cv.download}<span>↓</span></a> : null}
              {showContact && profile.email ? <a href={`mailto:${profile.email}`}>{cv.email}<span>↗</span></a> : null}
            </div>
            {pdfMessage ? <p style={{marginTop:"10px",color:"var(--muted)"}}>{pdfMessage}</p> : null}
          </div>
          {showPhoto ? <div className={styles.identityCard}>
            {photoUrl ? <img src={photoUrl} alt={profile.name} width={325} height={352} /> : null}
            <div><strong>{profile.name}</strong><span>{profile.role?.[language]}</span></div>
            <p>POWER SYSTEMS · AUTOMATION</p>
          </div> : null}
        </div>
      </section>

      <section className={`container ${styles.summary}`}>
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

          {profile.education?.school?.[language] || profile.education?.major?.[language] ? <section>
            <h2>{cv.education}</h2>
            {profile.education.period ? <p className={styles.year}>{profile.education.period}</p> : null}
            <h3>{profile.education.school?.[language]}</h3>
            <p>{profile.education.major?.[language]}</p>
          </section> : null}

          {profile.certificates?.[language]?.length ? <section>
            <h2>{cv.certificates}</h2>
            <ul>{profile.certificates[language].map((cert) => <li key={cert}>{cert}</li>)}</ul>
          </section> : null}

          {profile.skills?.[language]?.length ? <section>
            <h2>{cv.skills}</h2>
            <div className={styles.skills}>{profile.skills[language].map((skill) => <span key={skill}>{skill}</span>)}</div>
          </section> : null}
        </aside>

        <div className={styles.experience}>
          {profile.jobs?.[language]?.length ? <>
            <div className={styles.sectionTitle}><span>02</span><h2>{cv.experience}</h2></div>
            <div className={styles.timeline}>
              {profile.jobs[language].map((job) => (
                <article key={`${job.time}-${job.company}-${job.role}`}>
                  <span className={styles.dot} />
                  <p className={styles.jobTime}>{job.time}</p>
                  <h3>{job.company}</h3>
                  <h4>{job.role}</h4>
                  <p>{job.description}</p>
                </article>
              ))}
            </div>
          </> : null}

          {extras.map(([type,rows],groupIndex)=><section key={type} style={{marginTop:(groupIndex>0 || !!profile.jobs?.[language]?.length)?"46px":"0"}}>
            <div className={styles.sectionTitle}><span>{String(groupIndex+3).padStart(2,"0")}</span><h2>{(extraLabels[type]||extraLabels.custom)[language]}</h2></div>
            <div className={styles.timeline}>{rows.map(x=><article key={x.id}>
              <span className={styles.dot}/>
              {x.period ? <p className={styles.jobTime}>{x.period}</p> : null}
              <h3>{x.organization?.[language] || x.title?.[language]}</h3>
              {x.organization?.[language] ? <h4>{x.title?.[language]}</h4> : null}
              {x.subtitle?.[language] ? <p>{x.subtitle[language]}</p> : null}
              {x.description?.[language] ? <p>{x.description[language]}</p> : null}
              {x.url ? <a href={x.url} target="_blank" rel="noreferrer">{language==="vi"?"Xem liên kết ↗":"Open link ↗"}</a> : null}
            </article>)}</div>
          </section>)}
        </div>
      </section>
    </main>
  );
}
