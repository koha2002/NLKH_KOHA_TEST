type Env = {
  AI: any;
  CONFIG: any;
  BROWSER: any;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

};

type Source = {
  name: string;
  website?: string;
  feed: string;
  baseScore: number;
  type?: "rss" | "html";
  enabled?: boolean;
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
const V55_DRAFT_REPAIR_KEY = "technology-news-v55-draft-repair";
const V55_SOURCE_PRESET_KEY = "technology-news-v55-source-preset";
const V55_SOURCE_PRESET_START_VN = "2026-08-14";

const DEFAULT_SOURCES: Source[] = [
  {
    name: "Tom's Hardware",
    website: "https://www.tomshardware.com",
    feed: "https://www.tomshardware.com/feeds/all",
    baseScore: 10,
    type: "rss",
    enabled: true,
  },

  {
    name: "All About Circuits",
    website: "https://www.allaboutcircuits.com",
    feed: "https://www.allaboutcircuits.com/latest/",
    baseScore: 14,
    type: "html",
    enabled: true,
  },

  {
    name: "Electronic Design - Latest",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22home%22%7D",
    baseScore: 11,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Analog",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fanalog%22%7D",
    baseScore: 12,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Digital ICs",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fdigital-ics%22%7D",
    baseScore: 13,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Embedded",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fembedded%22%7D",
    baseScore: 13,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Power",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fpower%22%7D",
    baseScore: 15,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Industrial",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Findustrial%22%7D",
    baseScore: 14,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Communications",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fcommunications%22%7D",
    baseScore: 11,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Components",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Fcomponents%22%7D",
    baseScore: 12,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - EDA",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Feda%22%7D",
    baseScore: 11,
    type: "rss",
    enabled: true,
  },

  {
    name: "Electronic Design - Test & Measurement",
    feed: "https://www.electronicdesign.com/__rss/website-scheduled-content.xml?input=%7B%22sectionAlias%22%3A%22technologies%2Ftest-measurement%22%7D",
    baseScore: 12,
    type: "rss",
    enabled: true,
  },
];

type Settings = {
  maxDraftsPerRun: number;
  relevanceThreshold: number;
  automationEnabled: boolean;
  sources: Source[];
};

const DEFAULT_SETTINGS: Settings = {
  maxDraftsPerRun: 1,
  relevanceThreshold: 30,
  automationEnabled: true,
  sources: DEFAULT_SOURCES,
};

function normalizeWebsiteUrl(value: string) {
  let text = String(value || "").trim();

  if (!text) return "";

  if (!/^https?:\/\//i.test(text)) {
    text = "https://" + text;
  }

  try {
    const url = new URL(text);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
}

function sameHostOrSubdomain(candidate: URL, website: URL) {
  const a = candidate.hostname.toLowerCase();
  const b = website.hostname.toLowerCase();

  return a === b || a.endsWith("." + b) || b.endsWith("." + a);
}

function extractFeedLinks(html: string, website: URL) {
  const results: string[] = [];

  const regex =
    /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*>/gi;

  const tags = html.match(regex) || [];

  for (const tag of tags) {
    const type =
      tag.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase() || "";

    if (
      !type.includes("rss") &&
      !type.includes("atom") &&
      !type.includes("xml")
    ) {
      continue;
    }

    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];

    if (!href) continue;

    try {
      const url = new URL(href, website);

      if (sameHostOrSubdomain(url, website)) {
        results.push(url.toString());
      }
    } catch {
      // Ignore malformed links.
    }
  }

  return Array.from(new Set(results));
}

async function tryRssSource(
  url: string,
  sourceName: string,
): Promise<{ ok: boolean; items: number }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NLKH-Technology-NewsBot/1.0; +https://nguyenlekhanhhoa.com/news)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { ok: false, items: 0 };
    }

    const text = await response.text();
    const items = parseFeed(text, sourceName);

    return {
      ok: items.length > 0,
      items: items.length,
    };
  } catch {
    return { ok: false, items: 0 };
  }
}

function parseHtmlListing(
  html: string,
  source: Source,
): FeedItem[] {
  const results: FeedItem[] = [];
  const seen = new Set<string>();

  let base: URL;

  try {
    base = new URL(
      source.feed ||
      source.website ||
      "",
    );
  } catch {
    return [];
  }

  const anchorRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;

  const badTitles =
    /^(home|trang chủ|login|log in|join|đăng nhập|đăng ký|menu|more|xem thêm|read more|latest|news|tin tức|articles|blog)$/i;

  const badPaths = [
    "/login",
    "/register",
    "/join",
    "/account",
    "/search",
    "/tag/",
    "/tags/",
    "/category/",
    "/categories/",
    "/author/",
    "/authors/",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
  ];

  while ((match = anchorRegex.exec(html))) {
    const href =
      String(match[1] || "").trim();

    const rawText =
      String(match[2] || "");

    const title =
      rawText
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();

    if (!href || title.length < 12) {
      continue;
    }

    if (badTitles.test(title)) {
      continue;
    }

    let link: URL;

    try {
      link = new URL(
        href,
        base,
      );
    } catch {
      continue;
    }

    if (
      link.protocol !== "http:" &&
      link.protocol !== "https:"
    ) {
      continue;
    }

    const baseHost =
      base.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    const linkHost =
      link.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    if (
      linkHost !== baseHost &&
      !linkHost.endsWith("." + baseHost)
    ) {
      continue;
    }

    const path =
      link.pathname.toLowerCase();

    if (
      path === "/" ||
      badPaths.some(
        (part) => path.includes(part),
      )
    ) {
      continue;
    }

    const segments =
      path
        .split("/")
        .filter(Boolean);

    if (!segments.length) {
      continue;
    }

    const lastSegment =
      segments[
        segments.length - 1
      ] || "";

    const looksLikeArticle =
      path.includes("/news/") ||
      path.includes("/article") ||
      path.includes("/articles/") ||
      path.includes("/technical-") ||
      path.includes("/projects/") ||
      path.includes("/products/") ||
      path.includes("/tech/") ||
      path.includes("/hi-tech/") ||
      lastSegment.length >= 12 ||
      segments.length >= 2;

    if (!looksLikeArticle) {
      continue;
    }

    link.hash = "";

    const canonical =
      link.toString();

    if (seen.has(canonical)) {
      continue;
    }

    seen.add(canonical);

    results.push({
      source: source.name,
      title:
        title.length > 240
          ? title.slice(0, 240).trim()
          : title,
      link: canonical,
      summary: "",
      publishedAt: null,
    });

    if (
      results.length >=
      MAX_ITEMS_PER_SOURCE
    ) {
      break;
    }
  }

  return results;
}
async function tryHtmlSourceCheap(
  url: string,
  sourceName: string,
): Promise<{ ok: boolean; items: number }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NLKH-Technology-NewsBot/1.0; +https://nguyenlekhanhhoa.com/news)",
        Accept:
          "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        items: 0,
      };
    }

    const html = await response.text();

    const source: Source = {
      name: sourceName,
      website: new URL(url).origin,
      feed: url,
      type: "html",
      enabled: true,
      baseScore: 10,
    };

    const items = parseHtmlListing(
      html,
      source,
    );

    return {
      ok: items.length > 0,
      items: items.length,
    };
  } catch {
    return {
      ok: false,
      items: 0,
    };
  }
}
async function tryHtmlSource(
  url: string,
  sourceName: string,
  env: Env,
): Promise<{ ok: boolean; items: number }> {
  try {
    const source: Source = {
      name: sourceName,
      website: url,
      feed: url,
      type: "html",
      enabled: true,
      baseScore: 10,
    };

    const items = await fetchSourceItems(
      source,
      env,
    );

    return {
      ok: items.length > 0,
      items: items.length,
    };
  } catch {
    return {
      ok: false,
      items: 0,
    };
  }
}
function knownSourceForWebsite(
  websiteInput: string,
  sourceName: string,
): Source | null {
  const normalized = normalizeWebsiteUrl(websiteInput);

  if (!normalized) return null;

  let host = "";

  try {
    host = new URL(normalized)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }

  if (host === "allaboutcircuits.com") {
    return {
      name: sourceName || "All About Circuits",
      website: "https://www.allaboutcircuits.com",
      feed: "https://www.allaboutcircuits.com/latest/",
      type: "html",
      enabled: true,
      baseScore: 14,
    };
  }

  return null;
}

type SourceDiscoveryCandidate = {
  website: string;
  feed: string;
  type: "rss" | "html";
  items: number;
  score: number;
  discovery: string;
  label: string;
};

function discoveryScore(
  type: "rss" | "html",
  items: number,
  discovery: string,
) {
  const countBonus = Math.min(items, 30);

  if (discovery === "homepage-rss-link") {
    return 120 + countBonus;
  }

  if (discovery === "common-rss-path") {
    return 105 + countBonus;
  }

  if (type === "rss") {
    return 100 + countBonus;
  }

  if (discovery === "common-html-path") {
    return 60 + countBonus;
  }

  if (discovery === "homepage-html") {
    return 40 + countBonus;
  }

  if (discovery === "browser-homepage") {
    return 35 + countBonus;
  }

  return 30 + countBonus;
}

async function discoverSource(
  websiteInput: string,
  sourceName: string,
  env: Env,
) {
  const normalized =
    normalizeWebsiteUrl(websiteInput);

  if (
    !normalized ||
    !isAllowedFeedUrl(normalized)
  ) {
    throw new Error(
      "Địa chỉ website không hợp lệ.",
    );
  }

  const website = new URL(normalized);

  const candidates: SourceDiscoveryCandidate[] = [];
  const candidateKeys = new Set<string>();

  function addCandidate(
    candidate: SourceDiscoveryCandidate,
  ) {
    const key =
      candidate.type +
      "|" +
      candidate.feed;

    if (candidateKeys.has(key)) {
      return;
    }

    candidateKeys.add(key);
    candidates.push(candidate);
  }

  // ========================================================
  // A. NGUỒN ĐÃ BIẾT RÕ
  //
  // AAC RSS bị chặn, nên dùng /latest/ bằng Browser Run.
  // Chỉ 1 Browser Run request.
  // ========================================================

  const known =
    knownSourceForWebsite(
      websiteInput,
      sourceName,
    );

  if (known) {
    try {
      const items = await fetchSourceItems(
        known,
        env,
      );

      if (items.length) {
        addCandidate({
          website:
            known.website ||
            website.origin,

          feed: known.feed,

          type:
            known.type === "html"
              ? "html"
              : "rss",

          items: items.length,

          score:
            known.type === "html"
              ? 90 + Math.min(items.length, 30)
              : 130 + Math.min(items.length, 30),

          discovery:
            "known-source",

          label:
            "Cấu hình tương thích đã biết",
        });
      }
    } catch {
      // Không dừng discovery.
    }
  }

  // ========================================================
  // B. HOMEPAGE - FETCH THƯỜNG
  // Tìm RSS khai báo + thử homepage HTML.
  // ========================================================

  try {
    const homepageResponse =
      await fetch(website.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NLKH-Technology-NewsBot/1.0; +https://nguyenlekhanhhoa.com/news)",

          Accept:
            "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",

          "Accept-Language":
            "en-US,en;q=0.9",
        },

        redirect: "follow",
      });

    if (homepageResponse.ok) {
      const html =
        await homepageResponse.text();

      // RSS/Atom do website tự khai báo.
      const feeds =
        extractFeedLinks(
          html,
          website,
        );

      for (const feed of feeds) {
        const result =
          await tryRssSource(
            feed,
            sourceName,
          );

        if (!result.ok) {
          continue;
        }

        addCandidate({
          website: website.origin,
          feed,
          type: "rss",
          items: result.items,

          score: discoveryScore(
            "rss",
            result.items,
            "homepage-rss-link",
          ),

          discovery:
            "homepage-rss-link",

          label:
            "RSS/Atom do website khai báo",
        });
      }

      // Homepage HTML bằng parser nhẹ.
      const homepageSource: Source = {
        name: sourceName,
        website: website.origin,
        feed: website.toString(),
        type: "html",
        enabled: true,
        baseScore: 10,
      };

      const homepageItems =
        parseHtmlListing(
          html,
          homepageSource,
        );

      if (homepageItems.length) {
        addCandidate({
          website: website.origin,
          feed: website.toString(),
          type: "html",
          items: homepageItems.length,

          score: discoveryScore(
            "html",
            homepageItems.length,
            "homepage-html",
          ),

          discovery:
            "homepage-html",

          label:
            "Trang chủ",
        });
      }
    }
  } catch {
    // Website có thể chặn fetch thường.
  }

  // ========================================================
  // C. RSS PATH PHỔ BIẾN
  //
  // Không dùng Browser Run.
  // ========================================================

  const rssPaths = [
    "/feed",
    "/feed/",
    "/rss",
    "/rss/",
    "/rss.xml",
    "/feed.xml",
    "/atom.xml",
    "/index.xml",
  ];

  for (const path of rssPaths) {
    const candidateUrl =
      new URL(
        path,
        website,
      ).toString();

    const result =
      await tryRssSource(
        candidateUrl,
        sourceName,
      );

    if (!result.ok) {
      continue;
    }

    addCandidate({
      website: website.origin,
      feed: candidateUrl,
      type: "rss",
      items: result.items,

      score: discoveryScore(
        "rss",
        result.items,
        "common-rss-path",
      ),

      discovery:
        "common-rss-path",

      label:
        "RSS/Atom phát hiện tự động",
    });
  }

  // ========================================================
  // D. HTML PATH PHỔ BIẾN
  //
  // QUAN TRỌNG:
  // chỉ fetch thường ở đây.
  // KHÔNG mở Browser Run cho từng path nữa.
  // ========================================================

  const htmlPaths = [
    "/latest/",
    "/latest",
    "/news/",
    "/news",
    "/articles/",
    "/articles",
    "/blog/",
    "/blog",
    "/technology/",
    "/technology",
    "/tech/",
    "/tech",
    "/hi-tech/",
    "/hi-tech",
  ];

  for (const path of htmlPaths) {
    const candidateUrl =
      new URL(
        path,
        website,
      ).toString();

    const result =
      await tryHtmlSourceCheap(
        candidateUrl,
        sourceName,
      );

    if (!result.ok) {
      continue;
    }

    addCandidate({
      website: website.origin,
      feed: candidateUrl,
      type: "html",
      items: result.items,

      score: discoveryScore(
        "html",
        result.items,
        "common-html-path",
      ),

      discovery:
        "common-html-path",

      label:
        "Trang danh sách bài",
    });
  }

  // ========================================================
  // E. NẾU FETCH THƯỜNG KHÔNG TÌM ĐƯỢC HTML
  //
  // Browser Run CHỈ 1 LẦN cho homepage.
  // Không spam 10+ quick actions.
  // ========================================================

  const hasHtmlCandidate =
    candidates.some(
      (candidate) =>
        candidate.type === "html",
    );

  if (!hasHtmlCandidate) {
    try {
      const browserSource: Source = {
        name: sourceName,
        website: website.origin,
        feed: website.toString(),
        type: "html",
        enabled: true,
        baseScore: 10,
      };

      const browserItems =
        await fetchSourceItems(
          browserSource,
          env,
        );

      if (browserItems.length) {
        addCandidate({
          website: website.origin,
          feed: website.toString(),
          type: "html",
          items: browserItems.length,

          score: discoveryScore(
            "html",
            browserItems.length,
            "browser-homepage",
          ),

          discovery:
            "browser-homepage",

          label:
            "Trang chủ qua Browser Run",
        });
      }
    } catch (error: any) {
      // Chỉ ghi nhận nếu cuối cùng không có nguồn nào.
    }
  }

  // ========================================================
  // F. KHÔNG CÓ NGUỒN NÀO
  // ========================================================

  if (!candidates.length) {
    throw new Error(
      "Không tìm được RSS/Atom hoặc trang web nào đọc được bài viết.",
    );
  }

  // ========================================================
  // G. CHỌN NGUỒN TỐT NHẤT
  // ========================================================

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      b.items - a.items,
  );

  const best =
    candidates[0];

  return {
    website: website.origin,

    feed: best.feed,
    type: best.type,
    items: best.items,
    score: best.score,

    discovery:
      best.discovery,

    label:
      best.label,

    alternatives:
      candidates
        .slice(1, 6)
        .map((candidate) => ({
          feed:
            candidate.feed,

          type:
            candidate.type,

          items:
            candidate.items,

          score:
            candidate.score,

          label:
            candidate.label,
        })),
  };
}
function isAllowedFeedUrl(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "::1" ||
      host.startsWith("127.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function normalizeSettings(input: any): Settings {
  const maxDrafts = Number(input?.maxDraftsPerRun);
  const threshold = Number(input?.relevanceThreshold);

  const rawSources = Array.isArray(input?.sources)
    ? input.sources
    : DEFAULT_SOURCES;

  const sources = rawSources
    .map((source: any) => ({
      name: String(source?.name || "").trim(),
      website: (() => {
        const raw = String(
          source?.website ||
          source?.feed ||
          "",
        ).trim();

        try {
          return new URL(raw).origin;
        } catch {
          return raw;
        }
      })(),

      feed: String(
        source?.feed ||
        source?.website ||
        "",
      ).trim(),
      baseScore: Math.min(
        100,
        Math.max(-100, Math.round(Number(source?.baseScore) || 0)),
      ),
      type: source?.type === "html" ? "html" : "rss",
      enabled: source?.enabled !== false,
    }))
    .filter(
      (source: Source) =>
        Boolean(source.name) &&
        isAllowedFeedUrl(source.feed),
    )
    .slice(0, 50);

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
    sources: sources.length ? sources : DEFAULT_SOURCES,
  };
}

async function maybeApplyV55SourcePreset(
  env: Env,
  settings: Settings,
): Promise<Settings> {
  try {
    const todayVn = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (todayVn < V55_SOURCE_PRESET_START_VN) {
      return settings;
    }

    const alreadyApplied = await env.CONFIG.get(V55_SOURCE_PRESET_KEY);
    if (alreadyApplied) {
      return settings;
    }

    const recommended = new Set([
      "Tom's Hardware",
      "All About Circuits",
      "Electronic Design - Digital ICs",
      "Electronic Design - Embedded",
      "Electronic Design - Power",
      "Electronic Design - EDA",
      "Electronic Design - Test & Measurement",
    ]);

    const next: Settings = {
      ...settings,
      sources: Array.isArray(settings.sources)
        ? settings.sources.map((source) =>
            recommended.has(source.name)
              ? { ...source, enabled: true }
              : source,
          )
        : settings.sources,
    };

    await env.CONFIG.put(
      SETTINGS_KEY,
      JSON.stringify(next),
    );

    await env.CONFIG.put(
      V55_SOURCE_PRESET_KEY,
      JSON.stringify({
        appliedAt: new Date().toISOString(),
        startDateVietnam: V55_SOURCE_PRESET_START_VN,
        enabledSources: [...recommended],
      }),
    );

    return next;
  } catch {
    return settings;
  }
}
async function getSettings(env: Env): Promise<Settings> {
  try {
    const saved = await env.CONFIG.get(SETTINGS_KEY, { type: "json" });
    return await maybeApplyV55SourcePreset(env, normalizeSettings(saved));
  } catch {
    return await maybeApplyV55SourcePreset(env, DEFAULT_SETTINGS);
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
function formatVietnamDateTime(value: unknown): string {
  if (!value) return "Không có dữ liệu";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSourceRows(sources: Source[]) {
  return sources
    .map((source) =>
      '<div class="sourceRow" data-source-row>' +
        '<label>' +
          '<span>Tên nguồn</span>' +
          '<input type="text" data-source-name value="' +
            htmlEscape(source.name) +
          '" placeholder="Ví dụ: Tom&apos;s Hardware" />' +
          '<span class="help">' +
            'Tên để người quản trị nhận biết nguồn tin. ' +
            'Ví dụ: Tom&apos;s Hardware, All About Circuits.' +
          '</span>' +
        '</label>' +

        '<label>' +
          '<span>Website</span>' +
          '<input type="url" data-source-website value="' +
            htmlEscape(source.website || source.feed) +
          '" placeholder="https://example.com" />' +
          '<span class="help">' +
            'Chỉ cần nhập tên miền hoặc địa chỉ website. ' +
            'Ví dụ: https://www.allaboutcircuits.com. ' +
            'Automation sẽ tự tìm RSS/Atom hoặc trang bài mới.' +
          '</span>' +
        '</label>' +

        '<div class="sourceAdvanced">' +
          '<details>' +
            '<summary>Cài đặt nâng cao</summary>' +

            '<label>' +
              '<span>Loại nguồn đã phát hiện</span>' +
              '<select data-source-type>' +
                '<option value="rss"' +
                  (source.type !== "html" ? " selected" : "") +
                '>RSS / Atom</option>' +
                '<option value="html"' +
                  (source.type === "html" ? " selected" : "") +
                '>Trang web</option>' +
              '</select>' +
              '<span class="help">' +
                'Thông thường không cần chỉnh tay mục này.' +
              '</span>' +
            '</label>' +

            '<label>' +
              '<span>Đường dẫn thực tế Automation sử dụng</span>' +
              '<input type="url" data-source-feed value="' +
                htmlEscape(source.feed) +
              '" placeholder="https://example.com/feed.xml" />' +
              '<span class="help">' +
                'Được điền tự động sau khi bấm Tự tìm nguồn. ' +
                'Chỉ sửa tay khi bạn biết chính xác RSS hoặc trang danh sách bài.' +
              '</span>' +
            '</label>' +
          '</details>' +
        '</div>' +

        '<label>' +
          '<span>Điểm ưu tiên nguồn</span>' +
          '<input type="number" data-source-score min="-100" max="100" value="' +
            htmlEscape(source.baseScore) +
          '" />' +
          '<span class="help">' +
            'Điểm cộng ban đầu cho mọi tin từ nguồn này. ' +
            'Khuyên dùng 10–15; nếu chưa chắc thì để 10.' +
          '</span>' +
        '</label>' +

        '<label class="toggle">' +
          '<input type="checkbox" data-source-enabled' +
            (source.enabled !== false ? " checked" : "") +
          ' />' +
          '<span>' +
            'Bật nguồn này' +
            '<span class="help" style="display:block">' +
              'Bỏ chọn để tạm ngừng quét nguồn nhưng vẫn giữ cấu hình.' +
            '</span>' +
          '</span>' +
        '</label>' +

        '<div class="sourceActions">' +
          '<button type="button" data-discover-source>Tự tìm nguồn</button>' +
          '<button type="button" data-test-source>Kiểm tra lại</button>' +
          '<button type="button" data-remove-source>Xóa nguồn</button>' +
        '</div>' +

        '<div class="sourceResult" data-source-result></div>' +
      '</div>'
    )
    .join("");
}

// V1: chá»‰ 2 nguá»“n. ThÃªm nguá»“n sau khi cháº¡y á»•n.
// Náº¿u má»™t feed bá»‹ cháº·n/lá»—i, nguá»“n Ä‘Ã³ bá»‹ bá» qua; cron váº«n tiáº¿p tá»¥c nguá»“n khÃ¡c.


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
  if (!res.ok) {
    throw new Error(
      `Supabase ${res.status}: ${text.slice(0, 4000)}`
    );
  }
  return text ? JSON.parse(text) : null;
}

type IngestRecord = {
  id: string;
  state?: string | null;
  article_id?: string | null;
  last_error?: string | null;
};

async function getIngestRecord(
  env: Env,
  sourceUrl: string,
): Promise<IngestRecord | null> {
  const q =
    `technology_news_ingest` +
    `?select=id,state,article_id,last_error` +
    `&source_url=eq.${encodeURIComponent(sourceUrl)}` +
    `&limit=1`;

  const rows = await sb(env, q);

  if (!Array.isArray(rows) || !rows.length) {
    return null;
  }

  return rows[0] as IngestRecord;
}

function ingestAlreadyHasDraft(
  record: IngestRecord | null,
) {
  return Boolean(
    record &&
    (
      record.article_id ||
      record.state === "draft_created"
    )
  );
}


async function resolveTechnologyCategoryId(
  env: Env,
): Promise<string | null> {
  try {
    const rows: any =
      await sb(
        env,
        "news_categories?select=id,slug,visible,sort_order&visible=eq.true&order=sort_order.asc",
      );

    if (!Array.isArray(rows) || !rows.length) {
      return null;
    }

    const preferred =
      rows.find(
        (row: any) =>
          String(row?.slug || "").toLowerCase() ===
          "congnghe",
      ) || rows[0];

    return preferred?.id
      ? String(preferred.id)
      : null;
  } catch {
    return null;
  }
}
async function writeDraft(env: Env, item: FeedItem, ai: any, score: number) {
  const titleVi =
    clip(ai.title_vi, 100);

  const titleEn =
    clip(ai.title_en, 100);

  const excerptVi =
    clip(
      ai.excerpt_vi ||
      item.summary ||
      ai.content_vi ||
      item.title,
      165,
    );

  const excerptEn =
    clip(
      ai.excerpt_en ||
      item.summary ||
      ai.content_en ||
      item.title,
      165,
    );

  let contentVi =
    String(ai.content_vi || "").trim();

  let contentEn =
    String(ai.content_en || "").trim();

  // Draft-only workflow:
  // Không loại toàn bộ bài chỉ vì AI viết ngắn.
  // Người quản trị vẫn phải duyệt trước khi xuất bản.
  if (!contentVi && item.summary) {
    contentVi =
      String(item.summary).trim();
  }

  if (!contentEn && item.summary) {
    contentEn =
      String(item.summary).trim();
  }

  if (!titleVi) {
    throw new Error(
      "Không tạo được Draft: thiếu tiêu đề",
    );
  }

  // Không tạo Draft rỗng hoặc gần như rỗng.
  if (contentVi.length < 1200) {
    throw new Error(
      `Không tạo được Draft: content_vi quá ngắn (${contentVi.length} ký tự; yêu cầu >= 1200)`,
    );
  }

  // Không chấp nhận việc copy tiêu đề tiếng Anh sang trường tiếng Việt.
  if (
    titleEn &&
    titleVi.trim().toLowerCase() ===
      titleEn.trim().toLowerCase()
  ) {
    throw new Error(
      "Không tạo được Draft: title_vi chưa được viết bằng tiếng Việt",
    );
  }

  // Không chấp nhận content_vi giống hệt content_en.
  if (
    contentEn &&
    contentVi.trim().toLowerCase() ===
      contentEn.trim().toLowerCase()
  ) {
    throw new Error(
      "Không tạo được Draft: content_vi chưa được viết bằng tiếng Việt",
    );
  }

  if (!titleEn) throw new Error("Không tạo được Draft: thiếu title_en");
  if (!excerptEn) throw new Error("Không tạo được Draft: thiếu excerpt_en");
  if (!contentEn.trim()) throw new Error("Không tạo được Draft: thiếu nội dung tiếng Anh");
  let slugBase = slugify(ai.seo_slug || titleEn || titleVi).replace(/-+$/g, "").slice(0, 68).replace(/-+$/g, "");
  if (!slugBase) slugBase = slugify(titleVi);

  let slug = slugBase;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const candidateSlug = attempt === 1 ? slugBase : `${slugBase}-${attempt}`;
    const existing = await sb(env, `news_articles?select=id&slug=eq.${encodeURIComponent(candidateSlug)}&limit=1`);
    if (!Array.isArray(existing) || existing.length === 0) {
      slug = candidateSlug;
      break;
    }
    if (attempt === 20) throw new Error(`Không tìm được slug duy nhất cho ${slugBase}`);
  }
  const tags = normalizeTags(ai.tags);

  const article = {
    slug,
    category_id: null,
    title_vi: titleVi,
    title_en: titleEn || "",
    subtitle_vi: clip(ai.subtitle_vi, 180) || "",
    subtitle_en: clip(ai.subtitle_en, 180) || "",
    excerpt_vi: excerptVi,
    excerpt_en: excerptEn || "",
    content_vi: contentVi,
    content_en: contentEn || "",
    status: "draft",
    published_at: new Date().toISOString(),
    featured: false,
    allow_comments: false,
    tags,
    source_name: item.source,
    source_url: item.link,
    author_name: "NLKH Technology",
    editor_name: "AI hỗ trợ biên tập",
  };

  const created = await sb(env, "news_articles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(article),
  });

  const articleId = Array.isArray(created) ? created[0]?.id : null;
return { articleId, slug, titleVi };
}



type SourceImageCandidate = {
  url: string;
  hint: string;
};

async function findSourceImageCandidates(
  item: FeedItem,
): Promise<SourceImageCandidate[]> {
  try {
    const response = await fetch(item.link, {
      headers: {
        "User-Agent": "NLKH-Technology-NewsBot/1.0 (+https://nguyenlekhanhhoa.com/news)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      },
      redirect: "follow",
    });
    if (!response.ok) return [];

    const html = await response.text();
    const baseUrl = response.url || item.link;
    const found: SourceImageCandidate[] = [];
    const normalized = new Set<string>();

    const decode = (raw: string) =>
      raw
        .replace(/\\u002F/gi, "/")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#47;/g, "/")
        .trim();

    const cleanHint = (raw: string) =>
      String(raw || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 320);

    const push = (
      raw: string | undefined,
      hint = "",
    ) => {
      if (!raw) return;
      try {
        const decoded = decode(raw);
        if (!decoded || /^data:/i.test(decoded)) return;

        const url = new URL(decoded, baseUrl);
        if (!["http:", "https:"].includes(url.protocol)) return;

        const text = url.toString();
        if (
          /logo|icon|avatar|badge|sprite|emoji|tracking|pixel|author|profile|newsletter|advert|adsystem/i.test(
            text,
          )
        ) return;

        const pathKey =
          `${url.origin}${url.pathname}`
            .replace(/[-_]\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, "")
            .replace(/\/(?:resize|width|height)\/\d+/ig, "")
            .toLowerCase();

        if (normalized.has(pathKey)) return;
        normalized.add(pathKey);

        found.push({
          url: text,
          hint: cleanHint(hint),
        });
      } catch {}
    };

    const pushSrcset = (
      raw: string | undefined,
      hint = "",
    ) => {
      if (!raw) return;
      const candidates =
        decode(raw)
          .split(",")
          .map((part) => {
            const bits=part.trim().split(/\s+/);
            const descriptor=bits[1]||"";
            const numeric=parseInt(descriptor,10)||0;
            return {url:bits[0]||"",numeric};
          })
          .filter((x)=>x.url)
          .sort((a,b)=>b.numeric-a.numeric);

      if(candidates[0])push(candidates[0].url,hint);
    };

    // Social/hero image comes first.
    const metaPatterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/ig,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/ig,
    ];
    for (const pattern of metaPatterns) {
      for (const match of html.matchAll(pattern)) {
        push(match[1], item.title);
      }
    }

    const articleHtml =
      html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ||
      html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ||
      html;

    // Figure blocks preserve semantic caption context.
    for (const figure of articleHtml.matchAll(/<figure\b[\s\S]*?<\/figure>/ig)) {
      const block=figure[0];
      const img=block.match(/<img\b[^>]*>/i)?.[0]||"";
      if(!img)continue;

      const alt=img.match(/\balt=["']([^"']*)["']/i)?.[1]||"";
      const title=img.match(/\btitle=["']([^"']*)["']/i)?.[1]||"";
      const caption=block.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]||"";
      const hint=[alt,title,caption].filter(Boolean).join(" | ");

      const srcset=
        img.match(/\b(?:srcset|data-srcset|data-lazy-srcset)=["']([^"']+)["']/i)?.[1];
      if(srcset)pushSrcset(srcset,hint);
      else{
        const src=
          img.match(/\b(?:src|data-src|data-lazy-src|data-original|data-image|data-url)=["']([^"']+)["']/i)?.[1];
        push(src,hint);
      }

      if(found.length>=14)break;
    }

    // Remaining img tags.
    if(found.length<10){
      for (const tag of articleHtml.matchAll(/<img\b[^>]*>/ig)) {
        const rawTag=tag[0];
        const alt=rawTag.match(/\balt=["']([^"']*)["']/i)?.[1]||"";
        const title=rawTag.match(/\btitle=["']([^"']*)["']/i)?.[1]||"";
        const hint=[alt,title].filter(Boolean).join(" | ");

        const srcset=
          rawTag.match(/\b(?:srcset|data-srcset|data-lazy-srcset)=["']([^"']+)["']/i)?.[1];
        if(srcset)pushSrcset(srcset,hint);
        else{
          const src=
            rawTag.match(/\b(?:src|data-src|data-lazy-src|data-original|data-image|data-url)=["']([^"']+)["']/i)?.[1];
          push(src,hint);
        }
        if(found.length>=14)break;
      }
    }

    return found.slice(0,12);
  } catch {
    return [];
  }
}

async function ingestNewsMedia(
  env: Env,
  articleId: string,
  sourceImageUrl: string,
  role: "cover" | "inline",
  sortOrder: number,
): Promise<any> {
  const endpoint =
    `${env.SUPABASE_URL.replace(/\/$/,"")}/functions/v1/news-media-ingest`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      article_id: articleId,
      source_image_url: sourceImageUrl,
      role,
      sort_order: sortOrder,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `news-media-ingest HTTP ${response.status}: ${text.slice(0, 800)}`,
    );
  }
  return JSON.parse(text);
}

type PlacedNewsImage = {
  url: string;
  hint: string;
  mediaId: string;
};

async function placeInlineImagesWithAi(
  env: Env,
  markdown: string,
  images: PlacedNewsImage[],
  language: "vi" | "en",
): Promise<string> {
  const original=String(markdown||"").trim();
  if(!original||!images.length)return original;

  const usable=images.slice(0,4);
  const mediaList=usable.map((img,index)=>
    `IMAGE_${index+1}
URL: ${img.url}
SOURCE_HINT: ${img.hint||"(none)"}`
  ).join("\n\n");

  const vi=language==="vi";
  const prompt=vi
    ? `
Bạn là biên tập viên bố cục cho một bài công nghệ TIẾNG VIỆT.

NHIỆM VỤ DUY NHẤT:
- Giữ nguyên toàn bộ thông tin và ý nghĩa của Markdown gốc.
- Chèn các ảnh R2 vào đúng đoạn mà ảnh minh họa tốt nhất.
- KHÔNG dồn ảnh liên tiếp.
- KHÔNG dùng một ảnh quá một lần.
- Nếu nhiều ảnh có nội dung tương tự nhau, chỉ dùng ảnh hữu ích nhất.
- Không chèn ảnh ngay sát nhau; ưu tiên cách nhau ít nhất một mục/đoạn có nội dung.
- Caption của ảnh PHẢI là tiếng Việt tự nhiên, ngắn, mô tả đúng SOURCE_HINT và ngữ cảnh bài.
- Không để caption/heading tiếng Anh, trừ tên riêng, model, thương hiệu và thuật ngữ bắt buộc.
- Không thêm "Hình 1", "Ảnh 1" máy móc nếu không cần.
- Chỉ chèn theo đúng Markdown:
  ![caption tiếng Việt](URL)
- Không tạo URL mới.
- Không đổi tiêu đề, số liệu, bảng, kết luận hay nội dung bài.
- Nếu một ảnh không phù hợp với bất kỳ đoạn nào, có thể bỏ ảnh đó.

ẢNH CÓ THỂ DÙNG:
${mediaList}

MARKDOWN GỐC:
${original}

TRẢ VỀ DUY NHẤT MARKDOWN HOÀN CHỈNH SAU KHI CHÈN ẢNH.
`.trim()
    : `
You are laying out an ENGLISH technology article.

ONLY TASK:
- Preserve the original Markdown's facts and meaning.
- Insert R2 images where each image best illustrates the surrounding section.
- Never stack images consecutively.
- Use each image at most once.
- If images are semantically repetitive, use only the most useful one.
- Prefer at least one substantive paragraph/section between images.
- Write short natural English captions based on SOURCE_HINT and article context.
- Insert only as:
  ![English caption](URL)
- Never invent a URL.
- Do not change headings, numbers, tables, conclusions or article facts.
- An irrelevant image may be omitted.

AVAILABLE IMAGES:
${mediaList}

ORIGINAL MARKDOWN:
${original}

RETURN ONLY THE COMPLETE MARKDOWN AFTER IMAGE PLACEMENT.
`.trim();

  try{
    const response=await runAiTracked(
      env,
      {
        messages:[
          {
            role:"system",
            content:vi
              ?"Chỉ làm bố cục ảnh cho bài tiếng Việt. Không viết lại bài. Không được trả tiếng Anh ngoài tên riêng/model/thuật ngữ bắt buộc."
              :"Only place images in the English article. Do not rewrite the article."
          },
          {role:"user",content:prompt}
        ],
        temperature:0.1,
        max_tokens:8000,
      },
    );

    const placed=
      cleanAiResponse(
        aiResponseText(response),
      );

    // Never overwrite a valid article with a malformed AI wrapper/result.
    if(
      !placed ||
      placed==="[object Object]" ||
      placed.length < Math.max(120, Math.floor(original.length*0.65))
    ){
      return original;
    }

    // Safety: every inserted image URL must be one we supplied.
    const allowed=new Set(usable.map((x)=>x.url));
    for(const match of placed.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)){
      if(!allowed.has(match[1]))return original;
    }

    return placed;
  }catch{
    return original;
  }
}

function htmlToArticleText(html: string): string {
  let text = String(html || "");

  text = text
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Ưu tiên phần article/main nếu trang có cấu trúc semantic.
  const articleMatch =
    text.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);

  const mainMatch =
    text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);

  if (articleMatch?.[1]) {
    text = articleMatch[1];
  } else if (mainMatch?.[1]) {
    text = mainMatch[1];
  }

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

async function fetchArticleText(
  env: Env,
  item: FeedItem,
): Promise<string> {
  let html = "";

  try {
    const res = await fetch(item.link, {
      headers: {
        "User-Agent":
          "NLKH-Technology-NewsBot/1.0 (+https://nguyenlekhanhhoa.com/news)",
        Accept:
          "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      },
      redirect: "follow",
    });

    if (res.ok) {
      html = await res.text();
    }
  } catch {
    // Browser Run fallback bên dưới.
  }

  let articleText =
    htmlToArticleText(html);

  // Nếu fetch thường bị anti-bot hoặc nội dung quá ít,
  // thử Browser Run đã có sẵn trong Worker.
  if (
    articleText.length < 1200 &&
    env.BROWSER
  ) {
    try {
      const rendered =
        await browserQuickActionWithRetry(
          env,
          "content",
          {
            url: item.link,
          },
        );

      let renderedHtml = "";

      if (typeof rendered === "string") {
        renderedHtml = rendered;
      } else if (
        typeof rendered?.content === "string"
      ) {
        renderedHtml = rendered.content;
      } else if (
        typeof rendered?.result === "string"
      ) {
        renderedHtml = rendered.result;
      }

      const browserText =
        htmlToArticleText(renderedHtml);

      if (
        browserText.length >
        articleText.length
      ) {
        articleText = browserText;
      }
    } catch {
      // Không làm hỏng pipeline.
    }
  }

  // RSS summary vẫn là fallback cuối cùng.
  if (articleText.length < 300) {
    articleText =
      String(item.summary || "").trim();
  }
  return articleText;
}
const AI_DAILY_FREE_NEURONS = 10000;
const AI_INPUT_NEURONS_PER_M = 4625;
const AI_OUTPUT_NEURONS_PER_M = 30475;
const AI_USAGE_PREFIX = "technology-news-ai-usage";

function aiUsageDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function aiUsageKey(date = new Date()): string {
  return `${AI_USAGE_PREFIX}:${aiUsageDay(date)}`;
}

async function getAiUsage(env: Env): Promise<any> {
  const day = aiUsageDay();
  const empty = {
    day,
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    neuronsUsed: 0,
    neuronsRemaining: AI_DAILY_FREE_NEURONS,
    percentUsed: 0,
    resetAtUtc: `${day}T24:00:00Z`,
    scope: "automation-estimate",
  };

  try {
    const saved: any =
      await env.CONFIG.get(
        aiUsageKey(),
        { type: "json" },
      );

    if (!saved) return empty;

    const used =
      Math.max(
        0,
        Number(saved.neuronsUsed || 0),
      );

    return {
      ...empty,
      ...saved,
      neuronsUsed: used,
      neuronsRemaining:
        Math.max(
          0,
          AI_DAILY_FREE_NEURONS - used,
        ),
      percentUsed:
        Math.min(
          100,
          (used / AI_DAILY_FREE_NEURONS) * 100,
        ),
    };
  } catch {
    return empty;
  }
}

function usageTokens(response: any) {
  const usage =
    response?.usage ||
    response?.result?.usage ||
    response?.choices?.[0]?.usage ||
    {};

  const inputTokens =
    Number(
      usage.prompt_tokens ??
      usage.input_tokens ??
      usage.inputTokens ??
      0,
    ) || 0;

  const outputTokens =
    Number(
      usage.completion_tokens ??
      usage.output_tokens ??
      usage.outputTokens ??
      0,
    ) || 0;

  return {
    inputTokens,
    outputTokens,
  };
}

async function recordAiUsage(
  env: Env,
  response: any,
) {
  const tokens =
    usageTokens(response);

  const neurons =
    tokens.inputTokens *
      AI_INPUT_NEURONS_PER_M /
      1_000_000 +
    tokens.outputTokens *
      AI_OUTPUT_NEURONS_PER_M /
      1_000_000;

  const current =
    await getAiUsage(env);

  const next = {
    day: aiUsageDay(),
    calls:
      Number(current.calls || 0) + 1,
    inputTokens:
      Number(current.inputTokens || 0) +
      tokens.inputTokens,
    outputTokens:
      Number(current.outputTokens || 0) +
      tokens.outputTokens,
    neuronsUsed:
      Number(current.neuronsUsed || 0) +
      neurons,
    scope: "automation-estimate",
    updatedAt: new Date().toISOString(),
  };

  await env.CONFIG.put(
    aiUsageKey(),
    JSON.stringify(next),
    {
      expirationTtl: 172800,
    },
  );
}

async function runAiTracked(
  env: Env,
  options: any,
) {
  const response =
    await env.AI.run(
      MODEL,
      options,
    );

  try {
    await recordAiUsage(
      env,
      response,
    );
  } catch (error) {
    console.warn(
      "Không ghi được AI usage:",
      error,
    );
  }

  return response;
}

function splitLongText(
  text: string,
  targetChars = 16000,
): string[] {
  const source =
    String(text || "").trim();

  if (!source) return [];
  if (source.length <= targetChars) {
    return [source];
  }

  const paragraphs =
    source.split(/\n{2,}/);

  const chunks: string[] = [];
  let current = "";

  function pushCurrent() {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  }

  for (const paragraph of paragraphs) {
    const p = paragraph.trim();
    if (!p) continue;

    if (
      current &&
      current.length + p.length + 2 >
        targetChars
    ) {
      pushCurrent();
    }

    if (p.length <= targetChars) {
      current +=
        (current ? "\n\n" : "") +
        p;
      continue;
    }

    pushCurrent();

    let offset = 0;
    while (offset < p.length) {
      let end =
        Math.min(
          p.length,
          offset + targetChars,
        );

      if (end < p.length) {
        const boundary =
          Math.max(
            p.lastIndexOf(". ", end),
            p.lastIndexOf("\n", end),
          );

        if (
          boundary >
          offset + targetChars * 0.55
        ) {
          end = boundary + 1;
        }
      }

      chunks.push(
        p.slice(offset, end).trim(),
      );

      offset = end;
    }
  }

  pushCurrent();
  return chunks.filter(Boolean);
}

function aiResponseText(
  response: any,
): string {
  if (typeof response === "string") {
    return response;
  }

  if (
    typeof response
      ?.choices?.[0]?.message?.content ===
      "string"
  ) {
    return response
      .choices[0]
      .message.content;
  }

  if (
    typeof response?.response === "string"
  ) {
    return response.response;
  }

  if (
    typeof response?.result === "string"
  ) {
    return response.result;
  }

  throw new Error(
    "Không nhận diện được response shape từ Workers AI: " +
    JSON.stringify(response).slice(0, 1200),
  );
}

function cleanAiResponse(
  raw: string,
): string {
  return String(raw || "")
    .replace(
      /<think>[\s\S]*?<\/think>/gi,
      "",
    )
    .replace(
      /^```(?:text|markdown|md)?\s*/i,
      "",
    )
    .replace(
      /\s*```$/i,
      "",
    )
    .trim();
}

async function sourceForEditorial(
  env: Env,
  sourceArticle: string,
): Promise<string> {
  const source =
    String(sourceArticle || "").trim();

  // Bài vừa/nhỏ: dùng toàn văn trực tiếp.
  // Bài dài: đọc TOÀN BỘ theo từng chunk rồi tạo fact notes.
  if (source.length <= 24000) {
    return source;
  }

  const chunks =
    splitLongText(
      source,
      16000,
    );

  const notes: string[] = [];

  for (
    let index = 0;
    index < chunks.length;
    index++
  ) {
    const response =
      await runAiTracked(
        env,
        {
          messages: [
            {
              role: "system",
              content:
                "Extract dense factual editorial notes. Preserve every important specification, benchmark, price, comparison, limitation, strength, weakness, methodology detail and conclusion. Never invent facts. Do not write the final article.",
            },
            {
              role: "user",
              content:
`SOURCE PART ${index + 1}/${chunks.length}

Extract detailed factual notes from this source part.
Keep exact numbers, units, model names and comparisons.
Keep table-like data in compact Markdown tables when useful.
Do not discard a detail merely to make the notes shorter.

${chunks[index]}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 3200,
        },
      );

    notes.push(
      `## SOURCE PART ${index + 1}/${chunks.length}\n` +
      cleanAiResponse(
        aiResponseText(response),
      ),
    );
  }

  let combined =
    notes.join("\n\n");

  // If the accumulated notes themselves are too large for one final context,
  // recursively merge them by groups instead of chopping off the tail.
  while (combined.length > 30000) {
    const noteChunks =
      splitLongText(
        combined,
        18000,
      );

    if (noteChunks.length <= 1) break;

    const merged: string[] = [];

    for (
      let index = 0;
      index < noteChunks.length;
      index++
    ) {
      const response =
        await runAiTracked(
          env,
          {
            messages: [
              {
                role: "system",
                content:
                  "Merge factual notes without inventing or intentionally dropping source-supported specifications, numbers, benchmark relationships or conclusions.",
              },
              {
                role: "user",
                content:
`MERGE FACT NOTES ${index + 1}/${noteChunks.length}

Preserve meaningful facts and exact quantitative data. Remove repetition only.

${noteChunks[index]}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 3600,
          },
        );

      merged.push(
        cleanAiResponse(
          aiResponseText(response),
        ),
      );
    }

    const next =
      merged.join("\n\n");

    // Safety against a non-shrinking model response.
    if (next.length >= combined.length) {
      combined = next;
      break;
    }

    combined = next;
  }

  return combined;
}

async function generateDraft(
  env: Env,
  item: FeedItem,
) {
  const sourceArticle =
    await fetchArticleText(
      env,
      item,
    );

  if (
    !sourceArticle ||
    !sourceArticle.trim()
  ) {
    throw new Error(
      "Không lấy được nội dung bài nguồn.",
    );
  }

  const editorialSource =
    await sourceForEditorial(
      env,
      sourceArticle,
    );

  function field(
    head: string,
    name: string,
  ): string {
    const match =
      head.match(
        new RegExp(
          `^${name}:\\s*(.*)$`,
          "mi",
        ),
      );

    return String(
      match?.[1] || "",
    ).trim();
  }

  function parseArticle(
    response: any,
    language: "vi" | "en",
  ) {
    const text =
      cleanAiResponse(
        aiResponseText(response),
      );

    const marker =
      "\nCONTENT:";

    const position =
      text.indexOf(marker);

    if (position < 0) {
      throw new Error(
        `AI ${language.toUpperCase()} thiếu marker CONTENT:`,
      );
    }

    const head =
      text
        .slice(0, position)
        .trim();

    const content =
      text
        .slice(
          position +
          marker.length,
        )
        .trim();

    const title =
      field(head, "TITLE");

    const subtitle =
      field(head, "SUBTITLE");

    const excerpt =
      field(head, "EXCERPT");

    const seoSlug =
      field(head, "SLUG");

    const tags =
      field(head, "TAGS")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12);

    if (!title) {
      throw new Error(
        `AI ${language.toUpperCase()} thiếu TITLE`,
      );
    }

    if (!excerpt) {
      throw new Error(
        `AI ${language.toUpperCase()} thiếu EXCERPT`,
      );
    }

    if (!content) {
      throw new Error(
        `AI ${language.toUpperCase()} thiếu CONTENT`,
      );
    }

    return {
      title,
      subtitle,
      excerpt,
      seoSlug,
      tags,
      content,
    };
  }

  async function createVersion(
    language: "vi" | "en",
  ) {
    const vi =
      language === "vi";

    const prompt =
      vi
        ? `
Bạn là biên tập viên công nghệ của nguyenlekhanhhoa.com.

Viết một BẢN NHÁP BÀI CÔNG NGHỆ HOÀN CHỈNH BẰNG TIẾNG VIỆT dựa trên toàn bộ dữ liệu nguồn bên dưới.

NGUYÊN TẮC BIÊN TẬP
- KHÔNG đặt quota số từ hoặc số ký tự cho nội dung bài.
- Độ dài phải do lượng thông tin thực tế của nguồn quyết định.
- Viết đủ dài để truyền tải trọn vẹn những dữ kiện có giá trị; không rút ngắn chỉ để đạt một độ dài cố định.
- Đồng thời không kéo dài bằng lặp ý hoặc câu vô nghĩa.
- Giữ các cấu hình, thông số, benchmark, giá, phương pháp thử, ưu/nhược điểm, bối cảnh và kết luận khi nguồn có.
- Không bịa dữ kiện, con số, trích dẫn hoặc thử nghiệm.
- Không sao chép nguyên văn các đoạn dài.
- Dùng Markdown với ## và ###.
- Dùng bảng Markdown khi bảng giúp giữ dữ liệu kỹ thuật/benchmark rõ hơn.
- Dùng bullet list khi phù hợp.
- Không nhắc AI.
- Không thêm phần nguồn cuối bài; website hiển thị citation riêng.

SEO
- TITLE: tự nhiên, tối đa 100 ký tự.
- SUBTITLE: bổ sung ý, không lặp TITLE.
- EXCERPT: ngắn gọn nhưng đủ ý cho thẻ tin/SEO.
- SLUG: chỉ a-z, 0-9, gạch ngang; ưu tiên tên sản phẩm/chủ đề; không hash và không nhồi từ khóa.
- TAGS: các tag thực sự liên quan.

TRẢ ĐÚNG TEXT, KHÔNG JSON:
TITLE: ...
SUBTITLE: ...
EXCERPT: ...
SLUG: ...
TAGS: tag 1, tag 2
CONTENT:
[nội dung Markdown đầy đủ]

NGUỒN
Tên: ${item.source}
URL: ${item.link}
Tiêu đề feed: ${item.title}
Tóm tắt feed: ${item.summary || ""}

DỮ LIỆU NGUỒN ĐÃ ĐƯỢC ĐỌC:
${editorialSource}
`.trim()
        : `
You are the English technology editor for nguyenlekhanhhoa.com.

Write a COMPLETE ENGLISH EDITORIAL DRAFT from all source material below.

EDITORIAL RULES
- Do NOT impose an article word-count or character-count quota.
- Article length must be determined by the amount of meaningful source information.
- Write as much as needed to preserve useful source-supported detail; do not shorten merely to hit an arbitrary length.
- Do not pad or repeat ideas.
- Preserve specifications, benchmarks, pricing, test methodology, strengths, weaknesses, context and conclusions when supported by the source.
- Never invent facts, numbers, quotes or testing.
- Rewrite editorially instead of copying long passages.
- Use Markdown with ## and ###.
- Use Markdown tables when they preserve technical or benchmark data clearly.
- Use bullet lists where useful.
- Do not mention AI.
- Do not append a source section; the site renders citation separately.

SEO
- TITLE: natural headline, max 100 characters.
- SUBTITLE: useful support line without repeating TITLE.
- EXCERPT: concise but meaningful.
- TAGS: only genuinely relevant tags.

RETURN EXACTLY THIS TEXT FORMAT, NOT JSON:
TITLE: ...
SUBTITLE: ...
EXCERPT: ...
CONTENT:
[complete Markdown article]

SOURCE
Publisher: ${item.source}
URL: ${item.link}
Feed title: ${item.title}
Feed summary: ${item.summary || ""}

SOURCE MATERIAL ALREADY READ:
${editorialSource}
`.trim();

    const response =
      await runAiTracked(
        env,
        {
          messages: [
            {
              role: "system",
              content:
                vi
                  ? "NLKH_V541_LANGUAGE_RULES: Biên tập chính xác, đầy đủ, không bịa, không ép độ dài bài theo quota. Toàn bộ bản VI phải là tiếng Việt tự nhiên: tiêu đề mục, đoạn văn, bảng, nhãn, chú thích ảnh và kết luận đều bằng tiếng Việt; chỉ giữ nguyên tên riêng, thương hiệu, model và viết tắt kỹ thuật bắt buộc. Không để câu giải thích hoặc heading tiếng Anh trong content_vi. Trả đúng marker text."
                  : "NLKH_V541_LANGUAGE_RULES: Edit accurately and comprehensively. Do not impose an article-length quota. Never invent facts. The entire EN version, including headings, tables, labels and image captions, must be English. Return marker text only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 8000,
        },
      );

    return parseArticle(
      response,
      language,
    );
  }

  const vi =
    await createVersion("vi");

  const en =
    await createVersion("en");

  if (!vi.seoSlug) {
    throw new Error(
      "AI VI thiếu SLUG SEO",
    );
  }

  return {
    title_vi: vi.title,
    title_en: en.title,
    subtitle_vi: vi.subtitle,
    subtitle_en: en.subtitle,
    excerpt_vi: vi.excerpt,
    excerpt_en: en.excerpt,
    content_vi: vi.content,
    content_en: en.content,
    seo_slug: vi.seoSlug,
    tags: vi.tags,
    source_chars:
      sourceArticle.length,
  };
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function browserQuickActionWithRetry(
  env: Env,
  action: string,
  options: any,
) {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await env.BROWSER.quickAction(
      action,
      options,
    );

    lastResponse = response;

    if (response.status !== 429) {
      return response;
    }

    if (attempt === 0) {
      const retryAfter =
        Number(response.headers.get("Retry-After") || "0");

      // Workers Free hiện có thể chỉ cho 1 Quick Action / 10 giây.
      // Nếu server không gửi Retry-After thì chờ 11 giây.
      const delayMs =
        retryAfter > 0
          ? Math.max(1000, retryAfter * 1000)
          : 11000;

      await sleep(delayMs);
    }
  }

  return lastResponse!;
}
async function scrapeLinksWithBrowserRun(
  env: Env,
  source: Source,
): Promise<FeedItem[]> {
  if (!env.BROWSER) {
    throw new Error("Browser Run chưa được cấu hình");
  }

  const response = await browserQuickActionWithRetry(
    env,
    "scrape",
    {
      url: source.feed,
      elements: [
        { selector: "a" },
      ],
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000,
      },
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);

    throw new Error(
      `Browser Run scrape HTTP ${response.status}: ${detail}`,
    );
  }

  const payload = await response.json() as {
    success?: boolean;
    result?: Array<{
      selector?: string;
      results?: Array<{
        text?: string;
        html?: string;
        attributes?: Array<{
          name?: string;
          value?: string;
        }>;
      }>;
    }>;
  };

  if (!payload.success || !Array.isArray(payload.result)) {
    throw new Error(
      "Browser Run scrape không trả về dữ liệu hợp lệ",
    );
  }

  let base: URL;

  try {
    base = new URL(source.feed);
  } catch {
    throw new Error("URL nguồn không hợp lệ");
  }

  const anchorGroup =
    payload.result.find(
      (group) => group.selector === "a",
    );

  const anchors =
    anchorGroup?.results || [];

  const seen = new Set<string>();
  const items: FeedItem[] = [];

  const badPathParts = [
    "/login",
    "/register",
    "/join",
    "/account",
    "/search",
    "/tag/",
    "/tags/",
    "/category/",
    "/categories/",
    "/author/",
    "/authors/",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
  ];

  const badTitles = /^(home|trang chủ|login|log in|join|đăng nhập|đăng ký|menu|more|xem thêm|read more|latest|news|tin tức)$/i;

  for (const anchor of anchors) {
    const href =
      anchor.attributes?.find(
        (attr) =>
          String(attr.name || "").toLowerCase() === "href",
      )?.value || "";

    const title =
      String(anchor.text || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!href || title.length < 12) {
      continue;
    }

    let link: URL;

    try {
      link = new URL(href, base);
    } catch {
      continue;
    }

    if (!["http:", "https:"].includes(link.protocol)) {
      continue;
    }

    const baseHost =
      base.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    const linkHost =
      link.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    if (
      linkHost !== baseHost &&
      !linkHost.endsWith("." + baseHost)
    ) {
      continue;
    }

    const path =
      link.pathname.toLowerCase();

    if (
      path === "/" ||
      badPathParts.some((part) => path.includes(part))
    ) {
      continue;
    }

    if (badTitles.test(title)) {
      continue;
    }

    const segments =
      path.split("/").filter(Boolean);

    if (!segments.length) {
      continue;
    }

    // Link bài thường có slug đủ dài hoặc nhiều segment.
    const lastSegment =
      segments[segments.length - 1] || "";

    const looksLikeArticle =
      lastSegment.length >= 12 ||
      segments.length >= 2;

    if (!looksLikeArticle) {
      continue;
    }

    link.hash = "";

    const canonical = link.toString();

    if (seen.has(canonical)) {
      continue;
    }

    seen.add(canonical);

    items.push({
      source: source.name,
      title:
        title.length > 240
          ? title.slice(0, 240).trim()
          : title,
      link: canonical,
      summary: "",
      publishedAt: null,
    });

    if (items.length >= MAX_ITEMS_PER_SOURCE) {
      break;
    }
  }

  if (!items.length) {
    throw new Error(
      "Browser Run mở được trang nhưng không tìm thấy link bài phù hợp",
    );
  }

  return items;
}
async function renderHtmlWithBrowserRun(
  env: Env,
  url: string,
): Promise<string> {
  if (!env.BROWSER) {
    throw new Error("Browser Run chưa được cấu hình");
  }

  const response = await browserQuickActionWithRetry(
    env,
    "content",
    {
      url,
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000,
      },
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);

    throw new Error(
      `Browser Run failed HTTP ${response.status}: ${detail}`,
    );
  }

  const data = await response.json() as {
    success?: boolean;
    result?: string;
  };

  if (!data.success || typeof data.result !== "string") {
    throw new Error(
      "Browser Run không trả về HTML hợp lệ",
    );
  }

  return data.result;
}
async function fetchSourceItems(
  source: Source,
  env: Env,
): Promise<FeedItem[]> {
  if (source.type === "html") {
    return await scrapeLinksWithBrowserRun(
      env,
      source,
    );
  }

  const response = await fetch(source.feed, {
    headers: {
      "User-Agent":
        "NLKH-Technology-NewsBot/1.0 (+https://nguyenlekhanhhoa.com/news)",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();

  const items = parseFeed(
    xml,
    source.name,
  );

  if (!items.length) {
    throw new Error(
      "Feed truy cập được nhưng không tìm thấy bài RSS/Atom",
    );
  }

  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}
async function repairExistingDraftsV55(
  env: Env,
  limit = 20,
) {
  const state =
    (await env.CONFIG.get(
      V55_DRAFT_REPAIR_KEY,
      { type: "json" },
    ).catch(() => null)) as any || {};

  const doneIds = new Set<string>(
    Array.isArray(state?.doneIds)
      ? state.doneIds.map(String)
      : [],
  );

  const rows = await sb(
    env,
    "news_articles?select=id,title_vi,title_en,subtitle_vi,subtitle_en,excerpt_vi,excerpt_en,content_vi,content_en,source_name,source_url,tags,category_id,published_at,created_at,status&status=eq.draft&order=created_at.asc&limit=50",
  );

  const drafts = Array.isArray(rows)
    ? rows.filter(
        (row: any) =>
          row?.id &&
          row?.source_url &&
          !doneIds.has(String(row.id)),
      )
    : [];

  const repaired: any[] = [];
  const failed: any[] = [];

  for (const row of drafts.slice(0, Math.max(1, limit))) {
    const articleId = String(row.id);

    try {
      const item: FeedItem = {
        source:
          String(row.source_name || "Nguồn bài viết"),
        title:
          String(row.title_en || row.title_vi || ""),
        link:
          String(row.source_url),
        summary:
          String(row.excerpt_en || row.excerpt_vi || ""),
        publishedAt:
          row.published_at || row.created_at || null,
      };

      const ai = await generateDraft(env, item);

      let contentVi = String(ai?.content_vi || "").trim();
      let contentEn = String(ai?.content_en || "").trim();

      if (
        !contentVi ||
        contentVi === "[object Object]" ||
        contentVi.length < 500
      ) {
        throw new Error(
          "AI repair trả content_vi không hợp lệ",
        );
      }

      if (
        !contentEn ||
        contentEn === "[object Object]" ||
        contentEn.length < 500
      ) {
        throw new Error(
          "AI repair trả content_en không hợp lệ",
        );
      }

      // Reuse the CURRENT image pipeline for legacy Drafts too.
      // Existing media mappings remain owned by the same article;
      // R2 SHA/media_id dedupe prevents repeated binary assets.
      try {
        const sourceImages =
          await findSourceImageCandidates(item);

        const inlineImages: PlacedNewsImage[] = [];
        const usedMediaIds = new Set<string>();
        const usedUrls = new Set<string>();

        for (
          let imageIndex = 0;
          imageIndex < sourceImages.length;
          imageIndex++
        ) {
          const candidateImage =
            sourceImages[imageIndex];

          try {
            const role =
              imageIndex === 0
                ? "cover"
                : "inline";

            const saved =
              await ingestNewsMedia(
                env,
                articleId,
                candidateImage.url,
                role,
                imageIndex,
              );

            const mediaId =
              String(saved?.media_id || "");
            const savedUrl =
              String(saved?.url || "");

            if (mediaId) {
              if (usedMediaIds.has(mediaId)) {
                continue;
              }
              usedMediaIds.add(mediaId);
            }

            if (savedUrl) {
              if (usedUrls.has(savedUrl)) {
                continue;
              }
              usedUrls.add(savedUrl);
            }

            if (
              role === "inline" &&
              savedUrl
            ) {
              inlineImages.push({
                url: savedUrl,
                hint:
                  candidateImage.hint ||
                  item.title ||
                  "",
                mediaId,
              });
            }
          } catch {
            // Text repair must not fail only because one source image fails.
          }

          if (inlineImages.length >= 4) {
            break;
          }
        }

        if (inlineImages.length) {
          contentVi =
            await placeInlineImagesWithAi(
              env,
              contentVi,
              inlineImages,
              "vi",
            );

          contentEn =
            await placeInlineImagesWithAi(
              env,
              contentEn,
              inlineImages,
              "en",
            );
        }
      } catch {
        // Keep regenerated text if the media phase cannot run.
      }

      const payload = {
        title_vi:
          clip(ai?.title_vi || row.title_vi, 100),
        title_en:
          clip(ai?.title_en || row.title_en || row.title_vi, 100),
        subtitle_vi:
          clip(ai?.subtitle_vi || "", 180),
        subtitle_en:
          clip(ai?.subtitle_en || "", 180),
        excerpt_vi:
          clip(
            ai?.excerpt_vi ||
            contentVi ||
            row.excerpt_vi ||
            row.title_vi,
            165,
          ),
        excerpt_en:
          clip(
            ai?.excerpt_en ||
            contentEn ||
            row.excerpt_en ||
            row.title_en ||
            row.title_vi,
            165,
          ),
        content_vi: contentVi,
        content_en: contentEn,
        tags: normalizeTags(ai?.tags),
        editor_name: "AI hỗ trợ biên tập",
        published_at:
          row.published_at ||
          row.created_at ||
          new Date().toISOString(),
      };

      await sb(
        env,
        `news_articles?id=eq.${encodeURIComponent(articleId)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        },
      );

      doneIds.add(articleId);

      await env.CONFIG.put(
        V55_DRAFT_REPAIR_KEY,
        JSON.stringify({
          doneIds: [...doneIds],
          updatedAt: new Date().toISOString(),
        }),
      );

      repaired.push({
        articleId,
        titleVi: payload.title_vi,
      });
    } catch (error: any) {
      failed.push({
        articleId,
        sourceUrl: row.source_url,
        error: clip(
          String(error?.message || error),
          1000,
        ),
      });
    }
  }

  const remaining =
    Math.max(0, drafts.length - repaired.length);

  await env.CONFIG.put(
    V55_DRAFT_REPAIR_KEY,
    JSON.stringify({
      doneIds: [...doneIds],
      repairedLastRun: repaired,
      failedLastRun: failed,
      remaining,
      updatedAt: new Date().toISOString(),
    }),
  );

  return {
    attempted:
      repaired.length + failed.length,
    repaired,
    failed,
    remaining,
  };
}
async function scan(env: Env, settings: Settings = DEFAULT_SETTINGS) {
  const existingDraftRepair =
    await repairExistingDraftsV55(env, 20);
  const candidates: Array<{ item: FeedItem; score: number }> = [];
  const sourceErrors: Array<{ source: string; error: string }> = [];

  for (const source of settings.sources) {
    if (source.enabled === false) continue;

    try {
      const items = await fetchSourceItems(source, env);

      if (!items.length) {
        throw new Error("Không tìm thấy bài phù hợp trong nguồn");
      }

      for (const item of items) {
        const score = scoreItem(item, source.baseScore);

        if (score >= settings.relevanceThreshold) {
          candidates.push({ item, score });
        }
      }
    } catch (e: any) {
      sourceErrors.push({
        source: source.name,
        error: String(e?.message || e),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const created: any[] = [];

  let duplicateDraftsSkipped = 0;
  let retryingPreviousFailures = 0;
  let newItemsStarted = 0;
  let aiAttempted = 0;
  let aiFailed = 0;
  let draftWriteFailed = 0;

  const processingErrors: Array<{
    source: string;
    url: string;
    stage: string;
    error: string;
  }> = [];

  for (const candidate of candidates) {
    if (created.length >= settings.maxDraftsPerRun) {
      break;
    }

    const existing = await getIngestRecord(
      env,
      candidate.item.link,
    );

    // Chỉ bỏ qua khi thực sự đã có Draft/article.
    if (ingestAlreadyHasDraft(existing)) {
      duplicateDraftsSkipped++;
      continue;
    }

    if (existing) {
      // URL đã từng xử lý nhưng chưa tạo được bài.
      // Cho phép retry thay vì bỏ vĩnh viễn.
      retryingPreviousFailures++;

      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            source_name: candidate.item.source,
            source_title: candidate.item.title,
            source_published_at: candidate.item.publishedAt,
            relevance_score: candidate.score,
            ai_model: MODEL,
            state: "processing",
            last_error: null,
          }),
        },
      );
    } else {
      newItemsStarted++;

      await sb(
        env,
        "technology_news_ingest",
        {
          method: "POST",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            source_name: candidate.item.source,
            source_url: candidate.item.link,
            source_title: candidate.item.title,
            source_published_at: candidate.item.publishedAt,
            relevance_score: candidate.score,
            ai_model: MODEL,
            state: "processing",
          }),
        },
      );
    }

    let ai: any;

    try {
      aiAttempted++;

      ai = await generateDraft(
        env,
        candidate.item,
      );
    } catch (e: any) {
      aiFailed++;

      const error =
        String(e?.message || e);

      processingErrors.push({
        source: candidate.item.source,
        url: candidate.item.link,
        stage: "ai",
        error: clip(error, 1000),
      });

      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            state: "error",
            last_error: clip(
              `AI: ${error}`,
              1000,
            ),
          }),
        },
      );

      continue;
    }

    try {
      const draft = await writeDraft(
        env,
        candidate.item,
        ai,
        candidate.score,
      );
      let mediaIngestError = "";
      try {
        if (draft.articleId) {
          const sourceImages =
            await findSourceImageCandidates(candidate.item);

          const inlineImages: PlacedNewsImage[] = [];
          const usedMediaIds = new Set<string>();
          const usedUrls = new Set<string>();

          for (
            let imageIndex = 0;
            imageIndex < sourceImages.length;
            imageIndex++
          ) {
            try {
              const candidateImage =
                sourceImages[imageIndex];

              const role =
                imageIndex === 0
                  ? "cover"
                  : "inline";

              const saved =
                await ingestNewsMedia(
                  env,
                  String(draft.articleId),
                  candidateImage.url,
                  role,
                  imageIndex,
                );

              const mediaId =
                String(saved?.media_id || "");
              const savedUrl =
                String(saved?.url || "");

              // R2/media_assets SHA dedupe is authoritative:
              // if multiple source URLs resolve to identical bytes,
              // do NOT render the same asset repeatedly.
              if (mediaId) {
                if (usedMediaIds.has(mediaId)) {
                  continue;
                }
                usedMediaIds.add(mediaId);
              }

              if (savedUrl) {
                if (usedUrls.has(savedUrl)) {
                  continue;
                }
                usedUrls.add(savedUrl);
              }

              if (
                role === "inline" &&
                savedUrl
              ) {
                inlineImages.push({
                  url: savedUrl,
                  hint:
                    candidateImage.hint ||
                    candidate.item.title ||
                    "",
                  mediaId,
                });
              }
            } catch (imageError: any) {
              processingErrors.push({
                source: candidate.item.source,
                url: candidate.item.link,
                stage: "image_r2",
                error: clip(
                  String(
                    imageError?.message ||
                    imageError,
                  ),
                  1000,
                ),
              });
            }

            if (inlineImages.length >= 4) {
              break;
            }
          }

          if (inlineImages.length) {
            const patchedVi =
              await placeInlineImagesWithAi(
                env,
                ai.content_vi,
                inlineImages,
                "vi",
              );

            const patchedEn =
              await placeInlineImagesWithAi(
                env,
                ai.content_en,
                inlineImages,
                "en",
              );

            await sb(
              env,
              `news_articles?id=eq.${encodeURIComponent(String(draft.articleId))}`,
              {
                method: "PATCH",
                headers: {
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({
                  content_vi: patchedVi,
                  content_en: patchedEn,
                }),
              },
            );
          }
        }
      } catch (mediaError: any) {
        mediaIngestError =
          String(
            mediaError?.message ||
            mediaError,
          );

        processingErrors.push({
          source: candidate.item.source,
          url: candidate.item.link,
          stage: "media_r2",
          error: clip(
            mediaIngestError,
            1000,
          ),
        });
      }
      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            article_id: draft.articleId,
            state: "draft_created",
            last_error: null,
          }),
        },
      );

      created.push({
        source: candidate.item.source,
        score: candidate.score,
        ...draft,
      });
    } catch (e: any) {
      draftWriteFailed++;

      const error =
        String(e?.message || e);

      processingErrors.push({
        source: candidate.item.source,
        url: candidate.item.link,
        stage: "draft",
        error: clip(error, 1000),
      });

      await sb(
        env,
        `technology_news_ingest?source_url=eq.${encodeURIComponent(candidate.item.link)}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            state: "error",
            last_error: clip(
              `Draft: ${error}`,
              1000,
            ),
          }),
        },
      );
    }
  }
  const enabledSources =
    settings.sources.filter(
      (source) => source.enabled !== false,
    );

  const result = {
    ok: true,
    model: MODEL,

    configuredSources:
      settings.sources.length,

    sources:
      enabledSources.length,

    candidates:
      candidates.length,

    duplicateDraftsSkipped,
    retryingPreviousFailures,
    newItemsStarted,
    aiAttempted,
    aiFailed,
    draftWriteFailed,

    draftsCreated:
      created.length,

    existingDraftRepair,
    created,
    sourceErrors,
    processingErrors,

    settings,

    aiUsage: await getAiUsage(env),

    finishedAt:
      new Date().toISOString(),
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
        : "Chưa có lần chạy nào được ghi nhận.";

      const lastRunSummary = lastRun
        ? `
          <div class="resultGrid">
            <div class="key">Trạng thái</div>
            <div>${lastRun.ok ? "Hoàn tất" : "Có lỗi"}</div>

            <div class="key">Thời gian hoàn tất</div>
            <div>${htmlEscape(formatVietnamDateTime(lastRun.finishedAt))}</div>

            <div class="key">Số nguồn đã kiểm tra</div>
            <div>${htmlEscape(lastRun.sources ?? "Không có dữ liệu")}</div>

            <div class="key">Số tin đạt điều kiện</div>
            <div>${htmlEscape(lastRun.candidates ?? 0)}</div>

            <div class="key">Số bản nháp đã tạo</div>
            <div>${htmlEscape(lastRun.draftsCreated ?? 0)}</div>

            <div class="key">Số nguồn gặp lỗi</div>
            <div>${htmlEscape(
              Array.isArray(lastRun.sourceErrors)
                ? lastRun.sourceErrors.length
                : 0
            )}</div>

            <div class="key">Đã bỏ qua vì tắt tự động</div>
            <div>${lastRun.skipped ? "Có" : "Không"}</div>
          </div>
        `
        : `<p class="help">Chưa có dữ liệu lần chạy gần nhất.</p>`;

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
      line-height:1.5;
    }
    .help strong {
      color:#b9c7d5;
      font-weight:600;
    }
    .example {
      margin-top:8px;
      padding:10px 12px;
      border:1px solid #263241;
      border-radius:9px;
      background:#0b0f14;
      color:#9fb0c1;
      font-size:13px;
      line-height:1.5;
    }
    .resultGrid {
      display:grid;
      grid-template-columns:220px 1fr;
      gap:8px 16px;
      margin-top:14px;
    }
    .resultGrid .key {
      color:#8193a6;
    }
    details {
      margin-top:18px;
    }
    summary {
      cursor:pointer;
      color:#79c0ff;
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
    .sources {
      display:grid;
      gap:14px;
      margin-top:16px;
    }
    .sourceRow {
      display:grid;
      grid-template-columns:1fr 2fr 150px;
      gap:14px;
      padding:16px;
      border:1px solid #263241;
      border-radius:12px;
      background:#0b1118;
    }
    .sourceRow label {
      align-content:start;
    }
    .sourceRow input[type=text],
    .sourceRow input[type=url],
    .sourceRow select {
      width:100%;
      padding:11px 12px;
      border:1px solid #34465a;
      border-radius:9px;
      background:#0b0f14;
      color:#fff;
    }
    .sourceActions {
      grid-column:1 / -1;
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }
    .sourceResult {
      grid-column:1 / -1;
      min-height:18px;
      color:#8193a6;
      font-size:13px;
    }
    .sourceGuide {
      margin:14px 0;
      padding:14px;
      border:1px solid #263241;
      border-radius:10px;
      background:#0b0f14;
      color:#9fb0c1;
      font-size:13px;
      line-height:1.55;
    }
    @media(max-width:800px) {
      .sourceRow {
        grid-template-columns:1fr;
      }
    }  </style>
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
      <span>AI quota (Automation)</span><span>${lastRun?.aiUsage ? Math.round(Number(lastRun.aiUsage.neuronsUsed || 0)).toLocaleString("vi-VN") + " / 10.000 neurons · còn ~" + Math.max(0, Math.round(10000 - Number(lastRun.aiUsage.neuronsUsed || 0))).toLocaleString("vi-VN") + " · " + Number(lastRun.aiUsage.percentUsed || 0).toFixed(1) + "%" : "Chưa có dữ liệu usage hôm nay"}</span>
      <span>AI calls / tokens</span><span>${lastRun?.aiUsage ? Number(lastRun.aiUsage.calls || 0) + " calls · " + Number(lastRun.aiUsage.inputTokens || 0).toLocaleString("vi-VN") + " input · " + Number(lastRun.aiUsage.outputTokens || 0).toLocaleString("vi-VN") + " output" : "—"}</span>
      <span>Reset quota</span><span>00:00 UTC / 07:00 Việt Nam · số liệu là ước tính riêng của Automation</span>
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
        Số bài nháp tối đa mỗi lần chạy
        <input id="maxDrafts" type="number" min="1" max="20"
          value="${settings.maxDraftsPerRun}" />
        <span class="help">
          Đây là số bài tối đa Automation được phép tạo trong một lần chạy.
          <strong>Khuyên dùng 1 khi kiểm tra</strong>; khi hệ thống ổn định có thể
          tăng lên <strong>3–5</strong>.
          Nếu không có đủ tin đạt điều kiện thì hệ thống sẽ tạo ít hơn con số này.
        </span>
        <span class="example">
          Ví dụ: đặt 5 nhưng chỉ có 2 tin đạt điều kiện → chỉ tạo 2 Draft.
        </span>
      </label>

      <label>
        Ngưỡng liên quan
        <input id="threshold" type="number" min="0" max="100"
          value="${settings.relevanceThreshold}" />
        <span class="help">
          Đây là điểm tối thiểu một tin phải đạt trước khi được chuyển sang AI xử lý.
          <strong>Khuyên dùng 30.</strong>
          Tăng số này → lọc chặt hơn, ít tin hơn nhưng sát chủ đề hơn.
          Giảm số này → lấy nhiều tin hơn nhưng dễ có tin kém liên quan.
        </span>
        <span class="example">
          Ví dụ: tin có tổng điểm 34 và ngưỡng là 30 → tin được AI xử lý.
          Nếu ngưỡng tăng lên 40 → tin đó bị bỏ qua.
        </span>
      </label>
    </div>

    <label class="toggle">
      <input id="enabled" type="checkbox"
        ${settings.automationEnabled ? "checked" : ""} />
      <span>
        Bật chạy tự động
        <span class="help" style="display:block;margin-top:3px">
          Khi bật, hệ thống tự kiểm tra các nguồn mỗi ngày lúc
          <strong>06:00 giờ Việt Nam</strong>.
          Khi tắt, lịch Cloudflare vẫn tồn tại nhưng Automation sẽ bỏ qua lần chạy
          và không tạo bài mới.
        </span>
      </span>
    </label>

    <div style="margin-top:28px">
      <h2 style="margin-bottom:6px">Nguồn quét</h2>

      <p class="section-help" style="margin:0 0 12px">
        Đây là các website mà Automation kiểm tra để tìm tin mới.
        Khi thêm nguồn, bạn chỉ cần nhập <strong>Tên nguồn + Website</strong>,
        ví dụ <code>https://www.allaboutcircuits.com</code>, rồi bấm
        <strong>Tự tìm nguồn</strong>.
        Automation sẽ tự tìm RSS/Atom hoặc trang danh sách bài phù hợp.
        Không cần biết <code>/rss</code>, <code>/feed.xml</code> hay
        <code>/latest/</code>.
      </p>

      <div class="sourceGuide">
        <strong>RSS / Atom là gì?</strong><br />
        RSS/Atom là đường dẫn dữ liệu dành cho máy đọc danh sách bài mới.
        Nó thường có dạng <code>/feed</code>, <code>/rss</code>,
        <code>/feed.xml</code> hoặc <code>/rss.xml</code>.
        Nếu website không có RSS/Atom thì cần một kiểu bộ đọc khác.<br /><br />

        <strong>Điểm ưu tiên nguồn là gì?</strong><br />
        Đây là điểm cộng ban đầu cho mỗi tin lấy từ nguồn đó.
        Ví dụ: nguồn có điểm 10, bài chứa từ khóa CPU được cộng thêm 24
        → tổng điểm 34. Nếu Ngưỡng liên quan là 30 thì bài được đưa sang AI xử lý.<br /><br />

        <strong>Nên đặt bao nhiêu?</strong><br />
        Nguồn thông thường: 10. Nguồn chuyên sâu, đáng ưu tiên: khoảng 12–15.
        Nếu chưa chắc, cứ để 10.
      </div>

      <div id="sources" class="sources">
        ${renderSourceRows(settings.sources)}
      </div>

      <div class="actions">
        <button type="button" id="addSource">+ Thêm nguồn</button>
      </div>

      <p class="help">
        <strong>Thêm nguồn:</strong> thêm một RSS/Atom mới vào danh sách.<br />
        <strong>Kiểm tra nguồn:</strong> thử đọc URL trước khi lưu để biết nguồn có hoạt động hay không.<br />
        <strong>Xóa nguồn:</strong> ngừng quét nguồn đó; không xóa các bài đã được tạo trước đây.
      </p>
    </div>

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
      <button class="primary" id="save">Lưu cấu hình</button>
      <button id="run">Chạy ngay</button>
    </div>

    <div class="help" style="margin-top:10px">
      <strong>Lưu cấu hình:</strong> lưu toàn bộ thiết lập hiện tại.
      Các lần chạy sau sẽ dùng cấu hình mới.<br />
      <strong>Chạy ngay:</strong> chạy thu thập tin + AI ngay lập tức.
      Bài tạo ra luôn ở trạng thái Draft, không tự xuất bản.
    </div>

    <div id="message"></div>

    <p class="note">
      Save settings và Run now chỉ hoạt động với tài khoản đã đăng nhập,
      trạng thái active và có quyền quản trị. Mọi bài Automation tạo ra
      luôn ở trạng thái Draft để người quản trị kiểm tra trước khi xuất bản.
    </p>
  </section>

  <section class="card">
    <h2>Lần chạy gần nhất</h2>

    <p class="section-help">
      Phần này cho biết lần chạy gần nhất đã kiểm tra bao nhiêu nguồn,
      tìm được bao nhiêu tin phù hợp và đã tạo bao nhiêu bản nháp.
    </p>

    <div id="lastRunSummary">
      ${lastRunSummary}
    </div>

    <details>
      <summary>Xem dữ liệu kỹ thuật</summary>
      <p class="help">
        Phần bên dưới dành cho người quản trị kỹ thuật hoặc developer khi cần kiểm tra lỗi.
      </p>
      <pre id="lastRun">${lastRunText}</pre>
    </details>
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

  function updateSourceButtons() {
    const rows = document.querySelectorAll("[data-source-row]");

    rows.forEach((row) => {
      const remove = row.querySelector("[data-remove-source]");
      if (remove) remove.disabled = rows.length <= 1;
    });
  }

  function readSourceRow(row) {
    const website =
      row.querySelector("[data-source-website]")?.value.trim() || "";

    const feed =
      row.querySelector("[data-source-feed]")?.value.trim() || website;

    return {
      name: row.querySelector("[data-source-name]").value.trim(),
      website,
      feed,
      baseScore: Number(row.querySelector("[data-source-score]").value),
      type: row.querySelector("[data-source-type]")?.value || "rss",
      enabled: row.querySelector("[data-source-enabled]")?.checked !== false,
    };
  }

  function readSources() {
    return Array.from(
      document.querySelectorAll("[data-source-row]")
    ).map(readSourceRow);
  }

  function makeSourceRow() {
    const row = document.createElement("div");
    row.className = "sourceRow";
    row.setAttribute("data-source-row", "");

    row.innerHTML =
      '<label>' +
        '<span>Tên nguồn</span>' +
        '<input type="text" data-source-name placeholder="Ví dụ: IEEE Spectrum" />' +
        '<span class="help">Tên để người quản trị nhận biết nguồn tin.</span>' +
      '</label>' +

      '<label>' +
        '<span>Website</span>' +
        '<input type="url" data-source-website placeholder="https://example.com" />' +
        '<span class="help">' +
          'Chỉ cần nhập tên miền website. Automation sẽ tự tìm nguồn đọc phù hợp.' +
        '</span>' +
      '</label>' +

      '<label>' +
        '<span>Điểm ưu tiên nguồn</span>' +
        '<input type="number" data-source-score min="-100" max="100" value="10" />' +
        '<span class="help">Khuyên dùng 10–15. Nếu chưa chắc thì để 10.</span>' +
      '</label>' +

      '<div class="sourceAdvanced">' +
        '<details>' +
          '<summary>Cài đặt nâng cao</summary>' +

          '<label>' +
            '<span>Loại nguồn đã phát hiện</span>' +
            '<select data-source-type>' +
              '<option value="rss" selected>RSS / Atom</option>' +
              '<option value="html">Trang web</option>' +
            '</select>' +
          '</label>' +

          '<label>' +
            '<span>Đường dẫn thực tế Automation sử dụng</span>' +
            '<input type="url" data-source-feed placeholder="Tự động phát hiện" />' +
          '</label>' +
        '</details>' +
      '</div>' +

      '<label class="toggle">' +
        '<input type="checkbox" data-source-enabled checked />' +
        '<span>Bật nguồn này</span>' +
      '</label>' +

      '<div class="sourceActions">' +
        '<button type="button" data-discover-source>Tự tìm nguồn</button>' +
        '<button type="button" data-test-source>Kiểm tra lại</button>' +
        '<button type="button" data-remove-source>Xóa nguồn</button>' +
      '</div>' +

      '<div class="sourceResult" data-source-result></div>';

    return row;
  }
  $("addSource").addEventListener("click", () => {
    $("sources").appendChild(makeSourceRow());
    updateSourceButtons();
  });

  $("sources").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const row = button.closest("[data-source-row]");
    if (!row) return;

    if (button.matches("[data-remove-source]")) {
      row.remove();
      updateSourceButtons();
      return;
    }

    if (button.matches("[data-discover-source]")) {
      const result = row.querySelector("[data-source-result]");
      const name =
        row.querySelector("[data-source-name]").value.trim();
      const website =
        row.querySelector("[data-source-website]").value.trim();

      if (!name || !website) {
        result.textContent =
          "Hãy nhập Tên nguồn và Website trước.";
        return;
      }

      result.textContent =
        "Đang tự tìm RSS/Atom hoặc trang bài mới...";

      button.disabled = true;

      try {
        const body = await protectedRequest("/discover-source", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            website
          })
        });

        row.querySelector("[data-source-website]").value =
          body.website;

        row.querySelector("[data-source-feed]").value =
          body.feed;

        row.querySelector("[data-source-type]").value =
          body.type;

        const typeLabel =
          body.type === "rss"
            ? "RSS / Atom"
            : "Trang web";

        result.textContent =
          "Đã chọn nguồn tốt nhất. " +
          "Loại: " +
          typeLabel +
          ". Cách phát hiện: " +
          (body.label || body.discovery || "Tự động") +
          ". Đọc được " +
          body.items +
          " bài. Điểm lựa chọn: " +
          (body.score ?? "-") +
          ". URL sử dụng: " +
          body.feed;
      } catch (e) {
        result.textContent =
          "Không tự tìm được nguồn: " +
          (e.message || String(e));
      } finally {
        button.disabled = false;
      }

      return;
    }

    if (button.matches("[data-test-source]")) {
      const result = row.querySelector("[data-source-result]");
      const source = readSourceRow(row);

      if (!source.name || !source.feed) {
        result.textContent =
          "Hãy nhập Tên nguồn và Đường dẫn RSS / Atom trước.";
        return;
      }

      result.textContent = "Đang kiểm tra nguồn...";
      button.disabled = true;

      try {
        const body = await protectedRequest("/test-source", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(source)
        });

        if (body.feed) {
          const feedInput =
            row.querySelector("[data-source-feed]");

          if (feedInput) {
            feedInput.value = body.feed;
          }
        }

        if (body.website) {
          const websiteInput =
            row.querySelector("[data-source-website]");

          if (websiteInput) {
            websiteInput.value = body.website;
          }
        }

        if (body.type) {
          const typeInput =
            row.querySelector("[data-source-type]");

          if (typeInput) {
            typeInput.value = body.type;
          }
        }

        const typeLabel =
          body.type === "html"
            ? "Trang web"
            : "RSS / Atom";

        if (body.recovered) {
          result.textContent =
            "Nguồn cũ bị lỗi nhưng Automation đã tự tìm lại nguồn hoạt động. " +
            "Loại: " +
            typeLabel +
            ". Đọc được " +
            body.items +
            " bài. URL mới: " +
            body.feed +
            ". Hãy bấm Lưu cấu hình để lưu URL mới.";
        } else {
          result.textContent =
            "Nguồn hoạt động. Loại: " +
            typeLabel +
            ". Đọc được " +
            body.items +
            " bài. URL: " +
            body.feed;
        }
      } catch (e) {
        result.textContent =
          "Không đọc được nguồn: " +
          (e.message || String(e));
      } finally {
        button.disabled = false;
      }
    }
  });

  updateSourceButtons();

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
            $("enabled").checked,

          sources: readSources()
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

      const errors =
        Array.isArray(body.sourceErrors)
          ? body.sourceErrors.length
          : 0;

      $("lastRunSummary").innerHTML =
        '<div class="resultGrid">' +
          '<div class="key">Trạng thái</div>' +
          '<div>' + (body.ok ? "Hoàn tất" : "Có lỗi") + '</div>' +

          '<div class="key">Thời gian hoàn tất</div>' +
          '<div>' + htmlEscape(formatVietnamDateTime(body.finishedAt)) + '</div>' +

          '<div class="key">Số nguồn đã kiểm tra</div>' +
          '<div>' + (body.sources ?? "Không có dữ liệu") + '</div>' +

          '<div class="key">Số tin đạt điều kiện</div>' +
          '<div>' + (body.candidates ?? 0) + '</div>' +

          '<div class="key">Số bản nháp đã tạo</div>' +
          '<div>' + (body.draftsCreated ?? 0) + '</div>' +

          '<div class="key">Số nguồn gặp lỗi</div>' +
          '<div>' + errors + '</div>' +
        '</div>';
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

    if (url.pathname === "/discover-source" && request.method === "POST") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      try {
        const input = await request.json() as {
          name?: string;
          website?: string;
        };

        const name =
          String(input?.name || "New source").trim();

        const website =
          String(input?.website || "").trim();

        const discovered =
          await discoverSource(website, name, env);

        return Response.json({
          ok: true,
          ...discovered,
        });
      } catch (e: any) {
        return Response.json(
          {
            error: String(e?.message || e),
          },
          { status: 400 },
        );
      }
    }

    if (url.pathname === "/test-source" && request.method === "POST") {
      const identity = await getAutomationIdentity(request, env);

      if (!identity) {
        return Response.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      try {
        const input = await request.json() as {
          name?: string;
          website?: string;
          feed?: string;
          baseScore?: number;
          type?: "rss" | "html";
          enabled?: boolean;
        };

        const source: Source = {
          name: String(input?.name || "Test source").trim(),
          website: String(
            input?.website ||
            input?.feed ||
            "",
          ).trim(),
          feed: String(
            input?.feed ||
            input?.website ||
            "",
          ).trim(),
          baseScore: Number(input?.baseScore) || 10,
          type: input?.type === "html" ? "html" : "rss",
          enabled: input?.enabled !== false,
        };

        if (!isAllowedFeedUrl(source.feed)) {
          return Response.json(
            { error: "Đường dẫn nguồn không hợp lệ." },
            { status: 400 },
          );
        }

        // ----------------------------------------------------
        // 1. Thử đúng nguồn hiện đang lưu
        // ----------------------------------------------------

        try {
          const items = await fetchSourceItems(
            source,
            env,
          );

          return Response.json({
            ok: true,
            recovered: false,
            name: source.name,
            website: source.website,
            feed: source.feed,
            type: source.type || "rss",
            items: items.length,
            sample: items.slice(0, 3).map((item) => ({
              title: item.title,
              link: item.link,
            })),
          });
        } catch (firstError: any) {
          // --------------------------------------------------
          // 2. URL hiện tại lỗi -> tự tìm lại từ website
          // --------------------------------------------------

          if (!source.website) {
            throw firstError;
          }

          const discovered = await discoverSource(
            source.website,
            source.name,
            env,
          );

          const recoveredSource: Source = {
            ...source,
            website: discovered.website,
            feed: discovered.feed,
            type: discovered.type,
          };

          // --------------------------------------------------
          // 3. Verify lại nguồn vừa tìm được
          // --------------------------------------------------

          const recoveredItems =
            await fetchSourceItems(
              recoveredSource,
              env,
            );

          return Response.json({
            ok: true,
            recovered: true,
            previousError:
              String(firstError?.message || firstError),

            name: recoveredSource.name,
            website: recoveredSource.website,
            feed: recoveredSource.feed,
            type: recoveredSource.type,

            items: recoveredItems.length,

            discovery: discovered.discovery,
            score: discovered.score,
            label: discovered.label,

            sample: recoveredItems
              .slice(0, 3)
              .map((item) => ({
                title: item.title,
                link: item.link,
              })),
          });
        }
      } catch (e: any) {
        return Response.json(
          {
            error:
              "Không xác nhận được nguồn: " +
              String(e?.message || e),
          },
          { status: 400 },
        );
      }
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
