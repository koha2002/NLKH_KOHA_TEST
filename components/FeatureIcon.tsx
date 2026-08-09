import Image from "next/image";

export type FeatureIconName =
  | "profile"
  | "quiz"
  | "pdf"
  | "comtrade"
  | "software"
  | "data";

type FeatureIconProps = {
  name: FeatureIconName;
  size?: number;
  className?: string;
};

type FeatureGraphicProps = {
  icon?: FeatureIconName;
  image?: string;
  size?: number;
  className?: string;
};

export function FeatureGraphic({ icon, image, size = 24, className }: FeatureGraphicProps) {
  if (image) {
    return <Image src={image} alt="" width={size} height={size} className={className} aria-hidden="true" />;
  }

  return <FeatureIcon name={icon ?? "software"} size={size} className={className} />;
}

export function FeatureIcon({ name, size = 24, className }: FeatureIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="8" cy="8" r="3" />
          <path d="M3.5 18.5c.6-3.1 2.1-4.7 4.5-4.7s3.9 1.6 4.5 4.7" />
          <path d="M15 6.5h5.5M15 10.5h5.5M15 14.5h4" />
        </svg>
      );
    case "quiz":
      return (
        <svg {...commonProps}>
          <path d="M6 3.5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
          <path d="m7.5 8 1.3 1.3 2.3-2.6M13.5 8.2h3M7.5 14l1.3 1.3 2.3-2.6M13.5 14.2h3" />
        </svg>
      );
    case "pdf":
      return (
        <svg {...commonProps}>
          <path d="M6 2.8h8l4 4v14.4H6Z" />
          <path d="M14 2.8v4h4M8.5 16.8v-5h1.6a1.6 1.6 0 0 1 0 3.2H8.5M13 16.8v-5h1.2c1.4 0 2.3 1 2.3 2.5s-.9 2.5-2.3 2.5Z" />
        </svg>
      );
    case "comtrade":
      return (
        <svg {...commonProps}>
          <path d="M3 18.5h18M4 15.5l3.1-3.2 2.7 2.2 4.1-6.2 2.7 3.1L20 6.8" />
          <circle cx="7.1" cy="12.3" r=".8" fill="currentColor" stroke="none" />
          <circle cx="13.9" cy="8.3" r=".8" fill="currentColor" stroke="none" />
          <circle cx="20" cy="6.8" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "software":
      return (
        <svg {...commonProps}>
          <rect x="3.2" y="3.2" width="7" height="7" rx="1.4" />
          <rect x="13.8" y="3.2" width="7" height="7" rx="1.4" />
          <rect x="3.2" y="13.8" width="7" height="7" rx="1.4" />
          <path d="M17.3 13.8v7M13.8 17.3h7" />
        </svg>
      );
    case "data":
      return (
        <svg {...commonProps}>
          <ellipse cx="12" cy="5.2" rx="7.8" ry="3" />
          <path d="M4.2 5.2v6c0 1.7 3.5 3 7.8 3s7.8-1.3 7.8-3v-6M4.2 11.2v6c0 1.7 3.5 3 7.8 3s7.8-1.3 7.8-3v-6" />
        </svg>
      );
  }
}
