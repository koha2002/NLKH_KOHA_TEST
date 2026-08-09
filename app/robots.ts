import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "../lib/public/site-content";

/**
 * Cho phép công cụ tìm kiếm thu thập các trang công khai.
 * Đường dẫn dữ liệu riêng không nên đặt trong sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/account/", "/auth/"],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: absoluteSiteUrl("/"),
  };
}
