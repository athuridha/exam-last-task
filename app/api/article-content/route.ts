import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract main article text from HTML by collecting <p> tag content */
function extractArticleText(html: string): string {
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    // Only keep paragraphs with meaningful text (> 40 chars, likely article body)
    if (text.length > 40) {
      paragraphs.push(text);
    }
  }
  return paragraphs.join("\n\n");
}

/** Extract page title from HTML */
function extractTitle(html: string): string {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return titleMatch ? stripHtml(titleMatch[1]) : "";
}

/** Extract meta description */
function extractMetaDescription(html: string): string {
  const metaMatch =
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i.exec(
      html
    ) ??
    /<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i.exec(
      html
    );
  return metaMatch ? stripHtml(metaMatch[1] ?? metaMatch[2] ?? "") : "";
}

/** Try to extract og:image */
function extractOgImage(html: string): string {
  const ogMatch =
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i.exec(
      html
    ) ??
    /<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:image["'][^>]*>/i.exec(
      html
    );
  return ogMatch ? (ogMatch[1] ?? ogMatch[2] ?? "") : "";
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Basic URL validation
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Follow redirects to get the real article URL
    const resp = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${resp.status}` },
        { status: 502 }
      );
    }

    const finalUrl = resp.url; // The actual article URL after redirects
    const html = await resp.text();

    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const image = extractOgImage(html);
    const content = extractArticleText(html);

    // Build a snippet: prefer extracted content, fall back to meta description
    const snippet = content
      ? content.slice(0, 2000) // Limit to ~2000 chars
      : description || "Tidak dapat mengekstrak isi artikel.";

    return NextResponse.json({
      title,
      description,
      image,
      content: snippet,
      finalUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gagal mengambil artikel: ${message}` },
      { status: 502 }
    );
  }
}
