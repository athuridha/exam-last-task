import { NextResponse } from "next/server";
import { runScrape, getCacheTimestamp } from "@/lib/flood-scraper";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // allow up to 2 min for scraping

export async function GET() {
  try {
    const data = await runScrape();
    return NextResponse.json({
      data: data.floodRisk,
      lastUpdated: data.timestamp,
      source: "live",
    });
  } catch (error) {
    // Fallback to static JSON if scraping fails
    console.error("Live scrape failed, falling back to static data:", error);
    try {
      const fallbackPath = join(
        process.cwd(),
        "public",
        "data",
        "risiko_banjir.json"
      );
      const fallbackData = JSON.parse(readFileSync(fallbackPath, "utf-8"));
      return NextResponse.json({
        data: fallbackData,
        lastUpdated: getCacheTimestamp(),
        source: "static-fallback",
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to load flood risk data" },
        { status: 500 }
      );
    }
  }
}
