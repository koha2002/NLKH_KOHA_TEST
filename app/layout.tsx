import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { LanguageProvider } from "../components/LanguageProvider";
import { ScrollToTop } from "../components/ScrollToTop";
import { buildMetadata } from "../lib/admin-seo";
import { AdminSeoJsonLd } from "../components/AdminSeoJsonLd";
import "./globals.css";

export const metadata = buildMetadata("/");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:`(function(){try{var t=localStorage.getItem('koha-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}})();`}} />
      </head>
      <body>
        <AdminSeoJsonLd route="/" />
        <LanguageProvider>
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
        </LanguageProvider>
      </body>
    </html>
  );
}
