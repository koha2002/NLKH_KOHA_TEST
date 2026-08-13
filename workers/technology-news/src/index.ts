type Env = {
  AI: any;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MANUAL_RUN_TOKEN?: string;
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
const MAX_DRAFTS_PER_RUN = 5;

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

async function scan(env: Env) {
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
        if (score >= 30) candidates.push({ item, score });
      }
    } catch (e: any) {
      sourceErrors.push({ source: source.name, error: String(e?.message || e) });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const created: any[] = [];
  for (const candidate of candidates) {
    if (created.length >= MAX_DRAFTS_PER_RUN) break;
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

  return {
    ok: true,
    model: MODEL,
    sources: SOURCES.length,
    candidates: candidates.length,
    draftsCreated: created.length,
    created,
    sourceErrors,
  };
}

export default {
  async scheduled(_event: any, env: Env, ctx: any) {
    ctx.waitUntil(scan(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
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
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0b0f14;
      color: #e8eef6;
      font: 16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    main {
      width: min(680px, calc(100% - 32px));
      border: 1px solid #263241;
      border-radius: 18px;
      padding: 28px;
      background: #111821;
      box-shadow: 0 18px 60px rgba(0,0,0,.32);
    }
    .eyebrow { color: #8fa8c2; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 8px 0 6px; font-size: 32px; }
    .ok { color: #7ee787; font-weight: 700; }
    dl {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 10px 18px;
      margin: 24px 0;
    }
    dt { color: #8fa8c2; }
    dd { margin: 0; }
    a {
      color: #79c0ff;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    code {
      background: #0b0f14;
      border: 1px solid #263241;
      border-radius: 7px;
      padding: 2px 6px;
    }
    .note {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid #263241;
      color: #aebdca;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">NLKH / AUTOMATION</div>
    <h1>Technology News Automation</h1>
    <p class="ok">● Online</p>

    <dl>
      <dt>Mode</dt><dd>Draft only</dd>
      <dt>AI model</dt><dd>${MODEL}</dd>
      <dt>Daily schedule</dt><dd>06:00 Vietnam time</dd>
      <dt>Max drafts / run</dt><dd>${MAX_DRAFTS_PER_RUN}</dd>
      <dt>Health endpoint</dt><dd><a href="/health">/health</a></dd>
    </dl>

    <p class="note">
      Articles are created as drafts for manual review. Publishing is never automatic.
      Manual execution uses the protected <code>POST /run</code> endpoint.
    </p>
  </main>
</body>
</html>`;

      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "technology-news",
        mode: "draft-only",
        model: MODEL,
        maxDraftsPerRun: MAX_DRAFTS_PER_RUN,
      });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      if (!env.MANUAL_RUN_TOKEN) {
        return Response.json({ error: "Manual run disabled" }, { status: 403 });
      }
      const auth = request.headers.get("Authorization") || "";
      if (auth !== `Bearer ${env.MANUAL_RUN_TOKEN}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      try {
        return Response.json(await scan(env));
      } catch (e: any) {
        return Response.json({ error: String(e?.message || e) }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
