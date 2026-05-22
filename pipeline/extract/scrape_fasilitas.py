"""
Geocode all facilities (Fasilitas, Stasiun, GerbangTol) using OpenStreetMap Nominatim API.
Updates SQLite database with accurate coordinates.
"""
import sqlite3
import urllib.request
import urllib.parse
import json
import time
import sys

DB_PATH = 'visualisasi-properti/prisma/dev.db'
NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
HEADERS = {'User-Agent': 'ThesisPropertyViz/1.0 (academic research)'}

# Jabodetabek bounding box: south,north,west,east
VIEWBOX = '106.4,-6.8,107.3,-6.0'

# Kota name mapping for search queries
KOTA_SEARCH = {
    'Jakarta Pusat': 'Jakarta Pusat',
    'Jakarta Selatan': 'Jakarta Selatan',
    'Jakarta Barat': 'Jakarta Barat',
    'Jakarta Timur': 'Jakarta Timur',
    'Jakarta Utara': 'Jakarta Utara',
    'Tangerang': 'Tangerang, Banten',
    'Tangerang Selatan': 'Tangerang Selatan, Banten',
    'Bekasi': 'Bekasi, Jawa Barat',
    'Bogor': 'Bogor, Jawa Barat',
    'Depok': 'Depok, Jawa Barat',
}

def nominatim_search(query, bounded=True):
    """Search Nominatim with rate limiting."""
    params = {
        'q': query,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'id',
        'viewbox': VIEWBOX,
    }
    if bounded:
        params['bounded'] = 1
    
    url = f"{NOMINATIM_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"    ERROR: {e}")
    return None


def geocode_facility(nama, jenis, kota):
    """Try multiple search strategies for a facility."""
    kota_str = KOTA_SEARCH.get(kota, kota)
    
    # Strategy 1: Full name + city
    result = nominatim_search(f"{nama}, {kota_str}, Indonesia")
    if result:
        return result, 'name+city'
    time.sleep(1.1)
    
    # Strategy 2: Full name + Jakarta/region
    result = nominatim_search(f"{nama}, Jakarta, Indonesia")
    if result:
        return result, 'name+jakarta'
    time.sleep(1.1)
    
    # Strategy 3: Just the name within viewbox (bounded)
    result = nominatim_search(f"{nama}, Indonesia", bounded=True)
    if result:
        return result, 'name+bounded'
    time.sleep(1.1)
    
    # Strategy 4: Simplified name (remove common prefixes/suffixes)
    simple = nama
    for prefix in ['SDN ', 'SMPN ', 'SMAN ', 'TK ', 'RS ', 'RSUD ', 'RSCM', 'RSPAD ']:
        if simple.startswith(prefix):
            simple = simple[len(prefix):]
            break
    if simple != nama:
        result = nominatim_search(f"{simple}, {kota_str}, Indonesia")
        if result:
            return result, 'simplified'
        time.sleep(1.1)
    
    return None, 'not_found'


def geocode_station(nama, line):
    """Geocode a train/MRT/LRT station."""
    # Strategy 1: "Stasiun NAME" 
    result = nominatim_search(f"Stasiun {nama}, Jakarta, Indonesia")
    if result:
        return result, 'stasiun+name'
    time.sleep(1.1)
    
    # Strategy 2: "Stasiun NAME" in viewbox
    result = nominatim_search(f"Stasiun {nama}, Indonesia", bounded=True)
    if result:
        return result, 'stasiun+bounded'
    time.sleep(1.1)
    
    # Strategy 3: Just name for MRT/LRT
    if line and ('MRT' in line or 'LRT' in line):
        result = nominatim_search(f"{nama} {line} station, Jakarta, Indonesia")
        if result:
            return result, 'mrt_lrt'
        time.sleep(1.1)
    
    # Strategy 4: Just the name
    result = nominatim_search(f"{nama} station, Indonesia", bounded=True)
    if result:
        return result, 'station+bounded'
    time.sleep(1.1)
    
    return None, 'not_found'


def geocode_toll(nama, ruas_tol):
    """Geocode a toll gate."""
    # Strategy 1: "Gerbang Tol NAME"
    result = nominatim_search(f"Gerbang Tol {nama}, Jakarta, Indonesia")
    if result:
        return result, 'gerbang+name'
    time.sleep(1.1)
    
    # Strategy 2: "Tol NAME" with ruas
    if ruas_tol:
        result = nominatim_search(f"Tol {nama} {ruas_tol}, Indonesia", bounded=True)
        if result:
            return result, 'tol+ruas'
        time.sleep(1.1)
    
    # Strategy 3: Just name in viewbox
    result = nominatim_search(f"{nama}, Indonesia", bounded=True)
    if result:
        return result, 'name+bounded'
    time.sleep(1.1)
    
    return None, 'not_found'


def is_in_jabodetabek(lat, lng):
    """Check if coordinates are within Jabodetabek area."""
    return -7.0 <= lat <= -5.9 and 106.3 <= lng <= 107.4


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    updated = 0
    failed = 0
    skipped = 0
    
    # ===== FASILITAS =====
    cur.execute("SELECT id, nama, jenis, lat, lng, kota FROM Fasilitas ORDER BY id")
    facilities = cur.fetchall()
    total_f = len(facilities)
    print(f"=== Geocoding {total_f} Fasilitas ===")
    
    for i, (fid, nama, jenis, old_lat, old_lng, kota) in enumerate(facilities):
        print(f"[{i+1}/{total_f}] {nama} ({jenis}, {kota})", end='')
        sys.stdout.flush()
        
        result, method = geocode_facility(nama, jenis, kota)
        time.sleep(1.1)  # Rate limit
        
        if result:
            new_lat, new_lng = result
            if is_in_jabodetabek(new_lat, new_lng):
                dist_km = ((new_lat - old_lat)**2 + (new_lng - old_lng)**2)**0.5 * 111
                cur.execute("UPDATE Fasilitas SET lat=?, lng=?, sumber='OpenStreetMap Nominatim' WHERE id=?",
                           (new_lat, new_lng, fid))
                print(f" -> ({new_lat:.6f}, {new_lng:.6f}) [{method}] delta={dist_km:.1f}km")
                updated += 1
            else:
                print(f" -> OUTSIDE JABODETABEK ({new_lat}, {new_lng}), keeping old")
                skipped += 1
        else:
            print(f" -> NOT FOUND, keeping old ({old_lat}, {old_lng})")
            failed += 1
    
    conn.commit()
    print(f"\nFasilitas: {updated} updated, {failed} not found, {skipped} outside area")
    
    # ===== STASIUN =====
    up2 = 0
    fail2 = 0
    skip2 = 0
    cur.execute("SELECT id, nama, jenis, line, lat, lng FROM Stasiun ORDER BY id")
    stations = cur.fetchall()
    total_s = len(stations)
    print(f"\n=== Geocoding {total_s} Stasiun ===")
    
    for i, (sid, nama, jenis, line, old_lat, old_lng) in enumerate(stations):
        print(f"[{i+1}/{total_s}] {nama} ({line})", end='')
        sys.stdout.flush()
        
        result, method = geocode_station(nama, line)
        time.sleep(1.1)
        
        if result:
            new_lat, new_lng = result
            if is_in_jabodetabek(new_lat, new_lng):
                dist_km = ((new_lat - old_lat)**2 + (new_lng - old_lng)**2)**0.5 * 111
                cur.execute("UPDATE Stasiun SET lat=?, lng=?, sumber='OpenStreetMap Nominatim' WHERE id=?",
                           (new_lat, new_lng, sid))
                print(f" -> ({new_lat:.6f}, {new_lng:.6f}) [{method}] delta={dist_km:.1f}km")
                up2 += 1
            else:
                print(f" -> OUTSIDE ({new_lat}, {new_lng}), keeping old")
                skip2 += 1
        else:
            print(f" -> NOT FOUND, keeping old")
            fail2 += 1
    
    conn.commit()
    print(f"\nStasiun: {up2} updated, {fail2} not found, {skip2} outside area")
    
    # ===== GERBANG TOL =====
    up3 = 0
    fail3 = 0
    skip3 = 0
    cur.execute("SELECT id, nama, ruasTol, lat, lng FROM GerbangTol ORDER BY id")
    tolls = cur.fetchall()
    total_t = len(tolls)
    print(f"\n=== Geocoding {total_t} GerbangTol ===")
    
    for i, (tid, nama, ruas, old_lat, old_lng) in enumerate(tolls):
        print(f"[{i+1}/{total_t}] {nama} ({ruas})", end='')
        sys.stdout.flush()
        
        result, method = geocode_toll(nama, ruas)
        time.sleep(1.1)
        
        if result:
            new_lat, new_lng = result
            if is_in_jabodetabek(new_lat, new_lng):
                dist_km = ((new_lat - old_lat)**2 + (new_lng - old_lng)**2)**0.5 * 111
                cur.execute("UPDATE GerbangTol SET lat=?, lng=?, sumber='OpenStreetMap Nominatim' WHERE id=?",
                           (new_lat, new_lng, tid))
                print(f" -> ({new_lat:.6f}, {new_lng:.6f}) [{method}] delta={dist_km:.1f}km")
                up3 += 1
            else:
                print(f" -> OUTSIDE ({new_lat}, {new_lng}), keeping old")
                skip3 += 1
        else:
            print(f" -> NOT FOUND, keeping old")
            fail3 += 1
    
    conn.commit()
    print(f"\nGerbangTol: {up3} updated, {fail3} not found, {skip3} outside area")
    
    # ===== SUMMARY =====
    total_updated = updated + up2 + up3
    total_failed = failed + fail2 + fail3
    total_items = total_f + total_s + total_t
    print(f"\n{'='*50}")
    print(f"TOTAL: {total_updated}/{total_items} updated, {total_failed} not found")
    print(f"{'='*50}")
    
    conn.close()


if __name__ == '__main__':
    main()
