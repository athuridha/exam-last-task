/**
 * Live flood news scraper — TypeScript port of scrape_banjir.py.
 * Scrapes Google News RSS, matches kecamatan names, computes risk scores.
 * Uses in-memory cache with TTL to avoid excessive requests.
 */

import {
  KELURAHAN_TO_KECAMATAN,
  KOTA_LIST,
  FLOOD_KEYWORDS,
  buildSearchQueries,
} from "./kecamatan-list";

// ---------- Types -----------------------------------------------------------

export interface FloodRiskResult {
  Kecamatan: string;
  Kota: string;
  Sebutan_Langsung: number;
  Risiko_Banjir: number;
  Kategori_Risiko: string;
}

export interface NewsArticleResult {
  Judul: string;
  Link: string;
  Tanggal: string;
  Kecamatan_Terkait: string;
  Sumber: string;
  Relevansi: number; // 0-1 relevance score
}

interface RawArticle {
  title: string;
  description: string;
  published: string;
  link: string;
  text: string; // title + description combined
}

interface ScrapeCache {
  floodRisk: FloodRiskResult[];
  news: NewsArticleResult[];
  timestamp: number;
}

// ---------- Cache -----------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let cache: ScrapeCache | null = null;

export function getCachedData(): ScrapeCache | null {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache;
  }
  return null;
}

export function getCacheTimestamp(): number | null {
  return cache?.timestamp ?? null;
}

// ---------- RSS Fetch -------------------------------------------------------

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

/** Simple XML text extractor — pulls text content between given tags */
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    "i"
  );
  const match = regex.exec(xml);
  if (!match) return "";
  return (match[1] ?? match[2] ?? "").trim();
}

/** Parse RSS XML into items */
function parseRssItems(
  xml: string
): Array<{
  title: string;
  description: string;
  published: string;
  link: string;
}> {
  const items: Array<{
    title: string;
    description: string;
    published: string;
    link: string;
  }> = [];

  // Split by <item> tags
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];
    items.push({
      title: extractTag(itemXml, "title"),
      description: extractTag(itemXml, "description"),
      published: extractTag(itemXml, "pubDate"),
      link: extractTag(itemXml, "link"),
    });
  }
  return items;
}

/** Fetch a single RSS feed */
async function fetchRssFeed(query: string): Promise<RawArticle[]> {
  const encoded = encodeURIComponent(query);
  const url = GOOGLE_NEWS_RSS.replace("{query}", encoded);

  try {
    const resp = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return [];

    const xml = await resp.text();
    const items = parseRssItems(xml);
    return items.map((item) => ({
      title: item.title,
      description: item.description,
      published: item.published,
      link: item.link,
      text: `${item.title} ${item.description}`,
    }));
  } catch {
    return [];
  }
}

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Main Scraper ----------------------------------------------------

/** Load kecamatan-kota pairs from the static JSON */
async function loadKecamatanPairs(): Promise<
  Array<{ Kecamatan: string; Kota: string }>
> {
  // In a server-side Next.js route, we can read the file directly
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "kecamatan_stats.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  const data: Array<{ Kecamatan: string; Kota: string }> = JSON.parse(raw);
  return data.map((d) => ({ Kecamatan: d.Kecamatan, Kota: d.Kota }));
}

/**
 * Run the full scrape. Fetches Google News RSS for all queries,
 * matches kecamatan names, and computes risk scores.
 *
 * @param batchSize Number of concurrent requests per batch
 * @param delayMs Delay between batches in ms
 */
export async function runScrape(
  batchSize = 5,
  delayMs = 800
): Promise<ScrapeCache> {
  // Return cache if fresh
  const cached = getCachedData();
  if (cached) return cached;

  const kecKota = await loadKecamatanPairs();
  const allKecamatan = [...new Set(kecKota.map((k) => k.Kecamatan))].sort();
  const queries = buildSearchQueries();

  // ---- Fetch all RSS feeds in batches ------------------------------------
  const allArticles: RawArticle[] = [];
  const seenTitles = new Set<string>();

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchRssFeed));

    for (const articles of batchResults) {
      for (const art of articles) {
        // Dedup by normalized title
        const titleClean = art.title.trim().toLowerCase().replace(/\s+/g, " ");
        if (seenTitles.has(titleClean)) continue;
        seenTitles.add(titleClean);

        // Only keep flood-related articles
        const combined = art.text.toLowerCase();
        if (
          !FLOOD_KEYWORDS.some((kw) => combined.includes(kw.trim()))
        )
          continue;

        allArticles.push(art);
      }
    }

    // Wait between batches to be polite
    if (i + batchSize < queries.length) {
      await sleep(delayMs);
    }
  }

  // ---- Match kecamatan names in articles ---------------------------------
  const kecMentionCount: Record<string, number> = {};
  const kecArticles: Record<string, Array<{ title: string; link: string }>> =
    {};

  for (const kec of allKecamatan) {
    kecMentionCount[kec] = 0;
    kecArticles[kec] = [];
  }

  // Direct kecamatan name matching
  for (const kec of allKecamatan) {
    const pattern = new RegExp(`\\b${escapeRegex(kec)}\\b`, "i");
    for (const art of allArticles) {
      if (pattern.test(art.text)) {
        kecMentionCount[kec] = (kecMentionCount[kec] || 0) + 1;
        kecArticles[kec]?.push({
          title: art.title.slice(0, 80),
          link: art.link,
        });
      }
    }
  }

  // Kelurahan → kecamatan mapping
  for (const [kelName, kecName] of Object.entries(KELURAHAN_TO_KECAMATAN)) {
    if (!(kecName in kecMentionCount)) continue;
    const pattern = new RegExp(`\\b${escapeRegex(kelName)}\\b`, "i");
    for (const art of allArticles) {
      if (pattern.test(art.text)) {
        kecMentionCount[kecName] = (kecMentionCount[kecName] || 0) + 1;
        kecArticles[kecName]?.push({
          title: art.title.slice(0, 80),
          link: art.link,
        });
      }
    }
  }

  // City-level mention bonus
  const cityMentionCount: Record<string, number> = {};
  const cityPatterns: Array<{ kota: string; pattern: RegExp }> = KOTA_LIST.map(
    (kota) => ({
      kota,
      pattern: new RegExp(`\\b${escapeRegex(kota)}\\b`, "i"),
    })
  );

  for (const art of allArticles) {
    for (const { kota, pattern } of cityPatterns) {
      if (pattern.test(art.text)) {
        cityMentionCount[kota] = (cityMentionCount[kota] || 0) + 1;
      }
    }
  }

  // ---- Build risk scores ------------------------------------------------
  const rawScores: Array<{
    Kecamatan: string;
    Kota: string;
    Sebutan_Langsung: number;
    rawScore: number;
  }> = [];

  for (const pair of kecKota) {
    const direct = kecMentionCount[pair.Kecamatan] || 0;
    const cityMentions = cityMentionCount[pair.Kota] || 0;
    const cityBonus = cityMentions * 0.05;
    rawScores.push({
      Kecamatan: pair.Kecamatan,
      Kota: pair.Kota,
      Sebutan_Langsung: direct,
      rawScore: direct + cityBonus,
    });
  }

  const maxScore = Math.max(...rawScores.map((r) => r.rawScore), 1);

  const floodRisk: FloodRiskResult[] = rawScores
    .map((r) => {
      const normalized = r.rawScore / maxScore;
      return {
        Kecamatan: r.Kecamatan,
        Kota: r.Kota,
        Sebutan_Langsung: r.Sebutan_Langsung,
        Risiko_Banjir: Math.round(normalized * 10000) / 10000,
        Kategori_Risiko: riskCategory(normalized),
      };
    })
    .sort((a, b) => b.Risiko_Banjir - a.Risiko_Banjir);

  // ---- Build news articles list -----------------------------------------
  const news: NewsArticleResult[] = allArticles
    .map((art) => {
      const matchedKec: string[] = [];
      const textLower = art.text.toLowerCase();

      // Direct kecamatan match
      for (const kec of allKecamatan) {
        if (new RegExp(`\\b${escapeRegex(kec)}\\b`, "i").test(art.text)) {
          matchedKec.push(kec);
        }
      }
      // Kelurahan match
      for (const [kelName, kecName] of Object.entries(KELURAHAN_TO_KECAMATAN)) {
        if (new RegExp(`\\b${escapeRegex(kelName)}\\b`, "i").test(art.text)) {
          if (!matchedKec.includes(kecName)) {
            matchedKec.push(kecName);
          }
        }
      }

      // Compute relevance score (0-1)
      let relevansi = 0;
      const titleLower = art.title.toLowerCase();
      // Title contains flood keyword = high relevance
      if (FLOOD_KEYWORDS.some((kw) => titleLower.includes(kw.trim()))) {
        relevansi += 0.5;
      }
      // Has specific kecamatan match = more relevant
      if (matchedKec.length > 0) relevansi += 0.3;
      // Contains specific area detail keywords
      const detailKw = ["korban", "pengungsi", "ketinggian", "cm", "meter", "rt ", "rw ", "evakuasi", "terendam", "surut"];
      if (detailKw.some((kw) => textLower.includes(kw))) relevansi += 0.2;

      // Extract source from Google News title ("Title - Source")
      const sumber = art.title.includes(" - ")
        ? art.title.split(" - ").pop()?.trim() ?? ""
        : "";
      const judulClean = sumber
        ? art.title.replace(` - ${sumber}`, "").trim()
        : art.title;

      return {
        Judul: judulClean,
        Link: art.link,
        Tanggal: art.published,
        Kecamatan_Terkait: matchedKec.join(", "),
        Sumber: sumber,
        Relevansi: Math.min(relevansi, 1),
      };
    })
    // Sort by relevance (most relevant first)
    .sort((a, b) => b.Relevansi - a.Relevansi);

  // ---- Cache & return ---------------------------------------------------
  const result: ScrapeCache = {
    floodRisk,
    news,
    timestamp: Date.now(),
  };
  cache = result;
  return result;
}

// ---------- Helpers ---------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function riskCategory(score: number): string {
  if (score >= 0.6) return "Tinggi";
  if (score >= 0.3) return "Sedang";
  if (score > 0) return "Rendah";
  return "Tidak Terdeteksi";
}
