/**
 * Live crime news scraper — similar pattern to flood-scraper.
 * Scrapes Google News RSS for crime-related news in Jabodetabek.
 */

import { KOTA_LIST } from "./kecamatan-list";

// ---------- Types -----------------------------------------------------------

export interface CrimeRiskResult {
  Kecamatan: string;
  Kota: string;
  Sebutan_Langsung: number;
  Risiko_Kejahatan: number;
  Kategori_Risiko: string;
}

export interface CrimeNewsResult {
  Judul: string;
  Link: string;
  Tanggal: string;
  Kecamatan_Terkait: string;
  Sumber: string;
  Relevansi: number;
}

interface RawArticle {
  title: string;
  description: string;
  published: string;
  link: string;
  text: string;
}

interface CrimeScrapeCache {
  crimeRisk: CrimeRiskResult[];
  news: CrimeNewsResult[];
  timestamp: number;
}

// ---------- Constants -------------------------------------------------------

/** Crime-related keywords for filtering */
export const CRIME_KEYWORDS = [
  "pencurian",
  "perampokan",
  "pembunuhan",
  "penculikan",
  "penjambretan",
  "begal",
  "kriminal",
  "kejahatan",
  "tawuran",
  "penusukan",
  "perampasan",
  "penipuan",
  "kekerasan",
  "perkosaan",
  "narkoba",
  "pembobolan",
  "curanmor",
  "curas",
  "curat",
  "pengeroyokan",
];

/** Known crime-prone areas for targeted search queries */
const KNOWN_CRIME_AREAS = [
  "Kemayoran",
  "Tanah Abang",
  "Jatinegara",
  "Bekasi",
  "Depok",
  "Cengkareng",
  "Koja",
  "Cilincing",
  "Penjaringan",
  "Tambora",
  "Sawah Besar",
  "Senen",
  "Cakung",
  "Ciracas",
  "Kalideres",
];

/** Build search queries for crime news */
function buildCrimeSearchQueries(): string[] {
  const queries: string[] = [
    "kriminalitas jabodetabek",
    "kejahatan jakarta",
    "pencurian jakarta",
    "perampokan jakarta",
    "begal jabodetabek",
    "daerah rawan kriminal jakarta",
    "tingkat kejahatan jakarta",
    "kasus kriminal jabodetabek",
  ];
  
  for (const kota of KOTA_LIST) {
    queries.push(`kejahatan ${kota}`);
    queries.push(`kriminal ${kota}`);
    queries.push(`pencurian ${kota}`);
  }
  
  for (const area of KNOWN_CRIME_AREAS) {
    queries.push(`kejahatan ${area}`);
    queries.push(`kriminal ${area}`);
  }
  
  return queries;
}

// ---------- Cache -----------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let crimeCache: CrimeScrapeCache | null = null;

export function getCrimeCachedData(): CrimeScrapeCache | null {
  if (crimeCache && Date.now() - crimeCache.timestamp < CACHE_TTL_MS) {
    return crimeCache;
  }
  return null;
}

export function getCrimeCacheTimestamp(): number | null {
  return crimeCache?.timestamp ?? null;
}

// ---------- RSS Fetch -------------------------------------------------------

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id";

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    "i"
  );
  const match = regex.exec(xml);
  if (!match) return "";
  return (match[1] ?? match[2] ?? "").trim();
}

function parseRssItems(xml: string): Array<{
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- Main Scraper ----------------------------------------------------

async function loadKecamatanPairs(): Promise<
  Array<{ Kecamatan: string; Kota: string }>
> {
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

export async function runCrimeScrape(
  batchSize = 5,
  delayMs = 800
): Promise<CrimeScrapeCache> {
  // Return cache if fresh
  const cached = getCrimeCachedData();
  if (cached) return cached;

  const kecKota = await loadKecamatanPairs();
  const allKecamatan = [...new Set(kecKota.map((k) => k.Kecamatan))].sort();
  const queries = buildCrimeSearchQueries();

  // Fetch all RSS feeds in batches
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

        // Only keep crime-related articles
        const combined = art.text.toLowerCase();
        if (!CRIME_KEYWORDS.some((kw) => combined.includes(kw.trim()))) continue;

        allArticles.push(art);
      }
    }

    // Wait between batches
    if (i + batchSize < queries.length) {
      await sleep(delayMs);
    }
  }

  // Match kecamatan names in articles
  const kecMentionCount: Record<string, number> = {};
  const kecArticles: Record<string, Array<{ title: string; link: string; published: string }>> = {};

  for (const kec of allKecamatan) {
    kecMentionCount[kec] = 0;
    kecArticles[kec] = [];
  }

  for (const kec of allKecamatan) {
    const pattern = new RegExp(`\\b${escapeRegex(kec)}\\b`, "i");
    for (const art of allArticles) {
      if (pattern.test(art.text)) {
        kecMentionCount[kec] = (kecMentionCount[kec] || 0) + 1;
        kecArticles[kec]?.push({
          title: art.title.slice(0, 100),
          link: art.link,
          published: art.published,
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

  // Build risk scores
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

  const crimeRisk: CrimeRiskResult[] = rawScores
    .map((r) => {
      const normalized = r.rawScore / maxScore;
      return {
        Kecamatan: r.Kecamatan,
        Kota: r.Kota,
        Sebutan_Langsung: r.Sebutan_Langsung,
        Risiko_Kejahatan: parseFloat(normalized.toFixed(3)),
        Kategori_Risiko:
          normalized > 0.6
            ? "Tinggi"
            : normalized > 0.3
            ? "Sedang"
            : "Rendah",
      };
    })
    .sort((a, b) => b.Risiko_Kejahatan - a.Risiko_Kejahatan);

  // Build news list with kecamatan association
  const newsItems: CrimeNewsResult[] = [];
  const seenNewsLinks = new Set<string>();

  for (const kec of allKecamatan) {
    const articles = kecArticles[kec] || [];
    for (const art of articles) {
      if (seenNewsLinks.has(art.link)) continue;
      seenNewsLinks.add(art.link);

      newsItems.push({
        Judul: art.title,
        Link: art.link,
        Tanggal: art.published,
        Kecamatan_Terkait: kec,
        Sumber: "Google News",
        Relevansi: 0.8,
      });
    }
  }

  // Sort by date (newest first)
  newsItems.sort((a, b) => {
    const dateA = new Date(a.Tanggal).getTime() || 0;
    const dateB = new Date(b.Tanggal).getTime() || 0;
    return dateB - dateA;
  });

  // Update cache
  crimeCache = {
    crimeRisk,
    news: newsItems.slice(0, 100), // Limit to 100 articles
    timestamp: Date.now(),
  };

  return crimeCache;
}
