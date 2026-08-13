type Env = {
  AI: any;
  CONFIG: any;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

};

type Source = {
  name: string;
  feed: string;
  baseScore: number;
};

type FeedItem = {
  source: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
};

const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const MAX_ITEMS_PER_SOURCE = 15;

const SETTINGS_KEY = "technology-news-settings";
const LAST_RUN_KEY = "technology-news-last-run";

type Settings = {
  maxDraftsPerRun: number;
  relevanceThreshold: number;
  automationEnabled: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  maxDraftsPerRun: 1,
  relevanceThreshold: 30,
  automationEnabled: true,
};

function normalizeSettings(input: any): Settings {
  const maxDrafts = Number(input?.maxDraftsPerRun);
  const threshold = Number(input?.relevanceThreshold);

  return {
    maxDraftsPerRun:
      Number.isFinite(maxDrafts)
        ? Math.min(20, Math.max(1, Math.round(maxDrafts)))
        : DEFAULT_SETTINGS.maxDraftsPerRun,
    relevanceThreshold:
      Number.isFinite(threshold)
        ? Math.min(100, Math.max(0, Math.round(threshold)))
        : DEFAULT_SETTINGS.relevanceThreshold,
    automationEnabled:
      typeof input?.automationEnabled === "boolean"
        ? input.automationEnabled
        : DEFAULT_SETTINGS.automationEnabled,
  };
}

async function getSettings(env: Env): Promise<Settings> {
  try {
    const saved = await env.CONFIG.get(SETTINGS_KEY, { type: "json" });
    return normalizeSettings(saved);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function putSettings(env: Env, settings: Settings) {
  await env.CONFIG.put(SETTINGS_KEY, JSON.stringify(settings));
}

async function putLastRun(env: Env, value: any) {
  await env.CONFIG.put(LAST_RUN_KEY, JSON.stringify(value));
}

async function getLastRun(env: Env) {
  try {
    return await env.CONFIG.get(LAST_RUN_KEY, { type: "json" });
  } catch {
    return null;
  }
}

type AutomationIdentity = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
};

function getCookie(request: Request, name: string) {
  const header = request.headers.get("Cookie") || "";

  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return "";
}

function getAutomationToken(request: Request) {
  const auth = request.headers.get("Authorization") || "";

  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return getCookie(request, "nlkh_automation_session");
}

async function getAutomationIdentity(
  request: Request,
  env: Env,
): Promise<AutomationIdentity | null> {
  const accessToken = getAutomationToken(request);

  if (!accessToken) return null;

  const base = env.SUPABASE_URL.replace(/\/$/, "");

  // Xác minh access token với Supabase Auth.
  const userResponse = await fetch(`${base}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) return null;

  const user = await userResponse.json() as {
    id?: string;
    email?: string;
  };

  if (!user.id) return null;

  // Dùng server secret để đọc profile + role.
  const profileUrl =
    `${base}/rest/v1/profiles` +
    `?id=eq.${encodeURIComponent(user.id)}` +
    `&select=id,email,display_name,status,roles(permissions)` +
    `&limit=1`;

  const profileResponse = await fetch(profileUrl, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!profileResponse.ok) return null;

  const rows = await profileResponse.json() as any[];
  const profile = rows[0];

  if (!profile || profile.status !== "active") {
    return null;
  }

  const relation = profile.roles;

  const permissions: string[] = Array.isArray(relation)
    ? relation[0]?.permissions ?? []
    : relation?.permissions ?? [];

  // Giữ đúng tiêu chí đang dùng để hiện menu Admin/Automation:
  // active + có ít nhất một permission.
  if (!permissions.length) {
    return null;
  }

  return {
    id: String(profile.id),
    email: String(profile.email || user.email || ""),
    displayName: String(
      profile.display_name ||
      profile.email ||
      user.email ||
      "",
    ),
    permissions,
  };
}
function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// V1: chá»‰ 2 nguá»“n. ThÃªm nguá»“n sau khi cháº¡y á»•n.
// Náº¿u má»™t feed bá»‹ cháº·n/lá»—i, nguá»“n Ä‘Ã³ bá»‹ bá» qua; cron váº«n tiáº¿p tá»¥c nguá»“n khÃ¡c.
const SOURCES: Source[] = [
  {
    name: "Tom's Hardware",
    feed: "https://www.tomshardware.com/feeds/all",
    baseScore: 10,
  },
  {
    name: "All About Circuits",
    feed: "https://www.allaboutcircuits.com/rss",
    baseScore: 12,
  },
];

const RULES: Array<[RegExp, number]> = [
  [/\b(cpu|processor|ryzen|intel|amd|arm|risc-v)\b/i, 24],
  [/\b(gpu|nvidia|radeon|graphics|vram)\b/i, 24],
  [/\b(ram|dram|ddr5|ddr6|memory|hbm)\b/i, 22],
  [/\b(ssd|nand|nvme|pcie|storage)\b/i, 22],
  [/\b(semiconductor|chip|foundry|tsmc|micron|sk hynix)\b/i, 24],
  [/\b(laptop|notebook|motherboard|pc hardware)\b/i, 18],
  [/\b(phone|smartphone|snapdragon|mediatek|dimensity|iphone|android)\b/i, 18],
  [/\b(power electronics|inverter|mosfet|igbt|sic|gan|gate driver|pmic)\b/i, 28],
  [/\b(electrical|electronics|embedded|microcontroller|mcu|sensor|pcb|rf|wireless)\b/i, 22],
  [/\b(ai accelerator|npu|edge ai|data center|server)\b/i, 16],
  [/\b(deal|coupon|discount|sale|giveaway)\b/i, -45],
  [/\b(game review|gaming deal|best deal)\b/i, -30],
];

function cleanXmlText(s = ""): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, names: string[]): string {
  for (const name of names) {
    const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (m?.[1]) return cleanXmlText(m[1]);
  }
  return "";
}

function linkFrom(block: string): string {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i)?.[1];
  if (href) return cleanXmlText(href);
  return tag(block, ["link"]);
}

function parseFeed(xml: string, source: string): FeedItem[] {
  const blocks =
    xml.match(/<item\b[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ||
    [];
  return blocks.slice(0, MAX_ITEMS_PER_SOURCE).map((block) => ({
    source,
    title: tag(block, ["title"]),
    link: linkFrom(block),
    summary: tag(block, ["description", "summary", "content"]),
    publishedAt: tag(block, ["pubDate", "published", "updated"]) || null,
  })).filter((x) => x.title && /^https?:\/\//i.test(x.link));
}

function scoreItem(item: FeedItem, baseScore: number): number {
  const text = `${item.title} ${item.summary}`;
  return RULES.reduce((score, [pattern, delta]) => pattern.test(text) ? score + delta : score, baseScore);
}

function slugify(value: string): string {
  const noMarks = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return noMarks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || `tech-${Date.now()}`;
}

function shortHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function safeJsonText(raw: any): string {
  if (typeof raw === "string") return raw;
  if (raw?.response && typeof raw.response === "string") return raw.response;
  if (raw?.result?.response && typeof raw.result.response === "string") return raw.result.response;
  return JSON.stringify(raw ?? {});
}

function extractJson(raw: string): any {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI did not return JSON");
  return JSON.parse(candidate.slice(start, end + 1));
}

function clip(s: unknown, max: number): string {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((x) => clip(x, 40).toLowerCase()).filter(Boolean))].slice(0, 8);
}

async function sb(env: Env, path: string, init: RequestInit = {}) {
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function alreadySeen(env: Env, sourceUrl: string): Promise<boolean> {
  const q = `technology_news_ingest?select=id&source_url=eq.${encodeURIComponent(sourceUrl)}&limit=1`;
  const rows = await sb(env, q);
  return Array.isArray(rows) && rows.length > 0;
}

async function writeDraft(env: Env, item: FeedItem, ai: any, score: number) {
  const titleVi = clip(ai.title_vi, 100);
  const titleEn = clip(ai.title_en, 100);
  const excerptVi = clip(ai.excerpt_vi, 165);
  const excerptEn = clip(ai.excerpt_en, 165);
  const contentVi = String(ai.content_vi || "").trim();
  const contentEn = String(ai.content_en || "").trim();

  if (!titleVi || !excerptVi || contentVi.length < 450) {
    throw new Error("AI output too thin for SEO/editorial draft");
  }

  const slug = `${slugify(titleEn || titleVi)}-${shortHash(item.link)}`;
  const tags = normalizeTags(ai.tags);

  const article = {
    slug,
    category_id: null,
    title_vi: titleVi,
    title_en: titleEn || null,
    subtitle_vi: clip(ai.subtitle_vi, 180) || null,
    subtitle_en: clip(ai.subtitle_en, 180) || null,
    excerpt_vi: excerptVi,
    excerpt_en: excerptEn || null,
    content_vi: contentVi,
    content_en: contentEn || null,
    status: "draft",
    featured: false,
    allow_comments: false,
    tags,
    source_name: item.source,
    source_url: item.link,
    author_name: "NLKH Technology",
    editor_name: "AI há»— trá»£ biÃªn táº­p",
  };

  const created = await sb(env, "news_articles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(article),
  });

  const articleId = Array.isArray(created) ? created[0]?.id : null;
return { articleId, slug, titleVi };
}

async function generateDraft(env: Env, item: FeedItem) {
  // V1 cá»‘ Ã½ KHÃ”NG táº£i/copy toÃ n bÃ i gá»‘c.
  // Chá»‰ dÃ¹ng metadata RSS/title/summary + URL nguá»“n.
  // Äiá»u nÃ y giáº£m dung lÆ°á»£ng, giáº£m rá»§i ro báº£n quyá»n, vÃ  trÃ¡nh biáº¿n web thÃ nh báº£n sao dá»‹ch mÃ¡y.
  const prompt = `
Báº¡n lÃ  biÃªn táº­p viÃªn tin cÃ´ng nghá»‡/ká»¹ thuáº­t cho nguyenlekhanhhoa.com.

Má»¤C TIÃŠU:
- Táº¡o má»™t Báº¢N NHÃP tin ká»¹ thuáº­t song ngá»¯ VI/EN tá»« metadata nguá»“n bÃªn dÆ°á»›i.
- KhÃ´ng dá»‹ch/copy nguyÃªn vÄƒn bÃ i gá»‘c.
- KhÃ´ng bá»‹a dá»¯ kiá»‡n, thÃ´ng sá»‘, giÃ¡, ngÃ y thÃ¡ng hay phÃ¡t biá»ƒu.
- Náº¿u metadata khÃ´ng Ä‘á»§ Ä‘á»ƒ kháº³ng Ä‘á»‹nh chi tiáº¿t, hÃ£y nÃ³i á»Ÿ má»©c khÃ¡i quÃ¡t vÃ  khuyÃªn biÃªn táº­p viÃªn kiá»ƒm tra nguá»“n gá»‘c.
- Giá»¯ tÃªn hÃ£ng, sáº£n pháº©m, chuáº©n ká»¹ thuáº­t vÃ  model chÃ­nh xÃ¡c theo metadata.
- VÄƒn phong chuyÃªn nghiá»‡p, dá»… Ä‘á»c, cÃ³ giÃ¡ trá»‹ ká»¹ thuáº­t thá»±c táº¿.
- SEO tá»± nhiÃªn, khÃ´ng nhá»“i tá»« khÃ³a.

SEO Báº®T BUá»˜C:
- title_vi vÃ  title_en: rÃµ chá»§ Ä‘á», khoáº£ng 45-65 kÃ½ tá»± náº¿u há»£p lÃ½; khÃ´ng clickbait.
- excerpt_vi vÃ  excerpt_en: khoáº£ng 120-160 kÃ½ tá»±, mÃ´ táº£ Ä‘Ãºng ná»™i dung; dÃ¹ng lÃ m meta description.
- Äoáº¡n Ä‘áº§u pháº£i nÃªu ngay thiáº¿t bá»‹/cÃ´ng nghá»‡/chá»§ Ä‘á» chÃ­nh.
- CÃ³ cÃ¡c heading báº±ng vÄƒn báº£n thuáº§n nhÆ°:
  "Äiá»ƒm chÃ­nh", "Ã nghÄ©a ká»¹ thuáº­t", "TÃ¡c Ä‘á»™ng tá»›i thá»‹ trÆ°á»ng/ngÆ°á»i dÃ¹ng", "Nguá»“n tham kháº£o"
  vÃ  báº£n tiáº¿ng Anh tÆ°Æ¡ng á»©ng.
- content_vi/content_en Æ°u tiÃªn 350-700 tá»« Má»–I NGÃ”N NGá»® khi metadata Ä‘á»§. Náº¿u nguá»“n RSS ngáº¯n, chá»‰ viáº¿t Ä‘á»™ dÃ i tÆ°Æ¡ng xá»©ng; tuyá»‡t Ä‘á»‘i khÃ´ng kÃ©o dÃ i báº±ng suy Ä‘oÃ¡n hoáº·c dá»¯ kiá»‡n khÃ´ng cÃ³.
- Cuá»‘i bÃ i ghi rÃµ: "Nguá»“n tham kháº£o: <tÃªn nguá»“n> â€” <URL>".
- tags: 3-8 tag ká»¹ thuáº­t ngáº¯n, khÃ´ng tag chung chung kiá»ƒu "news".
- KhÃ´ng dÃ¹ng markdown table.
- KhÃ´ng táº¡o URL/canonical giáº£.

PHÃ‚N LOáº I:
category_slug pháº£i lÃ  má»™t trong:
electrical, electronics, semiconductor, pc-hardware, laptop, mobile, ai-hardware, industry

NGUá»’N:
source_name: ${item.source}
source_url: ${item.link}
source_title: ${item.title}
source_published_at: ${item.publishedAt || "unknown"}
source_summary: ${item.summary || "(RSS khÃ´ng cÃ³ summary)"}

Chá»‰ tráº£ JSON há»£p lá»‡ theo schema:
{
  "title_vi": "...",
  "title_en": "...",
  "subtitle_vi": "...",
  "subtitle_en": "...",
  "excerpt_vi": "...",
  "excerpt_en": "...",
  "content_vi": "...",
  "content_en": "...",
  "category_slug": "...",
  "tags": ["..."]
}
`.trim();

  const out = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: "Return valid JSON only. Never invent facts." },
      { role: "user", content: prompt },
    ],
    temperature: 0.25,
    max_tokens: 5000,
  });

  return extractJson(safeJsonText(out));
}

async function scan(env: Env, settings: Settings = DEFAULT_SETTINGS) {
  const candidates: Array<{ item: FeedItem; score: number }> = [];
  const sourceErrors: Array<{ source: string; error: string }> = [];

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.feed, {
        headers: {
          "User-Agent": "NLKH-Technology-NewsBot/1.0 (+https://nguyenlekhanhhoa.com/news)",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      for (const item of parseFeed(xml, source.name)) {
        const score = scoreItem(item, source.baseScore);
        if (score >= settings.relevanceThreshold) candidates.push({ item, score });
      }
    } catch (e: any) {
      sourceErrors.push({ source: source.name, error: String(e?.message || e) });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const created: any[] = [];
  for (const candidate of candidates) {
    if (created.length >= settings.maxDraftsPerRun) break;
    if (await alreadySeen(env, candidate.item.link)) continue;

    // Ghi seen trÆ°á»›c khi AI Ä‘á»ƒ cron sau khÃ´ng láº·p vÃ´ háº¡n náº¿u item lá»—i.
    await sb(env, "technology_news_ingest", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        source_name: candidate.item.source,
        source_url: candidate.item.link,
        source_title: candidate.item.title,
        source_published_at: candidate.item.publishedAt,
        relevance_score: candidate.score,
        ai_model: MODEL,
        state: "processing",
      }),
    });

    try {
      const ai = await generateDraft(env, candidate.item);
      const result = await writeDraft(env, candidate.item, ai, candidate.score);

      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            article_id: result.articleId,
            state: "draft_created",
            last_error: null,
          }),
        },
      );

      created.push({ source: candidate.item.source, score: candidate.score, ...result });
    } catch (e: any) {
      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            state: "error",
            last_error: clip(e?.message || e, 1000),
          }),
        },
      );
    }
  }

  const result = {
    ok: true,
    model: MODEL,
    sources: SOURCES.length,
    candidates: candidates.length,
    draftsCreated: created.length,
    created,
    sourceErrors,
    settings,
    finishedAt: new Date().toISOString(),
  };

  await putLastRun(env, result);
  return result;
}

export default {
  async scheduled(_event: any, env: Env, ctx: any) {
    ctx.waitUntil((async () => {
      const settings = await getSettings(env);

      if (!settings.automationEnabled) {
        await putLastRun(env, {
          ok: true,
          skipped: true,
          reason: "automation-disabled",
          settings,
          finishedAt: new Date().toISOString(),
        });
        return;
      }

      await scan(env, settings);
    })());
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/session" && request.method === "POST") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { error: "Tài khoản không có quyền Automation." },
          { status: 403 },
        );
      }

      const auth = request.headers.get("Authorization") || "";

      if (!auth.startsWith("Bearer ")) {
        return Response.json(
          { error: "Missing access token" },
          { status: 401 },
        );
      }

      const accessToken = auth.slice(7).trim();

      return Response.json(
        {
          ok: true,
          user: {
            id: identity.id,
            email: identity.email,
            displayName: identity.displayName,
          },
        },
        {
          headers: {
            "Set-Cookie":
              `nlkh_automation_session=${encodeURIComponent(accessToken)}; ` +
              "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600",
          },
        },
      );
    }

    if (url.pathname === "/me" && request.method === "GET") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { authenticated: false },
          { status: 401 },
        );
      }

      return Response.json({
        authenticated: true,
        user: {
          id: identity.id,
          email: identity.email,
          displayName: identity.displayName,
        },
      });
    }

    if (url.pathname === "/logout" && request.method === "POST") {
      return Response.json(
        { ok: true },
        {
          headers: {
            "Set-Cookie":
              "nlkh_automation_session=; " +
              "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
          },
        },
      );
    }

    if (url.pathname === "/") {
      const settings = await getSettings(env);
      const lastRun = await getLastRun(env);

      const lastRunText = lastRun
        ? htmlEscape(JSON.stringify(lastRun, null, 2))
        : "No run recorded yet.";

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NLKH Automation</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin:0;
      background:#0b0f14;
      color:#e8eef6;
      font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    main {
      width:min(900px,calc(100% - 32px));
      margin:40px auto;
    }
    .card {
      background:#111821;
      border:1px solid #263241;
      border-radius:18px;
      padding:24px;
      margin-bottom:18px;
    }
    .eyebrow {
      color:#8fa8c2;
      font-size:12px;
      letter-spacing:.12em;
      text-transform:uppercase;
    }
    h1 { margin:6px 0; font-size:32px; }
    h2 { margin:0 0 18px; font-size:20px; }
    .ok { color:#7ee787; font-weight:700; }
    .grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:16px;
    }
    label { display:grid; gap:7px; color:#aebdca; }
    .help {
      color:#8193a6;
      font-size:13px;
      line-height:1.45;
    }
    .help strong {
      color:#aebdca;
      font-weight:600;
    }
    .section-help {
      margin:-8px 0 20px;
      color:#8193a6;
      font-size:14px;
    }
    input[type=number],
    input[type=password] {
      width:100%;
      padding:11px 12px;
      border:1px solid #34465a;
      border-radius:9px;
      background:#0b0f14;
      color:#fff;
    }
    .toggle {
      display:flex;
      align-items:center;
      gap:10px;
      min-height:43px;
    }
    .actions {
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:18px;
    }
    button {
      padding:11px 15px;
      border-radius:9px;
      border:1px solid #3c5269;
      background:#162332;
      color:#fff;
      cursor:pointer;
    }
    button.primary {
      background:#1f6feb;
      border-color:#1f6feb;
    }
    button:disabled { opacity:.5; cursor:not-allowed; }
    pre {
      white-space:pre-wrap;
      overflow-wrap:anywhere;
      background:#0b0f14;
      border:1px solid #263241;
      padding:14px;
      border-radius:10px;
      max-height:420px;
      overflow:auto;
    }
    .meta {
      display:grid;
      grid-template-columns:170px 1fr;
      gap:7px 14px;
      margin-top:20px;
    }
    .meta span:nth-child(odd) { color:#8fa8c2; }
    #message { margin-top:14px; color:#79c0ff; min-height:22px; }
    .note { color:#8fa8c2; font-size:13px; }
    a { color:#79c0ff; }
    @media(max-width:650px) {
      .grid { grid-template-columns:1fr; }
      .meta { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>
<main>
  <section class="card">
    <div class="eyebrow">NLKH / AUTOMATION</div>
    <h1>Technology News Automation</h1>
    <div class="ok">● Online</div>

    <div class="meta">
      <span>Mode</span><span>Draft only</span>
      <span>AI model</span><span>${MODEL}</span>
      <span>Cloudflare cron</span><span>06:00 Vietnam time</span>
      <span>Health</span><span><a href="/health">/health</a></span>
    </div>
  </section>

  <section class="card">
    <h2>Automation settings</h2>
    <p class="section-help">
      Cấu hình cách hệ thống thu thập và tạo bản nháp tin công nghệ.
      Tất cả bài viết chỉ được tạo ở trạng thái Draft; hệ thống không tự xuất bản.
    </p>

    <div class="grid">
      <label>
        Max drafts / run
        <input id="maxDrafts" type="number" min="1" max="20"
          value="${settings.maxDraftsPerRun}" />
        <span class="help">
          Số bài nháp tối đa được tạo trong <strong>mỗi lần chạy</strong>.
          Khuyên dùng <strong>1</strong> khi kiểm tra, sau khi ổn định có thể dùng
          <strong>3–5</strong>. Giá trị cho phép: 1–20.
        </span>
      </label>

      <label>
        Relevance threshold
        <input id="threshold" type="number" min="0" max="100"
          value="${settings.relevanceThreshold}" />
        <span class="help">
          Ngưỡng điểm để một tin được xem là đủ liên quan và chuyển sang AI xử lý.
          Khuyên dùng <strong>30</strong>.
          Điểm càng cao = lọc chặt hơn, ít tin hơn.
          Điểm càng thấp = lấy nhiều tin hơn nhưng có thể kém liên quan.
        </span>
      </label>
    </div>

    <label class="toggle">
      <input id="enabled" type="checkbox"
        ${settings.automationEnabled ? "checked" : ""} />
      <span>
        Enable scheduled automation
        <span class="help" style="display:block;margin-top:3px">
          Bật: hệ thống tự chạy mỗi ngày lúc <strong>06:00 giờ Việt Nam</strong>.
          Tắt: Cloudflare vẫn kích hoạt lịch nhưng Worker sẽ bỏ qua và không tạo bài.
        </span>
      </span>
    </label>

    <div style="margin-top:20px">
      <strong>Quyền quản trị</strong>

      <div id="authStatus" class="help" style="margin-top:6px">
        Đang kiểm tra tài khoản...
      </div>

      <div class="actions">
        <button id="loginAdmin">
          Xác thực bằng tài khoản website
        </button>

        <button id="logoutAdmin">
          Đăng xuất Automation
        </button>
      </div>

      <p class="help">
        Automation sử dụng cùng tài khoản và quyền Quản trị của
        nguyenlekhanhhoa.com. Không cần mật khẩu hoặc token Automation riêng.
      </p>
    </div>
    <div class="actions">
      <button class="primary" id="save">Save settings</button>
      <button id="run">Run now</button>
    </div>

    <div class="help" style="margin-top:10px">
      <strong>Save settings:</strong> lưu cấu hình vào Cloudflare KV và có hiệu lực
      cho các lần chạy tiếp theo.<br />
      <strong>Run now:</strong> chạy crawler + AI ngay lập tức với cấu hình hiện tại.
      Ví dụ Max drafts / run = 1 thì tối đa chỉ tạo 1 Draft.
    </div>

    <div id="message"></div>

    <p class="note">
      Save settings và Run now chỉ hoạt động với tài khoản đã đăng nhập,
      trạng thái active và có quyền quản trị. Mọi bài Automation tạo ra
      luôn ở trạng thái Draft để người quản trị kiểm tra trước khi xuất bản.
    </p>
  </section>

  <section class="card">
    <h2>Last run</h2>
    <p class="section-help">
      Kết quả lần chạy gần nhất. Có thể kiểm tra số tin đạt điều kiện
      (<strong>candidates</strong>), số Draft đã tạo
      (<strong>draftsCreated</strong>), nguồn bị lỗi
      (<strong>sourceErrors</strong>) và thời gian hoàn tất.
    </p>
    <pre id="lastRun">${lastRunText}</pre>
  </section>
</main>

<script>
(() => {
  const WEBSITE_ORIGIN = "https://nguyenlekhanhhoa.com";
  const $ = (id) => document.getElementById(id);
  const message = $("message");

  async function checkAuth() {
    const response = await fetch("/me");
    const status = $("authStatus");

    if (!response.ok) {
      status.textContent =
        "Chưa xác thực quyền quản trị. Hãy bấm nút xác thực bên dưới.";
      return false;
    }

    const body = await response.json();

    status.textContent =
      "Đã xác thực: " +
      (body.user?.displayName || body.user?.email || "Admin");

    return true;
  }

  async function protectedRequest(path, options = {}) {
    const response = await fetch(path, options);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        body.error ||
        ("HTTP " + response.status)
      );
    }

    return body;
  }

  $("loginAdmin").addEventListener("click", () => {
    window.open(
      WEBSITE_ORIGIN + "/automation-auth",
      "nlkhAutomationAuth",
      "width=600,height=650"
    );
  });

  $("logoutAdmin").addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    location.reload();
  });

  window.addEventListener("message", async (event) => {
    if (event.origin !== WEBSITE_ORIGIN) return;

    if (
      event.data?.type !== "nlkh-automation-auth" ||
      !event.data?.accessToken
    ) {
      return;
    }

    const response = await fetch("/session", {
      method: "POST",
      headers: {
        Authorization:
          "Bearer " + event.data.accessToken
      }
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      $("authStatus").textContent =
        body.error ||
        "Tài khoản không có quyền Automation.";
      return;
    }

    $("authStatus").textContent =
      "Đã xác thực: " +
      (
        body.user?.displayName ||
        body.user?.email ||
        "Admin"
      );

    location.reload();
  });

  $("save").addEventListener("click", async () => {
    message.textContent = "Đang lưu cấu hình...";

    try {
      const body = await protectedRequest("/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          maxDraftsPerRun:
            Number($("maxDrafts").value),

          relevanceThreshold:
            Number($("threshold").value),

          automationEnabled:
            $("enabled").checked
        })
      });

      message.textContent = "Đã lưu cấu hình.";

      $("maxDrafts").value =
        body.settings.maxDraftsPerRun;

      $("threshold").value =
        body.settings.relevanceThreshold;

      $("enabled").checked =
        body.settings.automationEnabled;
    } catch (e) {
      message.textContent =
        e.message || String(e);
    }
  });

  $("run").addEventListener("click", async () => {
    const button = $("run");

    button.disabled = true;
    message.textContent = "Đang chạy Automation...";

    try {
      const body = await protectedRequest(
        "/run",
        { method: "POST" }
      );

      message.textContent =
        "Hoàn tất. Draft đã tạo: " +
        (body.draftsCreated ?? 0);

      $("lastRun").textContent =
        JSON.stringify(body, null, 2);
    } catch (e) {
      message.textContent =
        e.message || String(e);
    } finally {
      button.disabled = false;
    }
  });

  void checkAuth();
})();
</script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
          "x-frame-options": "DENY",
        },
      });
    }
    if (url.pathname === "/health") {
      const settings = await getSettings(env);
      return Response.json({
        ok: true,
        service: "technology-news",
        mode: "draft-only",
        model: MODEL,
        ...settings,
      });
    }

    if (url.pathname === "/settings" && request.method === "POST") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      try {
        const input = await request.json();
        const settings = normalizeSettings(input);
        await putSettings(env, settings);
        return Response.json({ ok: true, settings });
      } catch (e: any) {
        return Response.json(
          { error: String(e?.message || e) },
          { status: 400 },
        );
      }
    }

    if (url.pathname === "/run" && request.method === "POST") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      try {
        const settings = await getSettings(env);
        return Response.json(await scan(env, settings));
      } catch (e: any) {
        return Response.json({ error: String(e?.message || e) }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
