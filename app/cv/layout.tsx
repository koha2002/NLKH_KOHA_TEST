import { buildMetadata } from "../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../components/AdminSeoJsonLd";
export const metadata=buildMetadata("/cv");
export default function Layout({children}:{children:React.ReactNode}){return <><AdminSeoJsonLd route="/cv"/>{children}</>}
