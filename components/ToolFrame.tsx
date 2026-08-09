"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "./LanguageProvider";
import styles from "./ToolFrame.module.css";

type ToolFrameProps = {
  src: string;
  title: string;
  tall?: boolean;
  flush?: boolean;
  importTarget?: string;
};

export function ToolFrame({ src, title, tall = false, flush = false, importTarget }: ToolFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeFrameRef = useRef<(reset?: boolean) => void>(() => undefined);
  const resizeRafRef = useRef<number | null>(null);
  const { theme, language } = useLanguage();

  const syncPreferences = () => {
    const root = frameRef.current?.contentDocument?.documentElement;
    if (!root) return;
    root.dataset.theme = theme;
    root.lang = language;
    root.classList.toggle("dark", theme === "dark");
  };

  useEffect(syncPreferences, [theme, language]);

  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      const frameWindow = frameRef.current?.contentWindow;
      if (event.source !== frameWindow || event.data?.type !== "tool-frame:resize") return;
      resizeFrameRef.current(true);
    };

    window.addEventListener("message", handleFrameMessage);
    return () => {
      window.removeEventListener("message", handleFrameMessage);
      resizeObserverRef.current?.disconnect();
      if (resizeRafRef.current !== null) cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!importTarget) return;
    const forwardImport = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.target !== importTarget) return;
      frameRef.current?.contentWindow?.postMessage({
        type: "nlkh-tool-import",
        target: importTarget,
        data: detail.data,
        sourceName: detail.sourceName,
      }, window.location.origin);
    };
    window.addEventListener("nlkh-tool-import", forwardImport);
    return () => window.removeEventListener("nlkh-tool-import", forwardImport);
  }, [importTarget]);

  const prepareFrame = () => {
    syncPreferences();
    resizeObserverRef.current?.disconnect();

    const frame = frameRef.current;
    const document = frame?.contentDocument;
    if (!frame || !document?.body) return;

    const minimumHeight = tall ? 900 : 760;
    const resize = (reset = false) => {
      if (resizeRafRef.current !== null) cancelAnimationFrame(resizeRafRef.current);

      // Thu khung về mốc chuẩn trước khi đo màn hình mới. Nếu giữ chiều cao cũ,
      // 100vh của trang con có thể lấy chính chiều cao đã phình làm mốc mới.
      if (reset) frame.style.height = `${minimumHeight}px`;

      resizeRafRef.current = requestAnimationFrame(() => {
        const root = document.documentElement;
        const body = document.body;
        const height = Math.ceil(Math.max(
          body.scrollHeight,
          body.offsetHeight,
          root.scrollHeight,
          root.offsetHeight,
          minimumHeight,
        ));

        if (Math.abs(frame.offsetHeight - height) > 1) frame.style.height = `${height}px`;
        resizeRafRef.current = null;
      });
    };

    resizeFrameRef.current = resize;
    resizeObserverRef.current = new ResizeObserver(() => resize());
    resizeObserverRef.current.observe(document.body);
    resizeObserverRef.current.observe(document.documentElement);
    resize(true);
  };

  return (
    <div className={`${styles.frameWrap} ${tall ? styles.tall : ""} ${flush ? styles.flush : ""}`}>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        onLoad={prepareFrame}
        className={styles.frame}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
