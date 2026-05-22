import { NextResponse } from "next/server";
import { runCrimeScrape, getCrimeCacheTimestamp } from "@/lib/crime-scraper";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // allow up to 2 min for scraping

export async function GET() {
  try {
    const data = await runCrimeScrape();
    return NextResponse.json({
      data: data.crimeRisk,
      news: data.news,
      lastUpdated: data.timestamp,
      source: "live",
    });
  } catch (error) {
    // Fallback to static JSON if scraping fails
    console.error("Live crime scrape failed, falling back to static data:", error);
    try {
      const fallbackPath = join(
        process.cwd(),
        "public",
        "data",
        "risiko_kejahatan.json"
      );
      
      if (existsSync(fallbackPath)) {
        const fallbackData = JSON.parse(readFileSync(fallbackPath, "utf-8"));
        return NextResponse.json({
          data: fallbackData,
          news: [],
          lastUpdated: getCrimeCacheTimestamp(),
          source: "static-fallback",
        });
      }
      
      // If no fallback file exists, return empty data
      return NextResponse.json({
        data: [],
        news: [],
        lastUpdated: null,
        source: "empty",
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to load crime risk data" },
        { status: 500 }
      );
    }
  }
}
