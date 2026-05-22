"""
Scrape Flood News from Google News RSS
Generates flood risk scores per kecamatan based on news mention frequency.
"""
import os
import re
import time
import urllib.parse
import requests
import feedparser
import pandas as pd
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'rumah123_jabodetabek_with_features.csv')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data_referensi', 'risiko_banjir_berita.csv')
ARTICLES_FILE = os.path.join(BASE_DIR, 'data_referensi', 'berita_banjir_lengkap.csv')

# ---- Load kecamatan list ----------------------------------------------------
print("Loading kecamatan list...")
df = pd.read_csv(DATA_FILE)
kec_kota = df.groupby(['Kecamatan', 'Kota']).size().reset_index(name='listing_count')
print(f"  {len(kec_kota)} kecamatan across {kec_kota['Kota'].nunique()} kota")

# All unique kecamatan names for matching
all_kecamatan = sorted(kec_kota['Kecamatan'].unique())
print(f"  {len(all_kecamatan)} unique kecamatan names")

# ---- Build search queries ---------------------------------------------------
kota_list = [
    'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat',
    'Jakarta Selatan', 'Jakarta Utara',
    'Bekasi', 'Bogor', 'Depok', 'Tangerang', 'Tangerang Selatan',
]

# Search queries: general + per kota
queries = [
    'banjir jabodetabek',
    'banjir jakarta',
    'banjir DKI Jakarta',
    'banjir bodetabek',
    'daerah rawan banjir jakarta',
    'daerah rawan banjir jabodetabek',
    'banjir rob jakarta utara',
    'genangan banjir jakarta',
]
for kota in kota_list:
    queries.append(f'banjir {kota}')
    queries.append(f'daerah rawan banjir {kota}')

# Also add specific kecamatan that are well-known for flooding
known_flood_areas = [
    'Kampung Melayu', 'Bidara Cina', 'Cipinang Melayu', 'Jatinegara',
    'Cawang', 'Kalibata', 'Rawajati', 'Manggarai', 'Bukit Duri',
    'Kebon Pala', 'Cipinang', 'Cililitan', 'Makasar',
    'Kemang', 'Pejaten', 'Cilandak', 'Kebayoran Lama',
    'Penjaringan', 'Pademangan', 'Koja', 'Cilincing',
    'Cengkareng', 'Kalideres', 'Kembangan',
    'Pondok Labu', 'Cipete', 'Pesanggrahan',
]
for area in known_flood_areas:
    queries.append(f'banjir {area}')

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

print("\nScraping Google News RSS...")
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

            # Only keep if related to banjir/genangan/rob
            combined = f"{title} {desc}".lower()
            if not any(w in combined for w in ['banjir', 'genangan', 'rob ', 'terendam', 'kebanjiran']):
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

print(f"\nTotal unique articles: {len(all_articles)}")

# ---- Match kecamatan names in articles --------------------------------------
print("\nMatching kecamatan names in news articles...")

# Build regex patterns for each kecamatan
# Use word boundaries to avoid partial matches
kec_mention_count = Counter()

# Also track which articles mention each kecamatan (for transparency)
# Store tuples of (title, link) instead of just title
kec_articles = {k: [] for k in all_kecamatan}

for kec_name in all_kecamatan:
    # Create pattern - escape special chars, case insensitive
    pattern = re.compile(r'\b' + re.escape(kec_name) + r'\b', re.IGNORECASE)

    for art in all_articles:
        text = art['text']
        if pattern.search(text):
            kec_mention_count[kec_name] += 1
            kec_articles[kec_name].append((art['title'][:80], art['link']))

# Also check for common alternate names / kelurahan that map to kecamatan
# These are well-known flood areas often mentioned by kelurahan name
kelurahan_to_kecamatan = {
    'kampung melayu': 'Jatinegara',
    'bidara cina': 'Jatinegara',
    'bukit duri': 'Tebet',
    'kebon pala': 'Makasar',
    'rawajati': 'Pancoran',
    'manggarai': 'Tebet',
    'cipinang melayu': 'Makasar',
    'cawang': 'Kramat Jati',
    'kalibata': 'Pancoran',
    'pondok labu': 'Cilandak',
    'cipete': 'Cilandak',
    'pejaten': 'Pasar Minggu',
    'kemang': 'Mampang Prapatan',
    'pluit': 'Penjaringan',
    'muara baru': 'Penjaringan',
    'kapuk': 'Cengkareng',
    'semanan': 'Kalideres',
    'rawa buaya': 'Cengkareng',
    'tomang': 'Grogol Petamburan',
    'jelambar': 'Grogol Petamburan',
    'ciledug': 'Ciledug',
    'karang tengah': 'Karang Tengah',
    'teluk naga': 'Teluk Naga',
}

for kel_name, kec_name in kelurahan_to_kecamatan.items():
    if kec_name in kec_articles:
        pattern = re.compile(r'\b' + re.escape(kel_name) + r'\b', re.IGNORECASE)
        for art in all_articles:
            if pattern.search(art['text']):
                kec_mention_count[kec_name] += 1
                kec_articles[kec_name].append((f"[kel:{kel_name}] {art['title'][:60]}", art['link']))

# Also check city-level mentions and distribute to known flood kecamatan
# Example: "banjir Jakarta Timur" benefits all Jakarta Timur kecamatan slightly
city_mention_count = Counter()
city_patterns = {}
for kota in kota_list:
    city_patterns[kota] = re.compile(r'\b' + re.escape(kota) + r'\b', re.IGNORECASE)

for art in all_articles:
    text = art['text']
    for kota, pattern in city_patterns.items():
        if pattern.search(text):
            city_mention_count[kota] += 1

# ---- Build risk scores -----------------------------------------------------
print("\nBuilding flood risk scores...")

results = []
for _, row in kec_kota.iterrows():
    kec = row['Kecamatan']
    kota = row['Kota']
    direct_mentions = kec_mention_count.get(kec, 0)
    # Add a fraction of city-level mentions as context
    city_mentions = city_mention_count.get(kota, 0)
    city_bonus = city_mentions * 0.05  # Small boost from city-level news

    total_score = direct_mentions + city_bonus
    sample_articles = kec_articles.get(kec, [])[:5]  # list of (title, link)

    # Format: "judul [link]" separated by " | "
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
    result_df['Risiko_Banjir'] = (result_df['Skor_Mentah'] / max_score).round(4)
else:
    result_df['Risiko_Banjir'] = 0.0

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

result_df['Kategori_Risiko'] = result_df['Risiko_Banjir'].apply(risk_category)

# Sort by risk
result_df = result_df.sort_values('Risiko_Banjir', ascending=False).reset_index(drop=True)

# ---- Save results -----------------------------------------------------------
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
result_df.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
print(f"\nSaved: {OUTPUT_FILE}")

# ---- Save full articles list with links -------------------------------------
print("Saving full articles list...")

# Build article-kecamatan mapping
article_rows = []
for art in all_articles:
    text = art['text']
    matched_kec = []
    for kec_name in all_kecamatan:
        if re.search(r'\b' + re.escape(kec_name) + r'\b', text, re.IGNORECASE):
            matched_kec.append(kec_name)
    for kel_name, kec_name in kelurahan_to_kecamatan.items():
        if re.search(r'\b' + re.escape(kel_name) + r'\b', text, re.IGNORECASE):
            if kec_name not in matched_kec:
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
print("RINGKASAN RISIKO BANJIR (Berdasarkan Berita)")
print("=" * 60)
print(f"Total artikel unik ditemukan: {len(all_articles)}")
print(f"Total kecamatan dianalisis: {len(result_df)}")
print(f"\nDistribusi Risiko:")
print(result_df['Kategori_Risiko'].value_counts().to_string())

print(f"\nTop 20 Kecamatan Rawan Banjir:")
top20 = result_df.head(20)
for _, r in top20.iterrows():
    print(f"  {r['Kecamatan']:25s} ({r['Kota']:20s}) - "
          f"Sebutan: {r['Sebutan_Langsung']:3d} | Risiko: {r['Risiko_Banjir']:.3f} [{r['Kategori_Risiko']}]")

print(f"\nKecamatan tanpa sebutan banjir: "
      f"{len(result_df[result_df['Sebutan_Langsung'] == 0])}/{len(result_df)}")
print("\nDone!")
