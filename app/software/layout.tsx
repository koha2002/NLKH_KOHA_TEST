import { buildMetadata } from "../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../components/AdminSeoJsonLd";
export const metadata=buildMetadata("/software");
export default function Layout({children}:{children:React.ReactNode}){return <><AdminSeoJsonLd route="/software"/>{children}</>}
