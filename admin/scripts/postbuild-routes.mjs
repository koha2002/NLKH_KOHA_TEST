import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const appFile = path.join(root, "src", "App.jsx");
const indexFile = path.join(dist, "index.html");

if (!fs.existsSync(indexFile)) {
  throw new Error(`Missing ${indexFile}`);
}
if (!fs.existsSync(appFile)) {
  throw new Error(`Missing ${appFile}`);
}

const app = fs.readFileSync(appFile, "utf8");
const indexHtml = fs.readFileSync(indexFile, "utf8");

// NLKH_ADMIN_STATIC_ROUTE_AUTO_V1
// Extract every literal React Router path from App.jsx.
// Dynamic routes (":id", "*") are intentionally skipped.
// This makes direct URL / reload work for every static Admin page,
// including future pages such as /backup, without maintaining a second route list.
const routeRe = /<Route\b[^>]*\bpath\s*=\s*["']([^"']+)["']/g;
const routes = new Set();

for (const match of app.matchAll(routeRe)) {
  const route = String(match[1] || "").trim();

  if (!route || route === "/" || route === "*") continue;
  if (!route.startsWith("/")) continue;
  if (route.includes(":") || route.includes("*")) continue;

  routes.add(route);
}

for (const route of [...routes].sort()) {
  const relative = route.replace(/^\/+|\/+$/g, "");
  if (!relative) continue;

  const dir = path.join(dist, ...relative.split("/"));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), indexHtml, "utf8");
}

console.log(
  `[admin routes] generated ${routes.size} static route shells: ` +
  [...routes].sort().join(", ")
);