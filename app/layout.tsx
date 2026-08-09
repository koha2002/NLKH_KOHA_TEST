import type { Metadata } from "next";
import { LanguageProvider } from "../components/LanguageProvider";
import { PublicShellProvider } from "../components/PublicShellProvider";
import { SiteChrome } from "../components/SiteChrome";
import { buildRouteMetadata } from "../lib/public/metadata";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildRouteMetadata("/", { title: "Nguyễn Lê Khánh Hòa | Kỹ sư điện", description: "Website cá nhân của Nguyễn Lê Khánh Hòa - kỹ sư điện, sản phẩm số và công cụ làm việc." });
  return { ...metadata, icons: { icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }], shortcut: "/favicon.png", apple: "/favicon.png" } };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('koha-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <LanguageProvider>
          <PublicShellProvider>
            <SiteChrome>{children}</SiteChrome>
          </PublicShellProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
