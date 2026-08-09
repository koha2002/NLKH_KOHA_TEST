"use client";

import { useEffect, useState } from "react";
import styles from "./ScrollToTop.module.css";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"));

    const update = () => {
      const frameHasScrolled = frames.some((frame) => {
        try {
          return (frame.contentWindow?.scrollY ?? 0) > 180;
        } catch {
          return false;
        }
      });
      setVisible(window.scrollY > 180 || frameHasScrolled);
    };

    const attachFrameScroll = (frame: HTMLIFrameElement) => {
      try {
        frame.contentWindow?.addEventListener("scroll", update, { passive: true });
      } catch {
        // Same-origin tool frames are supported; ignore inaccessible frames.
      }
    };

    const detachFrameScroll = (frame: HTMLIFrameElement) => {
      try {
        frame.contentWindow?.removeEventListener("scroll", update);
      } catch {
        // Ignore inaccessible frames during cleanup.
      }
    };

    const handleFrameLoad = (event: Event) => {
      const frame = event.currentTarget as HTMLIFrameElement;
      attachFrameScroll(frame);
      update();
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    frames.forEach((frame) => {
      attachFrameScroll(frame);
      frame.addEventListener("load", handleFrameLoad);
    });

    return () => {
      window.removeEventListener("scroll", update);
      frames.forEach((frame) => {
        detachFrameScroll(frame);
        frame.removeEventListener("load", handleFrameLoad);
      });
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        frame.contentWindow?.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // Same-origin tool frames allow this; ignore any inaccessible frame.
      }
    });
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      title="Lên đầu trang"
    >
      ↑
    </button>
  );
}
