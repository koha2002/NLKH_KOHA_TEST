import { buildMetadata } from "../../lib/admin-seo";
import { AdminSeoJsonLd } from "../../components/AdminSeoJsonLd";
export const metadata=buildMetadata("/data");
export default function Layout({children}:{children:React.ReactNode}){return <><AdminSeoJsonLd route="/data"/>{children}</>}
