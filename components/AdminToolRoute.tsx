"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { ToolFrame } from "./ToolFrame";
import { useLanguage } from "./LanguageProvider";
import { getMyAccess, supabase, type MyAccess } from "../lib/supabase-browser";
import styles from "../app/tools/tool-page.module.css";

type Tool = {
  id: string;
  slug: string;
  href: string;
  code: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  requiresAuth: boolean;
  allowedRoles: readonly string[];
  hasInlineHtml: boolean;
  status?: string;
};

type RuntimePolicy = {
  requires_auth: boolean;
  allowed_roles: string[] | null;
  visible: boolean;
  status: string | null;
};

export function AdminToolRoute({
  tool,
  beforeFrame = null,
  importTarget,
}: {
  tool: Tool;
  beforeFrame?: ReactNode;
  importTarget?: string;
}) {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [policy, setPolicy] = useState<RuntimePolicy | null>(() => ({
    requires_auth: Boolean(tool.requiresAuth),
    allowed_roles: [...(tool.allowedRoles || [])],
    visible: true,
    status: tool.status || null,
  }));
  const [policyLoaded, setPolicyLoaded] = useState(true);
  const [access, setAccess] = useState<MyAccess | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("tools")
      .select("requires_auth,allowed_roles,visible,status")
      .eq("slug", tool.slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setPolicy((data as RuntimePolicy) || null);
        setPolicyLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, [tool.slug]);

  const requiresAuth = policy?.requires_auth ?? tool.requiresAuth;
  const allowedRoles = useMemo(
    () => policy?.allowed_roles ?? [...(tool.allowedRoles || [])],
    [policy?.allowed_roles, tool.allowedRoles],
  );

  useEffect(() => {
    if (!requiresAuth) return;

    let alive = true;
    getMyAccess().then((nextAccess) => {
      if (alive) setAccess(nextAccess);
    });

    return () => {
      alive = false;
    };
  }, [requiresAuth]);

  if (!policyLoaded) {
    return (
      <main>
        <div className="container" style={{ padding: "80px 0" }}>
          {vi ? "Đang kiểm tra cấu hình Tool…" : "Checking tool settings…"}
        </div>
      </main>
    );
  }

  if (policy && policy.visible === false) {
    return (
      <main>
        <section className={styles.hero}>
          <div className="container">
            <p>{tool.code} / HIDDEN</p>
            <h1>
              {vi
                ? "Công cụ đang được ẩn bởi quản trị viên."
                : "This tool is currently hidden by the administrator."}
            </h1>
          </div>
        </section>
      </main>
    );
  }

  if (requiresAuth && access === null) {
    return (
      <main>
        <div className="container" style={{ padding: "80px 0" }}>
          {vi ? "Đang kiểm tra quyền truy cập…" : "Checking access…"}
        </div>
      </main>
    );
  }

  if (requiresAuth) {
    const ok =
      Boolean(access?.authenticated) &&
      access?.status === "active" &&
      (!allowedRoles.length ||
        (Boolean(access?.role_id) && allowedRoles.includes(access?.role_id || "")));

    if (!ok) {
      return (
        <main>
          <section className={styles.hero}>
            <div className="container">
              <p>{tool.code} / PRIVATE</p>
              <h1>
                {vi
                  ? "Công cụ cần tài khoản được cấp quyền."
                  : "This tool requires an approved account."}
              </h1>
              <a href={`/login?next=${encodeURIComponent(tool.href || `/tools/${tool.slug}`)}`}>
                {vi ? "Đăng nhập" : "Sign in"}
              </a>
            </div>
          </section>
        </main>
      );
    }
  }

  const rawSrc = tool.hasInlineHtml
    ? `/tool-modules/_admin/${tool.slug}/index.html`
    : `/tool-modules/${tool.slug}/index.html`;
  const src = `${rawSrc}?lang=${encodeURIComponent(language)}`;

  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <p>{tool.code} / TOOL</p>
          <h1>{tool.title[language] || tool.title.vi}</h1>
          <span>{tool.description[language] || tool.description.vi}</span>
        </div>
      </section>
      {beforeFrame}
      <section className={styles.fullWorkspace}>
        <ToolFrame
          src={src}
          title={tool.title[language] || tool.title.vi}
          tall
          flush
          importTarget={importTarget}
        />
      </section>
    </main>
  );
}
