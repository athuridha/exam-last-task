"""
Mapping Area (dari rumah123) → Kecamatan administratif
Skor Fasilitas, Akses Tol, Akses Kereta per Kecamatan

Referensi:
- Pembagian kecamatan: BPS / Permendagri
- Fasilitas: Jumlah mall, RS, sekolah, universitas, pasar di kecamatan
- Akses Tol: Jarak & jumlah exit tol di kecamatan
- Akses Kereta: Jumlah stasiun KRL/MRT/LRT dalam radius kecamatan
"""

# =====================================================================
# AREA → KECAMATAN MAPPING
# =====================================================================

AREA_TO_KECAMATAN = {
    # =================================================================
    # JAKARTA SELATAN (10 kecamatan)
    # =================================================================
    # Kec. Kebayoran Baru
    'Kebayoran Baru': 'Kebayoran Baru', 'Blok M': 'Kebayoran Baru',
    'Senopati': 'Kebayoran Baru', 'Panglima Polim': 'Kebayoran Baru',
    'Pakubuwono': 'Kebayoran Baru', 'Prapanca': 'Kebayoran Baru',
    'Wijaya': 'Kebayoran Baru',
    # Kec. Kebayoran Lama
    'Kebayoran Lama': 'Kebayoran Lama', 'Cipulir': 'Kebayoran Lama',
    'Bintaro': 'Kebayoran Lama', 'Pesanggrahan': 'Kebayoran Lama',
    'Ulujami': 'Kebayoran Lama', 'Tanah Kusir': 'Kebayoran Lama',
    'Sektor 1 - Bintaro': 'Kebayoran Lama', 'Sektor 2 - Bintaro': 'Kebayoran Lama',
    'Sektor 3 - Bintaro': 'Pesanggrahan', 'Sektor 3A-Bintaro': 'Pesanggrahan',
    'Sektor 4 - Bintaro': 'Pesanggrahan', 'Sektor 5-Bintaro': 'Pesanggrahan',
    'Graha Bintaro': 'Pesanggrahan', 'Petukangan': 'Pesanggrahan',
    # Kec. Cilandak
    'Cilandak': 'Cilandak', 'TB Simatupang': 'Cilandak',
    'Pondok Labu': 'Cilandak', 'Jeruk Purut': 'Cilandak',
    'Ragunan': 'Cilandak', 'Cipete': 'Cilandak', 'Fatmawati': 'Cilandak',
    'Gandaria': 'Cilandak',
    # Kec. Pasar Minggu
    'Pasar Minggu': 'Pasar Minggu', 'Pejaten': 'Pasar Minggu',
    'Pejaten Timur': 'Pasar Minggu', 'Tanjung Barat': 'Pasar Minggu',
    'Ragunan': 'Pasar Minggu', 'Jati Padang': 'Pasar Minggu',
    'Kebagusan': 'Pasar Minggu', 'Rawajati': 'Pasar Minggu',
    # Kec. Jagakarsa
    'Jagakarsa': 'Jagakarsa', 'Ciganjur': 'Jagakarsa',
    'Lenteng Agung': 'Jagakarsa', 'Cipedak': 'Jagakarsa',
    'Tanjung Barat': 'Jagakarsa',
    # Kec. Mampang Prapatan
    'Mampang': 'Mampang Prapatan', 'Mampang Prapatan': 'Mampang Prapatan',
    'Bangka': 'Mampang Prapatan', 'Kuningan': 'Mampang Prapatan',
    'Mega Kuningan': 'Mampang Prapatan', 'patra kuningan': 'Mampang Prapatan',
    # Kec. Pancoran
    'Pancoran': 'Pancoran', 'Kalibata': 'Pancoran',
    'Duren Tiga': 'Pancoran', 'Rawajati': 'Pancoran',
    'Cikoko': 'Pancoran', 'Pengadegan': 'Pancoran',
    # Kec. Tebet
    'Tebet': 'Tebet', 'Bukit Duri': 'Tebet',
    'Menteng Dalam': 'Tebet', 'Manggarai': 'Tebet',
    'Casablanca': 'Tebet', 'Saharjo': 'Tebet',
    'MT Haryono': 'Tebet', 'Supomo': 'Tebet',
    # Kec. Setiabudi
    'Setiabudi': 'Setiabudi', 'Sudirman': 'Setiabudi',
    'SCBD': 'Setiabudi', 'Karet': 'Setiabudi',
    'Gudang Peluru': 'Setiabudi', 'Guntur': 'Setiabudi',
    # Kec. Pondok Indah (Kebayoran Lama subarea)
    'Pondok Indah': 'Kebayoran Lama', 'Pondok Pinang': 'Kebayoran Lama',
    'Simprug': 'Kebayoran Lama', 'Simprug Garden': 'Kebayoran Lama',
    'Permata Hijau': 'Kebayoran Lama',
    'Radio Dalam': 'Kebayoran Baru', 'Sinabung': 'Kebayoran Baru',
    'Veteran': 'Kebayoran Baru',
    # Kec. Lebak Bulus → Cilandak
    'Lebak Bulus': 'Cilandak',
    # Misc Jakarta Selatan
    'Ampera': 'Cilandak', 'Antasari': 'Cilandak',
    'Cirendeu': 'Cilandak', 'Warung Buncit': 'Mampang Prapatan',
    'Terogong': 'Cilandak', 'Praja Dalam': 'Pasar Minggu',
    'Gatot Subroto': 'Setiabudi', 'Patal Senayan': 'Setiabudi',
    'Senayan': 'Kebayoran Baru', 'Kemandoran': 'Kebayoran Lama',
    'Kemang': 'Mampang Prapatan', 'Rempoa Ciputat Timur': 'Cilandak',
    'Cinere': 'Jagakarsa',  # border area

    # =================================================================
    # JAKARTA PUSAT (8 kecamatan)
    # =================================================================
    # Kec. Menteng
    'Menteng': 'Menteng', 'Cikini': 'Menteng',
    'Gondangdia': 'Menteng', 'Pegangsaan': 'Menteng',
    'Kebon Sirih': 'Menteng', 'Menteng Atas': 'Menteng',
    # Kec. Tanah Abang
    'Tanah Abang': 'Tanah Abang', 'Thamrin': 'Tanah Abang',
    'Bendungan Hilir': 'Tanah Abang', 'Kebon Kacang': 'Tanah Abang',
    'Kebon Melati': 'Tanah Abang', 'Pejompongan': 'Tanah Abang',
    'KH Mas Mansyur': 'Tanah Abang', 'Hasyim Ashari': 'Tanah Abang',
    # Kec. Gambir
    'Gambir': 'Gambir', 'Cideng': 'Gambir',
    'Petojo': 'Gambir', 'Batutulis': 'Gambir',
    # Kec. Sawah Besar
    'Sawah Besar': 'Sawah Besar', 'Karang Anyar': 'Sawah Besar',
    'Pasar Baru': 'Sawah Besar', 'Gunung Sahari': 'Sawah Besar',
    'Mangga Dua': 'Sawah Besar', 'Kartini': 'Sawah Besar',
    'Glodok': 'Sawah Besar', 'Pangeran Jayakarta': 'Sawah Besar',
    'Gajah Mada': 'Sawah Besar',
    # Kec. Senen
    'Senen': 'Senen', 'Kramat': 'Senen',
    'Salemba': 'Senen', 'Bungur': 'Senen', 'Roxy': 'Senen',
    # Kec. Cempaka Putih
    'Cempaka Putih': 'Cempaka Putih', 'Cempaka Mas': 'Cempaka Putih',
    'Sumur Batu': 'Cempaka Putih', 'Percetakan Negara': 'Cempaka Putih',
    # Kec. Johar Baru
    'Johar Baru': 'Johar Baru',
    # Kec. Kemayoran
    'Kemayoran': 'Kemayoran', 'Senayan': 'Tanah Abang',

    # =================================================================
    # JAKARTA BARAT (8 kecamatan)
    # =================================================================
    # Kec. Kebon Jeruk
    'Kebon Jeruk': 'Kebon Jeruk', 'Kedoya': 'Kebon Jeruk',
    'Kedoya Baru': 'Kebon Jeruk', 'Kedoya Selatan': 'Kebon Jeruk',
    'Kedoya Utara': 'Kebon Jeruk', 'Prima Kedoya': 'Kebon Jeruk',
    'Duri Kepa': 'Kebon Jeruk', 'Kepa Duri': 'Kebon Jeruk',
    'Srengseng': 'Kebon Jeruk', 'Puri Indah': 'Kebon Jeruk',
    'Puri Mansion': 'Kebon Jeruk', 'Puri Media': 'Kebon Jeruk',
    'Green Ville': 'Kebon Jeruk', 'Green garden': 'Kebon Jeruk',
    'Permata Buana': 'Kebon Jeruk', 'Intercon': 'Kebon Jeruk',
    'Jalan Panjang': 'Kebon Jeruk', 'Sunrise Garden': 'Kebon Jeruk',
    'Alfa Indah': 'Kebon Jeruk',
    # Kec. Palmerah
    'Palmerah': 'Palmerah', 'Slipi': 'Palmerah',
    'S Parman': 'Palmerah', 'Pos Pengumben': 'Palmerah',
    'Kota Bambu Utara': 'Palmerah', 'Kemanggisan': 'Palmerah',
    # Kec. Grogol Petamburan
    'Grogol': 'Grogol Petamburan', 'Grogol Petamburan': 'Grogol Petamburan',
    'Tomang': 'Grogol Petamburan', 'Tanjung Duren': 'Grogol Petamburan',
    'Tanjung Duren Selatan': 'Grogol Petamburan', 'Tanjung Duren Utara': 'Grogol Petamburan',
    'Jelambar': 'Grogol Petamburan', 'Central Park': 'Grogol Petamburan',
    'Rawa Belong': 'Grogol Petamburan',
    # Kec. Tambora
    'Tambora': 'Tambora', 'Angke': 'Tambora',
    'Jembatan Besi': 'Tambora', 'Jembatan Dua': 'Tambora',
    'Jembatan Lima': 'Tambora', 'Jembatan Tiga': 'Tambora',
    'Kota': 'Tambora', 'Mangga Besar': 'Tambora', 'Tubagus Angke': 'Tambora',
    # Kec. Tamansari
    'Tamansari': 'Tamansari', 'Karang Mulia': 'Tamansari',
    'Taman Kencana': 'Tamansari',
    # Kec. Cengkareng
    'Cengkareng': 'Cengkareng', 'Cengkareng Barat': 'Cengkareng',
    'Daan Mogot': 'Cengkareng', 'Rawa Buaya': 'Cengkareng',
    'Duri Kosambi': 'Cengkareng', 'Kapuk Kamal': 'Cengkareng',
    'Green Lake City': 'Cengkareng', 'Duta Garden': 'Cengkareng',
    'Bojong Indah': 'Cengkareng',
    # Kec. Kalideres
    'Kalideres': 'Kalideres', 'Taman Palem': 'Kalideres',
    'Taman Surya': 'Kalideres', 'Pegadungan': 'Kalideres',
    'Semanan': 'Kalideres', 'Taman Cosmos': 'Kalideres',
    # Kec. Kembangan
    'Kembangan': 'Kembangan', 'Kembangan Baru': 'Kembangan',
    'Kembangan Selatan': 'Kembangan', 'Joglo': 'Kembangan',
    'Meruya': 'Kembangan', 'Taman Meruya': 'Kembangan',
    'Villa Meruya': 'Kembangan', 'Taman Ratu': 'Kembangan',
    'Taman Kota': 'Kembangan', 'Metro permata': 'Kembangan',
    'Metland Puri': 'Kembangan',
    # Misc Jakarta Barat
    'Citra Garden': 'Kalideres', 'Kelapa Dua': 'Kebon Jeruk',
    'Gelong': 'Palmerah', 'Green Mansion': 'Kembangan',
    'Kav DKI': 'Kembangan', 'Taman Royal': 'Cengkareng',

    # =================================================================
    # JAKARTA UTARA (6 kecamatan)
    # =================================================================
    # Kec. Penjaringan
    'Penjaringan': 'Penjaringan', 'Pluit': 'Penjaringan',
    'Muara Karang': 'Penjaringan', 'Pantai Indah Kapuk': 'Penjaringan',
    'Pantai Indah Kapuk 2': 'Penjaringan', 'Pantai Mutiara': 'Penjaringan',
    'Kamal': 'Penjaringan', 'Kapuk': 'Penjaringan', 'Kapuk Muara': 'Penjaringan',
    'Teluk Gong': 'Penjaringan', 'Golf Island': 'Penjaringan',
    'Taman Grisenda': 'Penjaringan', 'Bandengan': 'Penjaringan',
    # Kec. Pademangan
    'Pademangan': 'Pademangan', 'Ancol': 'Pademangan',
    # Kec. Tanjung Priok
    'Tanjung Priok': 'Tanjung Priok', 'Sunter': 'Tanjung Priok',
    'Rawa Badak': 'Tanjung Priok', 'Semper': 'Tanjung Priok',
    'Plumpang': 'Tanjung Priok',
    # Kec. Koja
    'Koja': 'Koja',
    # Kec. Kelapa Gading
    'Kelapa Gading': 'Kelapa Gading', 'Pegangsaan': 'Kelapa Gading',
    # Kec. Cilincing
    'Cilincing': 'Cilincing', 'Marunda': 'Cilincing',
    'Rorotan': 'Cilincing',

    # =================================================================
    # JAKARTA TIMUR (10 kecamatan)
    # =================================================================
    # Kec. Matraman
    'Matraman': 'Matraman', 'Kayu Jati': 'Matraman',
    'Pisangan Lama': 'Matraman',
    # Kec. Pulo Gadung
    'Pulo Gadung': 'Pulo Gadung', 'Rawamangun': 'Pulo Gadung',
    'Kayu Putih': 'Pulo Gadung', 'Pulomas': 'Pulo Gadung',
    'Pulo Asem': 'Pulo Gadung',
    # Kec. Jatinegara
    'Jatinegara': 'Jatinegara', 'Otista': 'Jatinegara',
    'Cipinang': 'Jatinegara', 'Cipinang Melayu': 'Jatinegara',
    'Kalimalang': 'Jatinegara',
    # Kec. Duren Sawit
    'Duren Sawit': 'Duren Sawit', 'Klender': 'Duren Sawit',
    'Pondok Bambu': 'Duren Sawit', 'Pondok Kelapa': 'Duren Sawit',
    'Pondok Kopi': 'Duren Sawit', 'Buaran': 'Duren Sawit',
    # Kec. Kramat Jati
    'Kramat Jati': 'Kramat Jati', 'Cawang': 'Kramat Jati',
    'Cililitan': 'Kramat Jati', 'Condet': 'Kramat Jati',
    'Pinang Ranti': 'Kramat Jati', 'Halim Perdana Kusuma': 'Kramat Jati',
    # Kec. Makasar
    'Makasar': 'Makasar', 'Taman Mini': 'Makasar',
    'Kampung Ambon': 'Makasar', 'Utan Kayu': 'Makasar',
    # Kec. Pasar Rebo
    'Pasar Rebo': 'Pasar Rebo', 'Kalisari': 'Pasar Rebo',
    'Cijantung': 'Pasar Rebo',
    # Kec. Ciracas
    'Ciracas': 'Ciracas', 'Citra Grand': 'Ciracas',
    'Kampung Rambutan': 'Ciracas', 'Setu': 'Ciracas',
    'Metland Menteng': 'Ciracas',
    # Kec. Cipayung
    'Cipayung': 'Cipayung', 'Cibubur': 'Cipayung',
    'Lubang Buaya': 'Cipayung', 'Bambu Apus': 'Cipayung',
    'Cilangkap': 'Cipayung', 'Pondok Ranggon': 'Cipayung',
    # Kec. Cakung
    'Cakung': 'Cakung', 'Penggilingan': 'Cakung',
    'Pulogebang': 'Cakung', 'Jakarta Garden City': 'Cakung',
    # Misc Jakarta Timur
    'Jatiwaringin': 'Duren Sawit', 'Pondok Gede': 'Duren Sawit',
    'Raffles Hills': 'Ciracas', 'Rawajati': 'Kramat Jati',
    'Kota Wisata': 'Cipayung', 'Legenda Wisata': 'Cipayung',

    # =================================================================
    # TANGERANG KOTA & KABUPATEN
    # =================================================================
    # Kec. Tangerang
    'Tangerang': 'Tangerang', 'Tangerang Kota': 'Tangerang',
    'Cikokol': 'Tangerang', 'Sukasari': 'Tangerang',
    'Sangiang Jaya': 'Tangerang', 'Summarecon Tangerang': 'Tangerang',
    # Kec. Karawaci
    'Karawaci': 'Karawaci', 'Lippo Karawaci': 'Karawaci',
    'Cimone': 'Karawaci', 'Kotabumi': 'Karawaci',
    # Kec. Cibodas
    'Cibodas': 'Cibodas', 'Cihuni': 'Cibodas',
    'Ciater': 'Cibodas',
    # Kec. Jatiuwung
    'Jati Uwung': 'Jatiuwung', 'Jatake': 'Jatiuwung',
    # Kec. Periuk
    'Periuk': 'Periuk', 'Tajur': 'Periuk',
    # Kec. Batuceper
    'Batu Ceper': 'Batuceper',
    # Kec. Neglasari
    'Neglasari': 'Neglasari',
    # Kec. Cipondoh
    'Cipondoh': 'Cipondoh', 'Modernland': 'Cipondoh',
    'Poris': 'Cipondoh',
    # Kec. Pinang
    'Pinang': 'Pinang', 'Kunciran': 'Pinang',
    'Sudimara': 'Pinang',
    # Kec. Ciledug
    'Ciledug': 'Ciledug', 'Kreo': 'Ciledug',
    # Kec. Larangan
    'Larangan': 'Larangan', 'Cipadu': 'Larangan',
    # Kec. Karang Tengah
    'Karang Tengah': 'Karang Tengah', 'Kedaung': 'Karang Tengah',
    # Kec. Benda (Bandara)
    'Benda': 'Benda', 'Dadap': 'Benda', 'Jurumudi': 'Benda',

    # --- Kab. Tangerang ---
    # Kec. Kelapa Dua / Gading Serpong
    'Gading Serpong': 'Kelapa Dua', 'Gading Serpong Andalucia': 'Kelapa Dua',
    'Gading Serpong Cluster Bohemia': 'Kelapa Dua', 'Gading Serpong Cluster Lavender': 'Kelapa Dua',
    'Gading Serpong Cluster Michelia': 'Kelapa Dua', 'Gading Serpong Cluster Oleaster': 'Kelapa Dua',
    'Gading Serpong Elista Village': 'Kelapa Dua', 'Gading Serpong IL Lago': 'Kelapa Dua',
    'Gading Serpong Karelia Village': 'Kelapa Dua', 'Gading Serpong La Bella Village': 'Kelapa Dua',
    'Gading Serpong Montana Village': 'Kelapa Dua', 'Gading Serpong Omaha Village': 'Kelapa Dua',
    'Gading Serpong Pondok Hijau Golf': 'Kelapa Dua', 'Gading Serpong Samara Village': 'Kelapa Dua',
    'Gading Serpong Scientia Garden': 'Kelapa Dua', 'Gading Serpong Serenade Lake': 'Kelapa Dua',
    'Gading Serpong The Spring': 'Kelapa Dua', 'Gading Serpong Virginia Village': 'Kelapa Dua',
    'Sektor 1A-Gading Serpong': 'Kelapa Dua', 'Sektor 1B-Gading Serpong': 'Kelapa Dua',
    'Sektor 1C-Gading Serpong': 'Kelapa Dua', 'Sektor 1D-Gading Serpong': 'Kelapa Dua',
    'Sektor 1E-Gading Serpong': 'Kelapa Dua', 'Sektor 1G-Gading Serpong': 'Kelapa Dua',
    'Sektor 6-Gading Serpong': 'Kelapa Dua', 'Sektor 7A/B-Gading Serpong': 'Kelapa Dua',
    'Sektor 7C-Gading Serpong': 'Kelapa Dua', 'Sektor 8-Gading Serpong': 'Kelapa Dua',
    'Pondok Jagung': 'Kelapa Dua', 'Kampung Utan': 'Kelapa Dua',
    'Jelupang': 'Kelapa Dua', 'Bakti Jaya': 'Kelapa Dua',
    'Summarecon Serpong': 'Kelapa Dua',
    # Kec. Pagedangan / BSD
    'Pagedangan': 'Pagedangan',
    'BSD': 'Pagedangan', 'BSD Alegria': 'Pagedangan', 'BSD Anggrek Loka': 'Pagedangan',
    'BSD Avani': 'Pagedangan', 'BSD Bukit Golf': 'Pagedangan', 'BSD City': 'Pagedangan',
    'BSD De Park': 'Pagedangan', 'BSD Delatinos': 'Pagedangan', 'BSD Duta Bintaro': 'Pagedangan',
    'BSD Eminent': 'Pagedangan', 'BSD Foresta': 'Pagedangan', 'BSD Giri Loka': 'Pagedangan',
    'BSD Graha Raya': 'Pagedangan', 'BSD Green Cove': 'Pagedangan', 'BSD Green Wich': 'Pagedangan',
    'BSD Griya Loka': 'Pagedangan', 'BSD Ingenia': 'Pagedangan', 'BSD Kencana Loka': 'Pagedangan',
    'BSD Natura': 'Pagedangan', 'BSD Neo Catalonia': 'Pagedangan', 'BSD Nusaloka': 'Pagedangan',
    'BSD Pavillion Residence': 'Pagedangan', 'BSD Provance Parkland': 'Pagedangan',
    'BSD Puspita Loka': 'Pagedangan', 'BSD Residence One': 'Pagedangan',
    'BSD Sevilla': 'Pagedangan', 'BSD Taman Crysant': 'Pagedangan',
    'BSD Taman Giri Loka': 'Pagedangan', 'BSD Taman Provence': 'Pagedangan',
    'BSD Telaga Golf': 'Pagedangan', 'BSD The Green': 'Pagedangan',
    'BSD The Icon': 'Pagedangan', 'BSD The Savia': 'Pagedangan',
    'BSD Vanya Park': 'Pagedangan', 'BSD Vermont': 'Pagedangan',
    'BSD Victoria Park Lane': 'Pagedangan', 'BSD Virginia Lagoon': 'Pagedangan',
    # Kec. Cisauk
    'Cisauk': 'Cisauk', 'Suradita': 'Cisauk',
    # Kec. Cikupa
    'Cikupa': 'Cikupa', 'Cikupa Citra Raya': 'Cikupa',
    'Jombang': 'Cikupa', 'Sukabakti': 'Cikupa',
    # Kec. Tigaraksa
    'Tigaraksa': 'Tigaraksa', 'Cireundeu': 'Tigaraksa',
    # Kec. Legok
    'Legok': 'Legok', 'Babakan': 'Legok',
    'Bojong Nangka': 'Legok',
    # Kec. Solear (Curug)
    'Solear': 'Solear', 'Curug': 'Curug',
    'Cukang Galih': 'Curug', 'Kadu': 'Curug',
    # Kec. Sepatan
    'Sepatan': 'Sepatan', 'Sepatan Timur': 'Sepatan',
    # Kec. Pasar Kemis
    'Pasar Kemis': 'Pasar Kemis', 'Rajeg': 'Rajeg',
    # Kec. Balaraja
    'Balaraja': 'Balaraja', 'Kresek': 'Kresek',
    # Kec. Sindang Jaya
    'Sindang Jaya': 'Sindang Jaya',
    # Kec. Teluk Naga
    'Teluk Naga': 'Teluk Naga', 'Mauk': 'Mauk',
    'Kronjo': 'Kronjo', 'Pakuhaji': 'Pakuhaji',
    # Kec. Kosambi
    'Kosambi': 'Kosambi',
    # Misc Tangerang
    'Alam Sutera': 'Pinang', 'Alam Sutera 2': 'Pinang',
    'Sutera Buana Alam Sutera': 'Pinang', 'Sutera Jingga Alam Sutera': 'Pinang',
    'Sutera Onix Alam Sutera': 'Pinang', 'Sutera Sitara Alam Sutera': 'Pinang',
    'Suvarna Sutera': 'Cisauk',
    'Banjar Wijaya': 'Cipondoh',
    'Graha Raya': 'Pondok Aren', 'Jurangmangu': 'Pondok Aren',
    'Pondok Betung': 'Pondok Aren', 'Pondok Karya': 'Pondok Aren',
    'Pondok Benda': 'Pamulang', 'Pondok Cabe': 'Pamulang',
    'Pondok Pucung': 'Pondok Aren', 'Pondok Ranji': 'Ciputat Timur',
    'Rempoa': 'Ciputat Timur', 'Serua': 'Ciputat',
    'Citra Maja Raya': 'Cisoka',
    'Royal Serpong Village': 'Cisauk',
    'Parigi': 'Pagedangan', 'Rawakalong': 'Pagedangan',
    'Metro Permata': 'Cipondoh', 'Permata Medang': 'Pagedangan',
    'Lengkong Kulon': 'Pagedangan', 'Kemiri': 'Kelapa Dua',
    'Petir': 'Cipondoh', 'Pesanggrahan': 'Pinang',
    'Tanah Tinggi': 'Tangerang', 'Raya Serang': 'Cikupa',
    'Daan Mogot': 'Cengkareng', 'Taman Royal': 'Cipondoh',

    # =================================================================
    # TANGERANG SELATAN (7 kecamatan)
    # =================================================================
    'Serpong': 'Serpong', 'Serpong Utara': 'Serpong Utara',
    'Serpong Villa Melati Mas': 'Serpong Utara', 'Villa Melati Mas': 'Serpong Utara',
    'Serpong Regency Melati Mas': 'Serpong Utara',
    'Ciputat': 'Ciputat', 'Ciputat Timur': 'Ciputat Timur',
    'Pamulang': 'Pamulang',
    'Pondok Aren': 'Pondok Aren', 'Graha Raya Bintaro': 'Pondok Aren',
    'Setu': 'Setu',
    # Bintaro sektor di tangsel
    'Sektor 3 - Bintaro': 'Pondok Aren', 'Sektor 3A - Bintaro': 'Pondok Aren',
    'Sektor 5 - Bintaro': 'Ciputat Timur', 'Sektor 6 - Bintaro': 'Ciputat Timur',
    'Sektor 7-Bintaro': 'Pondok Aren', 'Sektor 8 - Bintaro': 'Pondok Aren',
    'Sektor 9-Bintaro': 'Pondok Aren',

    # =================================================================
    # BEKASI (Kota 12 kec + Kab)
    # =================================================================
    # Kec. Bekasi Timur
    'Bekasi Timur': 'Bekasi Timur', 'Duren Jaya': 'Bekasi Timur',
    'Margahayu': 'Bekasi Timur', 'Bekasi Kota': 'Bekasi Timur',
    # Kec. Bekasi Barat
    'Bekasi Barat': 'Bekasi Barat', 'Bintara': 'Bekasi Barat',
    'Kaliabang': 'Bekasi Barat', 'Kranji': 'Bekasi Barat',
    'Kalimalang': 'Bekasi Barat', 'Kayuringin Jaya': 'Bekasi Barat',
    # Kec. Bekasi Utara
    'Bekasi Utara': 'Bekasi Utara', 'Harapan Indah': 'Bekasi Utara',
    'Harapan Baru': 'Bekasi Utara', 'Harapan Jaya': 'Bekasi Utara',
    'Harapan Mulya': 'Bekasi Utara', 'Perwira': 'Bekasi Utara',
    'Telukpucung': 'Bekasi Utara', 'Summarecon Bekasi': 'Bekasi Utara',
    'Summarecon Crown Gading': 'Bekasi Utara',
    # Kec. Bekasi Selatan
    'Bekasi Selatan': 'Bekasi Selatan', 'Pekayon': 'Bekasi Selatan',
    'Jaka Mulya': 'Bekasi Selatan', 'Jaka Setia': 'Bekasi Selatan',
    'Jaka Permai': 'Bekasi Selatan', 'Jaka Sampurna': 'Bekasi Selatan',
    'Marga Jaya': 'Bekasi Selatan', 'Cikunir': 'Bekasi Selatan',
    'Pejuang': 'Bekasi Selatan', 'Kemang Pratama': 'Bekasi Selatan',
    # Kec. Pondok Gede
    'Pondok Gede': 'Pondok Gede', 'Jatibening': 'Pondok Gede',
    'Jatimakmur': 'Pondok Gede', 'Jatiwaringin': 'Pondok Gede',
    # Kec. Jatisampurna
    'Jatisampurna': 'Jatisampurna', 'Jatiraden': 'Jatisampurna',
    'Jatiranggon': 'Jatisampurna', 'Jatikarya': 'Jatisampurna',
    # Kec. Jatiasih / Jati Asih
    'Jati Asih': 'Jatiasih', 'Jatikramat': 'Jatiasih',
    'Jatimelati': 'Jatiasih', 'Jatimekar': 'Jatiasih',
    'Jati Luhur': 'Jatiasih', 'Jati Sari': 'Jatiasih',
    'Jati Cempaka': 'Jatiasih', 'Jatimulya': 'Jatiasih',
    # Kec. Rawalumbu
    'Rawalumbu': 'Rawalumbu', 'Jati Mekar': 'Rawalumbu',
    'Jati Rasa': 'Rawalumbu', 'Jatimurni': 'Rawalumbu',
    'Jatiwarna': 'Rawalumbu',
    # Kec. Mustikajaya
    'Mustikajaya': 'Mustikajaya', 'Mustikasari': 'Mustikajaya',
    'Jati Rahayu': 'Mustikajaya',
    # Kec. Bantar Gebang
    'Bantar Gebang': 'Bantar Gebang', 'Padurenan': 'Bantar Gebang',
    'Pedurenan': 'Bantar Gebang',
    # Kec. Pondokmelati
    'Pondokmelati': 'Pondokmelati', 'Jatimulya': 'Pondokmelati',
    'Jatirahayu': 'Pondokmelati',
    # Kec. Medan Satria
    'Medan Satria': 'Medan Satria', 'Satriajaya': 'Medan Satria',
    'Cimuning': 'Medan Satria', 'Pejuang': 'Medan Satria',
    'Komsen': 'Medan Satria',
    # --- Kab. Bekasi ---
    'Tambun Selatan': 'Tambun Selatan', 'Tambun Utara': 'Tambun Utara',
    'Tarumajaya': 'Tarumajaya', 'Babelan': 'Babelan',
    'Cikarang': 'Cikarang Selatan', 'Cikarang Barat': 'Cikarang Barat',
    'Cikarang Pusat': 'Cikarang Pusat', 'Cikarang Selatan': 'Cikarang Selatan',
    'Cikarang Utara': 'Cikarang Utara', 'Lippo Cikarang': 'Cikarang Selatan',
    'Jababeka': 'Cikarang Utara', 'Delta Mas': 'Cikarang Pusat',
    'Cibitung': 'Cibitung', 'Cibarusa': 'Cibarusah',
    'Karangbahagia': 'Karangbahagia', 'Karang Satria': 'Tambun Utara',
    'Sukawangi': 'Sukawangi', 'Serang Cibarusah': 'Cibarusah',
    'Setu': 'Setu',
    # Misc Bekasi
    'Bekasi': 'Bekasi Timur', 'Caman': 'Bekasi Selatan',
    'Galaxy': 'Bekasi Selatan', 'Taman Galaxy': 'Bekasi Selatan',
    'Golden City': 'Bekasi Timur', 'Grand Wisata': 'Tambun Selatan',
    'Mutiara Baru': 'Bekasi Utara', 'Nusa Loka': 'Jatisampurna',
    'Prima Harapan': 'Bekasi Utara', 'Rawa Panjang': 'Bekasi Selatan',
    'Duta Harapan': 'Bekasi Utara', 'Cibubur': 'Jatisampurna',
    'Narogong': 'Bantar Gebang', 'Kebalen': 'Babelan',
    'Kartini': 'Bekasi Timur', 'Pondok Ungu': 'Bekasi Utara',
    'Setiamekar': 'Tambun Selatan',

    # =================================================================
    # DEPOK (11 kecamatan)
    # =================================================================
    'Beji': 'Beji', 'Kukusan': 'Beji', 'Kelapa Dua': 'Beji',
    'Pancoran Mas': 'Pancoran Mas', 'Margonda': 'Pancoran Mas',
    'Depok I': 'Pancoran Mas', 'Depok II': 'Pancoran Mas',
    'Rangkapanjaya': 'Pancoran Mas',
    'Cipayung': 'Cipayung', 'Mekarsari': 'Cipayung',
    'Sukmajaya': 'Sukmajaya', 'Tirtajaya': 'Sukmajaya',
    'Cilodong': 'Cilodong', 'Cisalak': 'Sukmajaya',
    'Limo': 'Limo', 'Gandul': 'Limo',
    'Cinere': 'Cinere', 'Pangkalan Jati': 'Cinere',
    'Tapos': 'Tapos', 'Sukatani': 'Tapos',
    'Cimanggis': 'Cimanggis', 'Harjamukti': 'Cimanggis',
    'Sawangan': 'Sawangan', 'Cinangka': 'Sawangan',
    'Pasir Putih': 'Sawangan',
    'Bojong Sari': 'Bojongsari', 'Krukut': 'Limo',
    'Grand Depok City': 'Cimanggis',
    'Citayam': 'Cipayung', 'Tanah Baru': 'Beji',
    'Cilangkap': 'Tapos', 'Cibubur': 'Cimanggis', 'Ciangsana': 'Cimanggis',

    # =================================================================
    # BOGOR (Kota 6 kec + Kab)
    # =================================================================
    # Kota Bogor
    'Bogor Utara': 'Bogor Utara', 'Tanah Sareal': 'Tanah Sareal',
    'Bogor Barat': 'Bogor Barat', 'Bogor Tengah': 'Bogor Tengah',
    'Bogor Selatan': 'Bogor Selatan', 'Bogor Timur': 'Bogor Timur',
    'Bantar Jati': 'Bogor Utara', 'Taman Yasmin': 'Bogor Barat',
    'Cibuluh': 'Bogor Utara', 'Pajajaran': 'Bogor Tengah',
    'Ciparigi': 'Bogor Utara', 'Taman Kencana': 'Bogor Tengah',
    'Sempur': 'Bogor Tengah', 'Paledang': 'Bogor Tengah',
    'Batutulis': 'Bogor Selatan', 'Bondongan': 'Bogor Selatan',
    'Bubulak': 'Bogor Barat', 'Cimahpar': 'Bogor Utara',
    'Cilendek': 'Bogor Barat', 'Cilendek Barat': 'Bogor Barat',
    'Cilendek Timur': 'Bogor Barat', 'Sindang Barang': 'Bogor Barat',
    'Dramaga': 'Dramaga', 'Laladon': 'Dramaga',
    'Semplak': 'Bogor Barat', 'Mulyaharja': 'Bogor Selatan',
    'Cimanggu': 'Tanah Sareal', 'Kedung Halang': 'Bogor Utara',
    'Katulampa': 'Bogor Timur', 'Baranangsiang': 'Bogor Timur',
    'Curug Mekar': 'Tanah Sareal', 'Pabaton': 'Bogor Tengah',
    'Ciwaringin': 'Bogor Tengah', 'Tegallega': 'Bogor Tengah',
    'Tegal Gundi': 'Bogor Tengah', 'Tegal Gundil': 'Bogor Utara',
    'Babakan Pasar': 'Bogor Tengah', 'Pakuan': 'Bogor Tengah',
    'Duta Pakuan': 'Bogor Utara', 'Indraprasta': 'Bogor Timur',
    'Margajaya': 'Bogor Barat', 'Pasirmulya': 'Bogor Barat',
    'Pamoyanan': 'Bogor Selatan', 'Rancamaya': 'Bogor Selatan',
    'Pasir Jaya': 'Bogor Barat', 'Sukamaju': 'Bogor Selatan',
    'Tamansari': 'Tamansari',
    # Kab. Bogor
    'Cibinong': 'Cibinong', 'Limusnunggal': 'Cibinong',
    'Sentul City': 'Babakan Madang', 'Sentul': 'Babakan Madang',
    'Babakan Madang': 'Babakan Madang', 'Bukit Sentul': 'Babakan Madang',
    'Cijayanti': 'Babakan Madang',
    'Cileungsi': 'Cileungsi', 'Leuwinanggung': 'Cileungsi',
    'Wanaherang': 'Cileungsi', 'Ciangsana': 'Gunung Putri',
    'Gunung Putri': 'Gunung Putri', 'Kranggan': 'Gunung Putri',
    'Tajur Halang': 'Tajur Halang', 'Tajur': 'Tajur Halang',
    'Bojong Gede': 'Bojong Gede', 'Bojong': 'Bojong Gede',
    'Cilebut': 'Sukaraja', 'Sukaraja': 'Sukaraja',
    'Citeureup': 'Citeureup', 'Karang Tengah': 'Citeureup',
    'Bojongsari': 'Bojong Gede', 'Kedungwaringin': 'Bojong Gede',
    'Parung': 'Parung', 'Gunung Sindur': 'Gunung Sindur',
    'Parung Panjang': 'Parung Panjang', 'Rumpin': 'Rumpin',
    'Ranca Bungur': 'Ranca Bungur', 'Ciseeng': 'Ciseeng',
    'Jonggol': 'Jonggol', 'Sukamakmur': 'Sukamakmur',
    'Ciomas': 'Ciomas', 'Ciampea': 'Ciampea',
    'Cijeruk': 'Cijeruk', 'Ciapus': 'Cijeruk',
    'Cisarua': 'Cisarua', 'Megamendung': 'Megamendung',
    'Ciawi': 'Ciawi', 'Gadog': 'Ciawi',
    'Jasinga': 'Jasinga', 'Tenjo': 'Tenjo',
    'Caringin': 'Caringin', 'Cipanas': 'Caringin',
    'Cibungbulang': 'Cibungbulang', 'Puncak': 'Cisarua',
    'Loji': 'Cisarua',
    'Tapos': 'Tapos', 'Ciluar': 'Sukaraja',
    # Misc Bogor
    'Bogor': 'Bogor Tengah', 'Bogor Nirwana Residence': 'Bogor Selatan',
    'Cikaret': 'Cibinong', 'Cikeas': 'Gunung Putri',
    'Kota Wisata': 'Gunung Putri', 'Legenda Wisata': 'Gunung Putri',
    'Summarecon Bogor': 'Bogor Utara', 'Harjamukti': 'Sukaraja',
    'Bojong Kulur': 'Cileungsi',
}


# =====================================================================
# SKOR FASILITAS PER KECAMATAN (1-5)
# Mall, Rumah Sakit, Sekolah/Universitas, Pasar, Tempat Ibadah
# =====================================================================

FASILITAS_PER_KECAMATAN = {
    # --- JAKARTA SELATAN ---
    'Kebayoran Baru':     4.8,  # Blok M, Plaza Senayan, RS Pertamina, banyak sekolah elit
    'Kebayoran Lama':     4.2,  # Pondok Indah Mall, RS Pondok Indah
    'Pesanggrahan':       3.5,  # Bintaro area, Giant
    'Cilandak':           4.5,  # Citos, Fatmawati, RS Siloam
    'Pasar Minggu':       3.8,  # Pejaten Village, RSUD Pasar Minggu
    'Jagakarsa':          3.2,  # Terbatas, lebih residensial
    'Mampang Prapatan':   4.6,  # Kuningan City, Mega Kuningan, banyak RS
    'Pancoran':           3.8,  # Kalibata City, Pancoran area
    'Tebet':              4.0,  # Kota Kasablanka, RS UKI
    'Setiabudi':          5.0,  # Pacific Place, Grand Indonesia, SCBD, RS MMC

    # --- JAKARTA PUSAT ---
    'Menteng':            5.0,  # RS Menteng, Sarinah, sekolah elit
    'Tanah Abang':        5.0,  # Grand Indonesia, Tanah Abang Market, Plaza Indonesia
    'Gambir':             4.8,  # Monas, Museum, RS
    'Sawah Besar':        4.2,  # Mangga Dua Mall, Pasar Baru
    'Senen':              4.5,  # Atrium, Senen Jaya, RS RSCM
    'Cempaka Putih':      3.8,  # RS Islam Jakarta, pasar
    'Johar Baru':         3.0,  # Padat, fasilitas sedang
    'Kemayoran':          4.0,  # JIExpo, RS Mitra Kemayoran

    # --- JAKARTA BARAT ---
    'Kebon Jeruk':        4.5,  # Puri Indah Mall, RS Royal Taruma, sekolah BPK
    'Palmerah':           4.0,  # ITC Permata Hijau, RS Pelni, kampus Trisakti/Binus
    'Grogol Petamburan':  4.3,  # Central Park, RS Sumber Waras, Universitas Tarumanagara
    'Tambora':            3.5,  # Padat, Pasar Jembatan Lima, terbatas
    'Tamansari':          3.2,  # Kota tua, terbatas
    'Cengkareng':         3.8,  # Lippo Mall, Green Lake, RS
    'Kalideres':          3.5,  # Taman Palem, RS
    'Kembangan':          4.0,  # Mall Puri, RS Permata Cengkareng

    # --- JAKARTA UTARA ---
    'Penjaringan':        4.5,  # PIK Mall, Pluit Village, RS PIK
    'Pademangan':         3.5,  # Ancol, terbatas
    'Tanjung Priok':      3.5,  # Pelabuhan, Sunter Mall, RS
    'Koja':               3.0,  # Padat, fasilitas dasar
    'Kelapa Gading':      5.0,  # Mall Kelapa Gading, MOI, La Piazza, banyak RS & sekolah
    'Cilincing':          2.5,  # Industri, fasilitas minim

    # --- JAKARTA TIMUR ---
    'Matraman':           3.8,  # Dekat pusat, RS
    'Pulo Gadung':        4.0,  # Arion Mall, Rawamangun, Universitas Negeri Jakarta
    'Jatinegara':         3.8,  # Pasar Jatinegara, RS Islam, stasiun
    'Duren Sawit':        3.5,  # Buaran Plaza, terbatas
    'Kramat Jati':        3.5,  # Cawang, RS Kramat Jati
    'Makasar':            3.2,  # Halim, terbatas
    'Pasar Rebo':         3.0,  # Terbatas
    'Ciracas':            3.0,  # Terbatas, lebih baru
    'Cipayung':           3.3,  # TMII, Cibubur Junction, cukup
    'Cakung':             3.0,  # Industri, JGC baru berkembang

    # --- TANGERANG KOTA ---
    'Tangerang':          4.0,  # Tangcity Mall, RS Siloam
    'Karawaci':           4.2,  # Supermall Karawaci, UPH, RS Siloam
    'Cibodas':            3.3,  # Terbatas
    'Jatiuwung':          2.5,  # Industri
    'Periuk':             2.5,  # Terbatas
    'Batuceper':          3.0,  # Dekat bandara
    'Neglasari':          2.8,  # Terbatas
    'Cipondoh':           3.5,  # Modernland, RS
    'Pinang':             4.2,  # Alam Sutera Mall, The Breeze, Living World
    'Ciledug':            3.5,  # Transmart, RS
    'Larangan':           3.3,  # Cukup
    'Karang Tengah':      3.0,  # Terbatas
    'Benda':              2.8,  # Bandara area

    # --- TANGERANG KAB ---
    'Kelapa Dua':         4.3,  # Gading Serpong - SMS, AEON Mall, Scientia, sekolah internat.
    'Pagedangan':         4.5,  # BSD City - AEON, QBig, The Breeze BSD, ICE BSD
    'Cisauk':             3.0,  # Intermedia, Suvarna terbatas
    'Cikupa':             2.8,  # Citra Raya, RS terbatas
    'Tigaraksa':          2.5,  # Kabupaten center, pasar
    'Legok':              2.0,  # Pedesaan
    'Solear':             1.5,  # Pedesaan
    'Curug':              2.5,  # Terbatas
    'Sepatan':            2.0,  # Terbatas
    'Pasar Kemis':        2.5,  # Padat industri
    'Rajeg':              2.0,  # Pedesaan
    'Balaraja':           2.5,  # Industri
    'Kresek':             1.5,  # Pedesaan
    'Sindang Jaya':       1.5,  # Pedesaan
    'Teluk Naga':         1.5,  # Pesisir
    'Mauk':               1.5,  # Pesisir
    'Kronjo':             1.5,  # Pedesaan
    'Pakuhaji':           1.8,  # Terbatas
    'Kosambi':            2.0,  # Terbatas
    'Cisoka':             1.8,  # Maja, terbatas

    # --- TANGERANG SELATAN ---
    'Serpong':            4.0,  # Summarecon Mall, RS Eka Hospital
    'Serpong Utara':      4.2,  # Mall SMS, Ikea Alam Sutera dekat
    'Ciputat':            3.5,  # RS, pasar
    'Ciputat Timur':      3.5,  # Bintaro Jaya, RS Pondok Indah Bintaro
    'Pamulang':           3.3,  # Giant, RS, UNPAM
    'Pondok Aren':        3.8,  # Bintaro Jaya Xchange, Bintaro Plaza
    'Setu':               2.8,  # Terbatas, berkembang

    # --- BEKASI KOTA ---
    'Bekasi Timur':       3.8,  # Mega Bekasi, RS Anna Medika
    'Bekasi Barat':       3.5,  # Metropolitan Mall, RS
    'Bekasi Utara':       3.8,  # Harapan Indah, Summarecon Bekasi, RS
    'Bekasi Selatan':     3.5,  # Giant, Galaxy area
    'Pondok Gede':        3.2,  # Terbatas
    'Jatisampurna':       3.0,  # Perumahan
    'Jatiasih':           3.0,  # Terbatas
    'Rawalumbu':          3.2,  # RS, pasar
    'Mustikajaya':        2.5,  # Terbatas
    'Bantar Gebang':      2.0,  # TPA, minim
    'Pondokmelati':       3.0,  # Perumahan
    'Medan Satria':       3.5,  # Dekat Summarecon

    # --- BEKASI KAB ---
    'Tambun Selatan':     2.8,  # Grand Wisata, terbatas
    'Tambun Utara':       2.3,  # Pedesaan
    'Tarumajaya':         2.0,  # Industri
    'Babelan':            2.0,  # Terbatas
    'Cikarang Selatan':   3.0,  # Lippo Cikarang, Meikarta
    'Cikarang Barat':     3.0,  # Jababeka area
    'Cikarang Pusat':     2.5,  # Terbatas
    'Cikarang Utara':     2.8,  # Jababeka Mall
    'Cibitung':           2.5,  # Industri
    'Cibarusah':          2.0,  # Pedesaan
    'Karangbahagia':      2.0,  # Terbatas
    'Sukawangi':          1.8,  # Pedesaan
    'Setu':               2.5,  # Terbatas

    # --- DEPOK ---
    'Beji':               4.0,  # UI, Margo City, RS Bunda
    'Pancoran Mas':       4.0,  # Margonda, Depok Town Square, RS Hermina
    'Cipayung':           2.5,  # Citayam, terbatas
    'Sukmajaya':          3.5,  # Grand Depok City
    'Cilodong':           2.8,  # Terbatas
    'Limo':               2.8,  # Terbatas
    'Cinere':             3.5,  # Cinere Bellevue, RS
    'Tapos':              2.5,  # Terbatas
    'Cimanggis':          3.5,  # Cibubur area, Giant, RS
    'Sawangan':           2.2,  # Terbatas, agrikultur
    'Bojongsari':         2.5,  # Baru berkembang

    # --- BOGOR KOTA ---
    'Bogor Utara':        3.8,  # Botani Square, RS PMI
    'Bogor Tengah':       4.0,  # Pusat kota, mall BTM, RS Salak
    'Bogor Selatan':      3.0,  # Rancamaya, terbatas
    'Bogor Barat':        3.2,  # Taman Yasmin, terbatas
    'Bogor Timur':        3.0,  # Terbatas
    'Tanah Sareal':       3.5,  # Cimanggu, Giant, RS

    # --- BOGOR KAB ---
    'Cibinong':           3.5,  # Cibinong City Mall, RSUD, pusat kab
    'Babakan Madang':     3.0,  # Sentul City - mall Bellanova, RS
    'Cileungsi':          2.5,  # MetroPolitan Land, terbatas
    'Gunung Putri':       3.0,  # Kota Wisata, terbatas
    'Tajur Halang':       2.0,  # Pedesaan
    'Bojong Gede':        2.5,  # Pasar, terbatas
    'Sukaraja':           2.5,  # Terbatas
    'Citeureup':          2.5,  # Terbatas
    'Parung':             2.5,  # Pasar, terbatas
    'Gunung Sindur':      2.0,  # Pedesaan
    'Parung Panjang':     2.0,  # Terbatas
    'Rumpin':             1.5,  # Pedesaan
    'Ranca Bungur':       1.5,  # Pedesaan
    'Ciseeng':            1.8,  # Pedesaan
    'Jonggol':            1.8,  # Pedesaan
    'Sukamakmur':         1.5,  # Pedesaan
    'Ciomas':             2.5,  # Terbatas
    'Ciampea':            2.2,  # IPB Dramaga dekat
    'Dramaga':            2.8,  # IPB Dramaga
    'Cijeruk':            1.8,  # Pedesaan
    'Cisarua':            2.5,  # Wisata Puncak
    'Megamendung':        2.0,  # Wisata
    'Ciawi':              2.2,  # Terbatas
    'Jasinga':            1.5,  # Pedesaan
    'Tenjo':              1.5,  # Pedesaan
    'Caringin':           1.8,  # Terbatas
    'Cibungbulang':       1.8,  # Terbatas
    'Tamansari':          2.0,  # Terbatas
    'Tapos':              2.5,  # Terbatas
}


# =====================================================================
# AKSES TOL PER KECAMATAN (1-5)
# Jarak & jumlah gerbang tol yang bisa diakses
# =====================================================================

AKSES_TOL_PER_KECAMATAN = {
    # --- JAKARTA SELATAN ---
    'Kebayoran Baru':     4.5,  # Exit Semanggi, Senayan
    'Kebayoran Lama':     4.5,  # Exit Pondok Indah, Bintaro
    'Pesanggrahan':       4.0,  # Exit Bintaro
    'Cilandak':           4.5,  # Exit TB Simatupang, Fatmawati
    'Pasar Minggu':       4.5,  # Exit Pasar Minggu (Tol Depok-Antasari)
    'Jagakarsa':          3.5,  # Lebih jauh dari exit tol
    'Mampang Prapatan':   5.0,  # Exit Kuningan, Semanggi, Pancoran
    'Pancoran':           5.0,  # Exit Pancoran (Tol Cawang-Semanggi)
    'Tebet':              5.0,  # Exit Tebet (Tol Dalam Kota)
    'Setiabudi':          5.0,  # Exit Semanggi, Kuningan

    # --- JAKARTA PUSAT ---
    'Menteng':            5.0,  # Exit Cempaka Putih, Senen
    'Tanah Abang':        5.0,  # Exit Semanggi
    'Gambir':             4.5,  # Dekat tol dalam kota
    'Sawah Besar':        4.5,  # Exit Mangga Dua
    'Senen':              5.0,  # Exit Senen, Cempaka Putih
    'Cempaka Putih':      5.0,  # Exit Cempaka Putih
    'Johar Baru':         4.0,  # Cukup dekat
    'Kemayoran':          4.5,  # Exit Kemayoran

    # --- JAKARTA BARAT ---
    'Kebon Jeruk':        5.0,  # Exit Kebon Jeruk (Tol Jakarta-Tangerang)
    'Palmerah':           4.5,  # Exit Tomang, Slipi
    'Grogol Petamburan':  5.0,  # Exit Grogol (Tol Jakarta-Tangerang)
    'Tambora':            4.0,  # Agak jauh
    'Tamansari':          3.5,  # Kota tua, akses terbatas
    'Cengkareng':         4.5,  # Tol Bandara
    'Kalideres':          4.5,  # Exit Kalideres (Tol Jakarta-Tangerang)
    'Kembangan':          4.5,  # Exit Meruya (Tol JORR)

    # --- JAKARTA UTARA ---
    'Penjaringan':        4.0,  # Exit PIK, Pluit
    'Pademangan':         4.0,  # Exit Ancol
    'Tanjung Priok':      4.5,  # Tol Pelabuhan, Exit Sunter
    'Koja':               3.5,  # Agak jauh
    'Kelapa Gading':      4.5,  # Exit Kelapa Gading (Tol Cakung)
    'Cilincing':          3.5,  # Pelabuhan, terbatas

    # --- JAKARTA TIMUR ---
    'Matraman':           4.5,  # Exit Cempaka Putih
    'Pulo Gadung':        4.5,  # Exit Pulo Gadung (Tol Cakung)
    'Jatinegara':         4.0,  # Exit Jatinegara
    'Duren Sawit':        3.8,  # Agak jauh
    'Kramat Jati':        4.0,  # Exit Cawang (Tol Jagorawi)
    'Makasar':            4.0,  # Halim, Exit Halim
    'Pasar Rebo':         3.5,  # Agak jauh
    'Ciracas':            3.5,  # Terbatas
    'Cipayung':           4.0,  # Exit Cibubur (Tol Jagorawi)
    'Cakung':             4.0,  # Tol Cakung, JORR Timur

    # --- TANGERANG KOTA ---
    'Tangerang':          4.0,  # Exit Tangerang
    'Karawaci':           4.0,  # Exit Karawaci
    'Cibodas':            3.5,  # Agak jauh
    'Jatiuwung':          3.5,  # Industri, akses tol lumayan
    'Periuk':             3.0,  # Terbatas
    'Batuceper':          4.0,  # Dekat tol bandara
    'Neglasari':          3.5,  # Terbatas
    'Cipondoh':           4.0,  # Exit Cipondoh dekat
    'Pinang':             4.5,  # Alam Sutera exit, tol Jakarta-Tangerang
    'Ciledug':            3.5,  # Agak jauh
    'Larangan':           3.5,  # Agak jauh
    'Karang Tengah':      3.5,  # Terbatas
    'Benda':              4.0,  # Tol bandara

    # --- TANGERANG KAB ---
    'Kelapa Dua':         4.0,  # Exit Gading Serpong (Tol Jakarta-Merak via JORR 2)
    'Pagedangan':         4.5,  # Exit BSD (Tol Serpong-Balaraja via JORR 2)
    'Cisauk':             3.5,  # Exit Cisauk (Tol Serpong)
    'Cikupa':             3.5,  # Exit Cikupa (Tol Jakarta-Merak)
    'Tigaraksa':          3.0,  # Agak jauh
    'Legok':              2.5,  # Terbatas
    'Solear':             2.0,  # Jauh
    'Curug':              3.0,  # Terbatas
    'Sepatan':            2.5,  # Terbatas
    'Pasar Kemis':        3.0,  # Exit dekat Tol Jakarta-Merak
    'Rajeg':              2.5,  # Terbatas
    'Balaraja':           3.5,  # Exit Balaraja (Tol Jakarta-Merak)
    'Kresek':             2.0,  # Jauh
    'Sindang Jaya':       2.0,  # Jauh
    'Teluk Naga':         2.0,  # Pesisir, jauh
    'Mauk':               1.5,  # Sangat jauh
    'Kronjo':             1.5,  # Sangat jauh
    'Pakuhaji':           2.0,  # Terbatas
    'Kosambi':            3.0,  # Dekat Tol Bandara
    'Cisoka':             2.5,  # Terbatas

    # --- TANGERANG SELATAN ---
    'Serpong':            4.0,  # Exit Serpong (Tol JORR 2)
    'Serpong Utara':      4.0,  # BSD area
    'Ciputat':            3.8,  # Exit Ciputat (Tol JORR)
    'Ciputat Timur':      4.0,  # Exit Bintaro, Pondok Indah
    'Pamulang':           3.5,  # Agak jauh
    'Pondok Aren':        4.5,  # Exit Bintaro (Tol JORR)
    'Setu':               3.0,  # Baru dibangun

    # --- BEKASI KOTA ---
    'Bekasi Timur':       4.0,  # Exit Bekasi Timur (Tol Jakarta-Cikampek)
    'Bekasi Barat':       4.5,  # Exit Bekasi Barat (Tol Jakarta-Cikampek)
    'Bekasi Utara':       4.0,  # Exit
    'Bekasi Selatan':     4.0,  # JORR
    'Pondok Gede':        4.0,  # Exit Jatiwarna (JORR)
    'Jatisampurna':       3.5,  # Terbatas
    'Jatiasih':           4.0,  # Exit Jatiasih (JORR)
    'Rawalumbu':          3.5,  # Agak jauh
    'Mustikajaya':        3.0,  # Terbatas
    'Bantar Gebang':      2.5,  # Jauh
    'Pondokmelati':       3.5,  # Cukup
    'Medan Satria':       4.0,  # Exit Harapan Indah

    # --- BEKASI KAB ---
    'Tambun Selatan':     3.5,  # Exit Tambun (Tol Jakarta-Cikampek)
    'Tambun Utara':       3.0,  # Terbatas
    'Tarumajaya':         3.0,  # Terbatas
    'Babelan':            2.5,  # Terbatas
    'Cikarang Selatan':   4.0,  # Exit Cikarang (Tol Jakarta-Cikampek)
    'Cikarang Barat':     4.0,  # Exit
    'Cikarang Pusat':     3.5,  # Cukup
    'Cikarang Utara':     3.5,  # Exit Cibitu
    'Cibitung':           3.5,  # Exit Cibitung
    'Cibarusah':          2.5,  # Terbatas
    'Karangbahagia':      3.0,  # Terbatas
    'Sukawangi':          2.0,  # Pedesaan
    'Setu':               3.0,  # Terbatas

    # --- DEPOK ---
    'Beji':               3.5,  # Exit Depok (Tol Depok-Antasari)
    'Pancoran Mas':       3.5,  # Dekat tol
    'Cipayung':           3.0,  # Citayam, terbatas
    'Sukmajaya':          3.5,  # Cukup
    'Cilodong':           3.0,  # Terbatas
    'Limo':               3.5,  # Cinere-Serpong tol
    'Cinere':             4.0,  # Exit Cinere (Tol Depok-Antasari, Tol Cinere-Serpong)
    'Tapos':              3.0,  # Terbatas
    'Cimanggis':          4.0,  # Exit Cimanggis (Tol Jagorawi)
    'Sawangan':           2.5,  # Jauh
    'Bojongsari':         3.0,  # Terbatas

    # --- BOGOR KOTA ---
    'Bogor Utara':        3.5,  # Exit Kedung Halang (Tol Jagorawi)
    'Bogor Tengah':       3.5,  # Exit Baranangsiang
    'Bogor Selatan':      3.0,  # Agak jauh
    'Bogor Barat':        3.0,  # Terbatas
    'Bogor Timur':        3.5,  # Exit Baranangsiang
    'Tanah Sareal':       3.0,  # Agak jauh

    # --- BOGOR KAB ---
    'Cibinong':           4.0,  # Exit Cibinong (Tol Jagorawi), Exit Sentul Selatan
    'Babakan Madang':     4.0,  # Exit Sentul City (Tol Jagorawi)
    'Cileungsi':          3.5,  # Exit Cileungsi (Tol Jagorawi)
    'Gunung Putri':       4.0,  # Exit Gunung Putri (Tol Jagorawi)
    'Tajur Halang':       2.5,  # Terbatas
    'Bojong Gede':        2.5,  # Terbatas (belum ada tol)
    'Sukaraja':           3.5,  # Exit dekat Cibinong
    'Citeureup':          3.5,  # Exit Citeureup (Tol Jagorawi)
    'Parung':             2.5,  # Terbatas
    'Gunung Sindur':      2.5,  # Baru dibangun
    'Parung Panjang':     2.0,  # Jauh dari tol
    'Rumpin':             1.5,  # Jauh
    'Ranca Bungur':       2.0,  # Terbatas
    'Ciseeng':            2.0,  # Terbatas
    'Jonggol':            2.0,  # Jauh
    'Sukamakmur':         1.5,  # Jauh
    'Ciomas':             2.5,  # Terbatas
    'Ciampea':            2.0,  # Jauh dari tol
    'Dramaga':            2.5,  # Terbatas
    'Cijeruk':            2.0,  # Terbatas
    'Cisarua':            3.0,  # Exit Gadog dekat
    'Megamendung':        2.5,  # Terbatas
    'Ciawi':              3.0,  # Exit Ciawi (ujung Tol Jagorawi)
    'Jasinga':            1.5,  # Jauh
    'Tenjo':              1.5,  # Jauh
    'Caringin':           2.0,  # Terbatas
    'Cibungbulang':       2.0,  # Terbatas
    'Tamansari':          2.0,  # Terbatas
    'Tapos':              2.5,  # Terbatas
}


# =====================================================================
# AKSES KERETA PER KECAMATAN (1-5)
# KRL Commuter Line, MRT, LRT
# =====================================================================

AKSES_KERETA_PER_KECAMATAN = {
    # --- JAKARTA SELATAN ---
    'Kebayoran Baru':     5.0,  # MRT Blok M, Blok A, Haji Nawi + KRL Kebayoran
    'Kebayoran Lama':     4.0,  # KRL Kebayoran Lama, Pondok Ranji
    'Pesanggrahan':       3.5,  # KRL Pesanggrahan sekitar
    'Cilandak':           5.0,  # MRT Lebak Bulus, Fatmawati, Cipete Raya
    'Pasar Minggu':       4.5,  # KRL Pasar Minggu, Pasar Minggu Baru, Tanjung Barat
    'Jagakarsa':          4.0,  # KRL Lenteng Agung, Universitas Pancasila
    'Mampang Prapatan':   4.5,  # MRT dekat (Kuningan area)
    'Pancoran':           3.5,  # Agak jauh dari stasiun
    'Tebet':              5.0,  # KRL Tebet, Cawang + MRT dekat
    'Setiabudi':          5.0,  # MRT Dukuh Atas, Setiabudi, Bendungan Hilir + KRL Sudirman

    # --- JAKARTA PUSAT ---
    'Menteng':            5.0,  # KRL Gondangdia, Cikini, MRT area
    'Tanah Abang':        5.0,  # KRL Tanah Abang (hub utama), MRT area
    'Gambir':             5.0,  # KRL Gambir, Juanda
    'Sawah Besar':        4.5,  # KRL Sawah Besar, Mangga Besar
    'Senen':              5.0,  # KRL Senen, Kramat
    'Cempaka Putih':      4.0,  # Agak jauh, tapi KRL Cempaka Putih
    'Johar Baru':         4.0,  # Dekat Senen
    'Kemayoran':          3.5,  # LRT segera operasi, KRL Kemayoran

    # --- JAKARTA BARAT ---
    'Kebon Jeruk':        2.5,  # Tidak ada stasiun langsung
    'Palmerah':           4.5,  # KRL Palmerah
    'Grogol Petamburan':  3.5,  # KRL Grogol dekat
    'Tambora':            3.5,  # KRL Angke, Duri
    'Tamansari':          3.5,  # KRL dekat
    'Cengkareng':         2.0,  # Jauh dari stasiun
    'Kalideres':          2.0,  # Jauh dari stasiun
    'Kembangan':          2.0,  # Jauh dari stasiun

    # --- JAKARTA UTARA ---
    'Penjaringan':        2.5,  # Jauh, terbatas
    'Pademangan':         3.0,  # Dekat Kampung Bandan
    'Tanjung Priok':      4.0,  # KRL Tanjung Priok
    'Koja':               3.5,  # Dekat KRL
    'Kelapa Gading':      4.5,  # LRT Kelapa Gading-Velodrome
    'Cilincing':          2.5,  # Terbatas

    # --- JAKARTA TIMUR ---
    'Matraman':           4.5,  # KRL Jatinegara dekat
    'Pulo Gadung':        3.5,  # LRT dekat
    'Jatinegara':         5.0,  # KRL Jatinegara (hub besar)
    'Duren Sawit':        3.0,  # Agak jauh
    'Kramat Jati':        3.5,  # LRT dekat
    'Makasar':            3.0,  # LRT Halim dekat
    'Pasar Rebo':         2.5,  # Terbatas
    'Ciracas':            3.0,  # LRT Ciracas
    'Cipayung':           4.0,  # LRT Cibubur, KRL
    'Cakung':             3.5,  # LRT dekat, KRL Cakung

    # --- TANGERANG KOTA ---
    'Tangerang':          4.0,  # KRL Tangerang
    'Karawaci':           3.0,  # Agak jauh
    'Cibodas':            2.5,  # Terbatas
    'Jatiuwung':          2.0,  # Jauh
    'Periuk':             2.0,  # Jauh
    'Batuceper':          4.0,  # KRL Batuceper, Bandara line
    'Neglasari':          3.0,  # Dekat Bandara line
    'Cipondoh':           3.0,  # Cukup dekat KRL
    'Pinang':             2.5,  # Terbatas
    'Ciledug':            2.5,  # Terbatas
    'Larangan':           2.5,  # Terbatas
    'Karang Tengah':      2.5,  # Terbatas
    'Benda':              4.0,  # Bandara line, KRL

    # --- TANGERANG KAB ---
    'Kelapa Dua':         2.5,  # Agak jauh dari stasiun
    'Pagedangan':         3.0,  # Dekat Cisauk-Serpong KRL
    'Cisauk':             4.0,  # KRL Cisauk
    'Cikupa':             2.0,  # Jauh
    'Tigaraksa':          2.0,  # Terbatas
    'Legok':              1.5,  # Jauh
    'Solear':             1.0,  # Jauh
    'Curug':              2.0,  # Terbatas
    'Sepatan':            1.5,  # Jauh
    'Pasar Kemis':        1.5,  # Jauh
    'Rajeg':              1.5,  # Jauh
    'Balaraja':           1.5,  # Jauh
    'Kresek':             1.0,  # Jauh
    'Sindang Jaya':       1.0,  # Jauh
    'Teluk Naga':         1.5,  # Pesisir
    'Mauk':               1.0,  # Sangat jauh
    'Kronjo':             1.0,  # Sangat jauh
    'Pakuhaji':           1.5,  # Terbatas
    'Kosambi':            2.0,  # Terbatas
    'Cisoka':             1.5,  # Terbatas

    # --- TANGERANG SELATAN ---
    'Serpong':            4.0,  # KRL Serpong
    'Serpong Utara':      3.5,  # Dekat Serpong KRL
    'Ciputat':            2.5,  # Tidak ada stasiun langsung
    'Ciputat Timur':      3.0,  # Dekat Jurangmangu/Sudimara KRL
    'Pamulang':           2.0,  # Jauh
    'Pondok Aren':        3.5,  # KRL Pondok Ranji, Jurangmangu
    'Setu':               2.0,  # Jauh

    # --- BEKASI KOTA ---
    'Bekasi Timur':       4.0,  # KRL Bekasi
    'Bekasi Barat':       3.5,  # Dekat KRL
    'Bekasi Utara':       3.0,  # Terbatas
    'Bekasi Selatan':     3.0,  # Terbatas
    'Pondok Gede':        3.0,  # Agak jauh
    'Jatisampurna':       2.5,  # Terbatas
    'Jatiasih':           3.0,  # Dekat KRL
    'Rawalumbu':          2.5,  # Terbatas
    'Mustikajaya':        2.0,  # Jauh
    'Bantar Gebang':      1.5,  # Jauh
    'Pondokmelati':       2.5,  # Terbatas
    'Medan Satria':       3.0,  # Dekat KRL

    # --- BEKASI KAB ---
    'Tambun Selatan':     3.5,  # KRL Tambun
    'Tambun Utara':       3.0,  # Dekat KRL Tambun
    'Tarumajaya':         2.0,  # Terbatas
    'Babelan':            2.0,  # Terbatas
    'Cikarang Selatan':   3.0,  # KRL Cikarang line
    'Cikarang Barat':     3.0,  # Dekat KRL
    'Cikarang Pusat':     2.5,  # Terbatas
    'Cikarang Utara':     2.5,  # Terbatas
    'Cibitung':           3.0,  # KRL Cibitung
    'Cibarusah':          2.0,  # Terbatas
    'Karangbahagia':      2.5,  # Terbatas
    'Sukawangi':          1.5,  # Jauh
    'Setu':               2.0,  # Terbatas

    # --- DEPOK ---
    'Beji':               5.0,  # KRL UI, Pondok Cina
    'Pancoran Mas':       4.5,  # KRL Depok, Depok Baru
    'Cipayung':           4.0,  # KRL Citayam
    'Sukmajaya':          4.0,  # Dekat KRL
    'Cilodong':           3.0,  # Terbatas
    'Limo':               2.5,  # Terbatas
    'Cinere':             2.0,  # Jauh dari stasiun
    'Tapos':              2.5,  # Terbatas
    'Cimanggis':          2.5,  # Terbatas
    'Sawangan':           2.0,  # Jauh
    'Bojongsari':         2.5,  # Terbatas

    # --- BOGOR KOTA ---
    'Bogor Utara':        3.5,  # Dekat KRL Bogor
    'Bogor Tengah':       4.5,  # KRL Bogor (terminal)
    'Bogor Selatan':      3.0,  # Agak jauh
    'Bogor Barat':        3.0,  # Terbatas
    'Bogor Timur':        4.0,  # Dekat KRL
    'Tanah Sareal':       3.0,  # Terbatas

    # --- BOGOR KAB ---
    'Cibinong':           3.5,  # Dekat KRL (KRL Nambo line)
    'Babakan Madang':     2.5,  # Terbatas (Sentul)
    'Cileungsi':          2.0,  # Jauh
    'Gunung Putri':       2.5,  # Terbatas
    'Tajur Halang':       3.0,  # KRL Citayam-Bogor line dekat
    'Bojong Gede':        4.5,  # KRL Bojong Gede (stasiun besar)
    'Sukaraja':           3.0,  # Dekat Cilebut KRL
    'Citeureup':          2.5,  # Terbatas
    'Parung':             2.0,  # Jauh
    'Gunung Sindur':      2.0,  # Jauh
    'Parung Panjang':     4.0,  # KRL Parung Panjang (KRL Rangkasbitung line)
    'Rumpin':             1.5,  # Jauh
    'Ranca Bungur':       1.5,  # Jauh
    'Ciseeng':            2.0,  # Terbatas
    'Jonggol':            1.5,  # Jauh
    'Sukamakmur':         1.0,  # Sangat jauh
    'Ciomas':             2.5,  # Terbatas
    'Ciampea':            2.0,  # Jauh
    'Dramaga':            2.0,  # Jauh
    'Cijeruk':            1.5,  # Jauh
    'Cisarua':            1.5,  # Puncak area, jauh
    'Megamendung':        1.5,  # Jauh
    'Ciawi':              2.0,  # Terbatas
    'Jasinga':            1.5,  # Jauh
    'Tenjo':              3.0,  # KRL Tenjo (KRL Rangkasbitung line)
    'Caringin':           1.5,  # Jauh
    'Cibungbulang':       1.5,  # Jauh
    'Tamansari':          2.0,  # Terbatas
    'Tapos':              2.5,  # Terbatas
}
