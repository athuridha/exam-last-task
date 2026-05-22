"""
Scrape Crime News from Google News RSS
Generates crime risk scores per kecamatan based on news mention frequency.

Port dari lib/crime-scraper.ts (Next.js) ke Python pipeline.
Mengikuti pola yang sama dengan scrape_risiko_banjir.py.

Sumber: Google News RSS Feed
Keyword: pencurian, perampokan, begal, curanmor, tawuran, dll.
"""
import os
import re
import time
import sys
import urllib.parse
import requests
import feedparser
import pandas as pd
from collections import Counter

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REFERENCE_DIR

# ---- Paths ------------------------------------------------------------------
OUTPUT_FILE = os.path.join(REFERENCE_DIR, 'risiko_kejahatan_berita.csv')
ARTICLES_FILE = os.path.join(REFERENCE_DIR, 'berita_kejahatan_lengkap.csv')
KECAMATAN_CSV = os.path.join(REFERENCE_DIR, 'koordinat_kecamatan.csv')

# ---- Constants (ported from crime-scraper.ts) --------------------------------

CRIME_KEYWORDS = [
    'pencurian', 'perampokan', 'pembunuhan', 'penculikan',
    'penjambretan', 'begal', 'kriminal', 'kejahatan',
    'tawuran', 'penusukan', 'perampasan', 'penipuan',
    'kekerasan', 'perkosaan', 'narkoba', 'pembobolan',
    'curanmor', 'curas', 'curat', 'pengeroyokan',
]

KNOWN_CRIME_AREAS = [
    'Kemayoran', 'Tanah Abang', 'Jatinegara', 'Bekasi', 'Depok',
    'Cengkareng', 'Koja', 'Cilincing', 'Penjaringan', 'Tambora',
    'Sawah Besar', 'Senen', 'Cakung', 'Ciracas', 'Kalideres',
]

KOTA_LIST = [
    'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat',
    'Jakarta Selatan', 'Jakarta Utara',
    'Bekasi', 'Bogor', 'Depok', 'Tangerang', 'Tangerang Selatan',
]

# ---- Load kecamatan list ---------------------------------------------------

print("Loading kecamatan list...")
kec_df = pd.read_csv(KECAMATAN_CSV)
kec_kota = kec_df[['Kecamatan', 'Kota']].drop_duplicates()
print(f"  {len(kec_kota)} kecamatan across {kec_kota['Kota'].nunique()} kota")

all_kecamatan = sorted(kec_kota['Kecamatan'].unique())
print(f"  {len(all_kecamatan)} unique kecamatan names")

# ---- Build search queries ---------------------------------------------------

queries = [
    'kriminalitas jabodetabek',
    'kejahatan jakarta',
    'pencurian jakarta',
    'perampokan jakarta',
    'begal jabodetabek',
    'daerah rawan kriminal jakarta',
    'tingkat kejahatan jakarta',
    'kasus kriminal jabodetabek',
]

for kota in KOTA_LIST:
    queries.append(f'kejahatan {kota}')
    queries.append(f'kriminal {kota}')
    queries.append(f'pencurian {kota}')

for area in KNOWN_CRIME_AREAS:
    queries.append(f'kejahatan {area}')
    queries.append(f'kriminal {area}')

print(f"  Total search queries: {len(queries)}")

# ---- Scrape Google News RSS -------------------------------------------------

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
}

all_articles = []
seen_titles = set()

print("\nScraping Google News RSS for crime news...")
for i, query in enumerate(queries):
    encoded_q = urllib.parse.quote(query)
    url = GOOGLE_NEWS_RSS.format(query=encoded_q)

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"  [{i+1}/{len(queries)}] SKIP {query} (HTTP {resp.status_code})")
            continue

        feed = feedparser.parse(resp.text)
        count = 0
        for entry in feed.entries:
            title = entry.get('title', '')
            desc = entry.get('summary', '') or entry.get('description', '')
            pub_date = entry.get('published', '')
            link = entry.get('link', '')

            # Deduplicate by title
            title_clean = re.sub(r'\s+', ' ', title.strip().lower())
            if title_clean in seen_titles:
                continue
            seen_titles.add(title_clean)

            # Only keep if related to crime
            combined = f"{title} {desc}".lower()
            if not any(kw in combined for kw in CRIME_KEYWORDS):
                continue

            all_articles.append({
                'title': title,
                'description': desc,
                'published': pub_date,
                'link': link,
                'query': query,
                'text': f"{title} {desc}",
            })
            count += 1

        print(f"  [{i+1}/{len(queries)}] {query}: {count} articles")

    except Exception as e:
        print(f"  [{i+1}/{len(queries)}] ERROR {query}: {e}")

    # Polite delay
    time.sleep(1.0)

print(f"\nTotal unique crime articles: {len(all_articles)}")

# ---- Match kecamatan names in articles --------------------------------------

print("\nMatching kecamatan names in crime articles...")
kec_mention_count = Counter()
kec_articles = {k: [] for k in all_kecamatan}

for kec_name in all_kecamatan:
    pattern = re.compile(r'\b' + re.escape(kec_name) + r'\b', re.IGNORECASE)
    for art in all_articles:
        text = art['text']
        if pattern.search(text):
            kec_mention_count[kec_name] += 1
            kec_articles[kec_name].append((art['title'][:80], art['link']))

# City-level mention distribution
city_mention_count = Counter()
city_patterns = {}
for kota in KOTA_LIST:
    city_patterns[kota] = re.compile(r'\b' + re.escape(kota) + r'\b', re.IGNORECASE)

for art in all_articles:
    text = art['text']
    for kota, pattern in city_patterns.items():
        if pattern.search(text):
            city_mention_count[kota] += 1

# ---- Build risk scores ------------------------------------------------------

print("\nBuilding crime risk scores...")
results = []
for _, row in kec_kota.iterrows():
    kec = row['Kecamatan']
    kota = row['Kota']
    direct_mentions = kec_mention_count.get(kec, 0)
    city_mentions = city_mention_count.get(kota, 0)
    city_bonus = city_mentions * 0.05

    total_score = direct_mentions + city_bonus
    sample_articles = kec_articles.get(kec, [])[:5]

    contoh = ' | '.join(f"{t} [{l}]" for t, l in sample_articles) if sample_articles else ''

    results.append({
        'Kecamatan': kec,
        'Kota': kota,
        'Sebutan_Langsung': direct_mentions,
        'Sebutan_Kota': city_mentions,
        'Skor_Mentah': round(total_score, 2),
        'Contoh_Berita': contoh,
    })

result_df = pd.DataFrame(results)

# Normalize score to 0-1 range
max_score = result_df['Skor_Mentah'].max()
if max_score > 0:
    result_df['Risiko_Kejahatan'] = (result_df['Skor_Mentah'] / max_score).round(4)
else:
    result_df['Risiko_Kejahatan'] = 0.0

# Assign risk category
def risk_category(score):
    if score >= 0.6:
        return 'Tinggi'
    elif score >= 0.3:
        return 'Sedang'
    elif score > 0:
        return 'Rendah'
    else:
        return 'Tidak Terdeteksi'

result_df['Kategori_Risiko'] = result_df['Risiko_Kejahatan'].apply(risk_category)

# Sort by risk
result_df = result_df.sort_values('Risiko_Kejahatan', ascending=False).reset_index(drop=True)

# ---- Save results -----------------------------------------------------------

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
result_df.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
print(f"\nSaved: {OUTPUT_FILE}")

# ---- Save full articles list ------------------------------------------------

print("Saving full articles list...")
article_rows = []
for art in all_articles:
    text = art['text']
    matched_kec = []
    for kec_name in all_kecamatan:
        if re.search(r'\b' + re.escape(kec_name) + r'\b', text, re.IGNORECASE):
            matched_kec.append(kec_name)
    article_rows.append({
        'Judul': art['title'],
        'Link': art['link'],
        'Tanggal': art['published'],
        'Kecamatan_Terkait': ', '.join(matched_kec) if matched_kec else '',
        'Query': art['query'],
    })

articles_df = pd.DataFrame(article_rows)
articles_df.to_csv(ARTICLES_FILE, index=False, encoding='utf-8-sig')
print(f"Saved: {ARTICLES_FILE} ({len(articles_df)} articles)")

# ---- Summary ----------------------------------------------------------------

print("\n" + "=" * 60)
print("RINGKASAN RISIKO KEJAHATAN (Berdasarkan Berita)")
print("=" * 60)
print(f"Total artikel unik ditemukan: {len(all_articles)}")
print(f"Total kecamatan dianalisis: {len(result_df)}")
print(f"\nDistribusi Risiko:")
print(result_df['Kategori_Risiko'].value_counts().to_string())

print(f"\nTop 20 Kecamatan Rawan Kejahatan:")
top20 = result_df.head(20)
for _, r in top20.iterrows():
    print(f"  {r['Kecamatan']:25s} ({r['Kota']:20s}) - "
          f"Sebutan: {r['Sebutan_Langsung']:3d} | Risiko: {r['Risiko_Kejahatan']:.3f} [{r['Kategori_Risiko']}]")

print(f"\nKecamatan tanpa sebutan kejahatan: "
      f"{len(result_df[result_df['Sebutan_Langsung'] == 0])}/{len(result_df)}")
print("\nDone!")
