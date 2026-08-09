"use client";

import { useLanguage } from "../components/LanguageProvider";
import { FeatureGraphic } from "../components/FeatureIcon";
import { ToolOrbit } from "../components/ToolOrbit/ToolOrbit";
import { homeProducts } from "../data/home-products";
import type { HomeProduct } from "../data/home-products";
import { usePublicTools } from "../components/usePublicTools";
import { usePublicShell } from "../components/PublicShellProvider";
import styles from "./home.module.css";

export default function HomePage() {
  const { language, t } = useLanguage();
  const remote = usePublicTools();
  const { blocks } = usePublicShell();
  const home = t.home;
  const block = (key: string) => blocks.find((item) => item.page_key === "home" && item.block_key === key)?.content ?? {};
  const hero = block("hero");
  const facts = block("facts");
  const capabilityBlock = block("capabilities");
  const workspaceBlock = block("workspace");
  const localized = (source: Record<string, unknown>, key: string, fallback: string) => String(source[`${key}_${language}`] || source[key] || fallback);
  const fixedProducts = homeProducts.filter((product) => ["/cv","/software","/data"].includes(product.href));
  const products: HomeProduct[] = remote.tools === null ? homeProducts : [
    ...fixedProducts,
    ...remote.tools.filter((tool) => tool.show_home).map((tool) => ({ href:tool.route,label:tool.code,icon:(["quiz","pdf","comtrade","software","data","profile"].includes(tool.icon || tool.slug) ? tool.icon || tool.slug : "software") as "quiz" | "pdf" | "comtrade" | "software" | "data" | "profile",color:(["orange","cyan","blue"].includes(tool.accent) ? tool.accent : "blue") as "orange" | "cyan" | "blue",title:{vi:tool.title_vi,en:tool.title_en},description:{vi:tool.description_vi,en:tool.description_en} })),
  ];

  const defaultCapabilities = [
    { number: "01", title: home.capabilityOne, description: home.capabilityOneDesc },
    { number: "02", title: home.capabilityTwo, description: home.capabilityTwoDesc },
    { number: "03", title: home.capabilityThree, description: home.capabilityThreeDesc },
  ];
  const configuredCapabilities = Array.isArray(capabilityBlock.items) ? capabilityBlock.items as Array<Record<string, unknown>> : [];
  const capabilities = configuredCapabilities.length ? configuredCapabilities.map((item, index) => ({ number:String(item.number || String(index + 1).padStart(2,"0")), title:localized(item,"title",""), description:localized(item,"description","") })) : defaultCapabilities;

  return (
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.badge}><span />{localized(hero,"badge",home.badge)}</p>
            <p className={styles.hello}>{localized(hero,"hello",home.hello)}</p>
            <h1>{localized(hero,"name",home.name)}</h1>
            <div className={styles.actions}>
              <a className={styles.primaryButton} href={String(hero.primary_href || "/cv")}>{localized(hero,"primary_label",home.viewCv)}<span>↗</span></a>
              <a className={styles.secondaryButton} href={String(hero.secondary_href || "#workspace")}>{localized(hero,"secondary_label",home.openTools)}<span>↓</span></a>
            </div>
          </div>

          <ToolOrbit language={language} />
        </div>
      </section>

      <section className={styles.quickFacts}>
        <div className={`container ${styles.factGrid}`}>
          <article><span>{String(facts.education_period || "2020—2025")}</span><div><strong>{localized(facts,"education",home.education)}</strong><p>{localized(facts,"education_sub",home.educationSub)}</p></div></article>
          <article><span>{String(facts.experience_period || "04+ YEARS")}</span><div><strong>{localized(facts,"experience",home.experience)}</strong><p>{localized(facts,"experience_sub",home.experienceSub)}</p></div></article>
        </div>
      </section>

      <section className={`container ${styles.capabilitySection}`}>
        <div className={styles.sectionIntro}>
          <p>{localized(capabilityBlock,"tag",home.sectionTag)}</p>
          <h2>{localized(capabilityBlock,"title",home.sectionTitle)}</h2>
        </div>
        <div className={styles.capabilityList}>
          {capabilities.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.workspace} id="workspace">
        <div className="container">
          <div className={styles.workspaceHeading}>
            <p>{localized(workspaceBlock,"tag",home.productsTag)}</p>
            <h2>{localized(workspaceBlock,"title",home.productsTitle)}</h2>
          </div>
          <div className={styles.productGrid}>
            {products.map((product) => (
              <a className={styles.productCard} href={product.href} key={product.href}>
                <div className={`${styles.productLabel} ${styles[product.color]}`}>
                  <FeatureGraphic icon={product.icon} image={product.image} size={28} />
                  <span>{product.label}</span>
                </div>
                <div><h3>{product.title[language]}</h3><p>{product.description[language]}</p></div>
                <span className={styles.productLink}>{home.open} <i>↗</i></span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
