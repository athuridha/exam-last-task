import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

print('=== FACILITIES WITH DUPLICATE COORDINATES ===')
c.execute('''
    SELECT lat, lng, GROUP_CONCAT(nama || ' (' || jenis || ')', ' | ') as names, COUNT(*) as cnt
    FROM Fasilitas
    GROUP BY ROUND(lat,5), ROUND(lng,5)
    HAVING cnt > 1
    ORDER BY cnt DESC
''')
for row in c.fetchall():
    print(f'  ({row[0]:.6f}, {row[1]:.6f}) x{row[3]}: {row[2]}')

print()
print('=== STATIONS: Bogor + Pondok Cina ===')
c.execute('SELECT id, nama, lat, lng FROM Stasiun WHERE nama IN ("Bogor","Pondok Cina")')
for row in c.fetchall():
    print(f'  id={row[0]} {row[1]}: ({row[2]:.6f}, {row[3]:.6f})')

print()
print('=== Universitas Muhammadiyah Jakarta ===')
c.execute('SELECT id, nama, lat, lng FROM Fasilitas WHERE nama LIKE "%Muhammadiyah%"')
for row in c.fetchall():
    print(f'  id={row[0]} {row[1]}: ({row[2]:.6f}, {row[3]:.6f})')

print()
print('=== TK Aisyiyah Tangerang ===')
c.execute('SELECT id, nama, lat, lng FROM Fasilitas WHERE nama LIKE "%Aisyiyah Tangerang%"')
for row in c.fetchall():
    print(f'  id={row[0]} {row[1]}: ({row[2]:.6f}, {row[3]:.6f})')

print()
print('=== SMA/SMP duplicate coords ===')
c.execute('''
    SELECT lat, lng, GROUP_CONCAT(nama, ' | ') as names, COUNT(*) as cnt
    FROM Fasilitas
    WHERE jenis IN ('SMA','SMP')
    GROUP BY ROUND(lat,4), ROUND(lng,4)
    HAVING cnt > 1
    ORDER BY cnt DESC
''')
for row in c.fetchall():
    print(f'  ({row[0]:.6f}, {row[1]:.6f}) x{row[3]}: {row[2]}')

print()
print('=== Precision check ===')
c.execute('SELECT COUNT(*) FROM Fasilitas WHERE LENGTH(CAST(lat AS TEXT)) > 8')
print(f'Fasilitas precise (>5 dec): {c.fetchone()[0]}/209')
c.execute('SELECT COUNT(*) FROM Stasiun WHERE LENGTH(CAST(lat AS TEXT)) > 8')
print(f'Stasiun precise (>5 dec): {c.fetchone()[0]}/95')
c.execute('SELECT COUNT(*) FROM GerbangTol WHERE LENGTH(CAST(lat AS TEXT)) > 8')
print(f'GerbangTol precise (>5 dec): {c.fetchone()[0]}/57')

print()
print('=== Sample of updated coords ===')
c.execute('SELECT nama, jenis, lat, lng, sumber FROM Fasilitas WHERE sumber = "OpenStreetMap Nominatim" LIMIT 5')
for row in c.fetchall():
    print(f'  {row[0]} ({row[1]}): ({row[2]:.6f}, {row[3]:.6f}) [{row[4]}]')

conn.close()
