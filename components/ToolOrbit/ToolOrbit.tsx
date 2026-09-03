"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { FeatureGraphic } from "../FeatureIcon";
import type { FeatureIconName } from "../FeatureIcon";
import { usePublicTools } from "../usePublicTools";
import { orbitItems, orbitRings, type OrbitRing } from "./orbit.config";
import styles from "./ToolOrbit.module.css";

type ToolOrbitProps = {
  language: "vi" | "en";
};

type OrbitStyle = CSSProperties & {
  "--ring-size": string;
  "--orbit-duration": string;
  "--orbit-direction": "normal" | "reverse";
};

type NodeStyle = CSSProperties & {
  "--node-x": string;
  "--node-y": string;
};

function polarPosition(angle: number, radius = 49) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function getRingStyle(ring: OrbitRing): OrbitStyle {
  return {
    "--ring-size": `${ring.size}%`,
    "--orbit-duration": `${ring.duration}s`,
    "--orbit-direction": ring.reverse ? "reverse" : "normal",
  };
}

function getNodeStyle(angle: number): NodeStyle {
  const position = polarPosition(angle);
  return {
    "--node-x": `${position.x}%`,
    "--node-y": `${position.y}%`,
  };
}

export function ToolOrbit({ language }: ToolOrbitProps) {
  const remote = usePublicTools();
  const rings = remote.rings?.length ? remote.rings.map((ring) => ({ id:ring.id,size:ring.size,duration:ring.duration,reverse:ring.reverse,dashed:ring.dashed,dot:ring.dot_angle === null || ring.dot_angle === undefined ? undefined : { angle:ring.dot_angle,tone:asTone(ring.dot_tone) } })) : orbitRings;
  const staticPages = orbitItems.filter((item) => ["profile","software","data"].includes(item.id));
  const items = remote.tools === null ? orbitItems : [
    ...staticPages,
    ...remote.tools.filter((tool) => tool.show_orbit).map((tool) => ({ id:tool.slug,href:tool.route,label:tool.code,icon:asIcon(tool.icon || tool.slug),image:tool.icon?.startsWith("/") ? tool.icon : undefined,ring:`ring-${tool.orbit_ring}`,angle:tool.orbit_angle,tone:asTone(tool.accent),title:{vi:tool.title_vi,en:tool.title_en} })),
  ];
  return (
    <div
      className={styles.panel}
      aria-label={language === "vi" ? "Hệ sinh thái công cụ" : "Tool ecosystem"}
    >
      <div className={styles.grid} aria-hidden="true" />

      {rings.map((ring) => (
        <div
          className={`${styles.ring} ${ring.dashed ? styles.dashed : ""}`}
          style={getRingStyle(ring)}
          key={ring.id}
        >
          {ring.dot ? (
            <i
              className={`${styles.dot} ${styles[ring.dot.tone]}`}
              style={getNodeStyle(ring.dot.angle)}
              aria-hidden="true"
            />
          ) : null}

          {items
            .filter((item) => item.ring === ring.id)
            .map((item) => (
              <a
                className={`${styles.node} ${styles[item.tone]}`}
                href={item.href}
                style={getNodeStyle(item.angle)}
                title={item.title[language]}
                aria-label={item.title[language]}
                key={item.id}
              >
                <span className={styles.icon}><FeatureGraphic icon={item.icon} image={item.image} size={18} /></span>
                <strong>{item.label}</strong>
              </a>
            ))}
        </div>
      ))}

      <div className={styles.core}>
        <span className={styles.coreHalo} aria-hidden="true" />
        <Image src="/koha-logo-320.webp" alt="KoHa" width={320} height={320} priority />
      </div>
</div>
  );
}

function asTone(value: string) { return (["blue","cyan","orange","violet"].includes(value) ? value : "blue") as "blue" | "cyan" | "orange" | "violet"; }
function asIcon(value: string): FeatureIconName { return (["profile","quiz","pdf","comtrade","software","data"].includes(value) ? value : "software") as FeatureIconName; }
