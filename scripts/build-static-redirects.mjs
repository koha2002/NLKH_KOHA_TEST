/**
 * Redirects are handled at Cloudflare Edge.
 *
 * IMPORTANT:
 * Do NOT generate meta-refresh / JavaScript redirect HTML into `out/`.
 * Those files can shadow real Next.js static routes (for example /tools)
 * and cause redirect loops / blank "Đang chuyển hướng..." pages.
 *
 * Same-domain canonical redirects are Cloudflare Single Redirects.
 * Cross-domain redirects are Cloudflare Bulk Redirects.
 */
console.log("[redirects] Static redirect fallback disabled; Cloudflare Edge is the source of truth.");