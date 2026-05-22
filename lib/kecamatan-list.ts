/**
 * Static kecamatan & flood configuration data used by scrape API routes.
 * Extracted from the Python scrape_banjir.py logic.
 */

export const KOTA_LIST = [
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Utara",
  "Bekasi",
  "Bogor",
  "Depok",
  "Tangerang",
  "Tangerang Selatan",
] as const;

/**
 * Kelurahan-to-kecamatan mapping for better article matching.
 * Well-known flood-prone kelurahan names mapped to their kecamatan.
 */
export const KELURAHAN_TO_KECAMATAN: Record<string, string> = {
  "kampung melayu": "Jatinegara",
  "bidara cina": "Jatinegara",
  "bukit duri": "Tebet",
  "kebon pala": "Makasar",
  "rawajati": "Pancoran",
  "manggarai": "Tebet",
  "cipinang melayu": "Makasar",
  cawang: "Kramat Jati",
  kalibata: "Pancoran",
  "pondok labu": "Cilandak",
  cipete: "Cilandak",
  pejaten: "Pasar Minggu",
  kemang: "Mampang Prapatan",
  pluit: "Penjaringan",
  "muara baru": "Penjaringan",
  kapuk: "Cengkareng",
  semanan: "Kalideres",
  "rawa buaya": "Cengkareng",
  tomang: "Grogol Petamburan",
  jelambar: "Grogol Petamburan",
  ciledug: "Ciledug",
  "karang tengah": "Karang Tengah",
  "teluk naga": "Teluk Naga",
};

/** Known flood-prone areas for targeted search queries */
export const KNOWN_FLOOD_AREAS = [
  "Kampung Melayu",
  "Bidara Cina",
  "Cipinang Melayu",
  "Jatinegara",
  "Cawang",
  "Kalibata",
  "Rawajati",
  "Manggarai",
  "Bukit Duri",
  "Kebon Pala",
  "Cipinang",
  "Cililitan",
  "Makasar",
  "Kemang",
  "Pejaten",
  "Cilandak",
  "Kebayoran Lama",
  "Penjaringan",
  "Pademangan",
  "Koja",
  "Cilincing",
  "Cengkareng",
  "Kalideres",
  "Kembangan",
  "Pondok Labu",
  "Cipete",
  "Pesanggrahan",
];

/** Build the full list of Google News search queries */
export function buildSearchQueries(): string[] {
  const queries: string[] = [
    "banjir jabodetabek",
    "banjir jakarta",
    "banjir DKI Jakarta",
    "banjir bodetabek",
    "daerah rawan banjir jakarta",
    "daerah rawan banjir jabodetabek",
    "banjir rob jakarta utara",
    "genangan banjir jakarta",
  ];
  for (const kota of KOTA_LIST) {
    queries.push(`banjir ${kota}`);
    queries.push(`daerah rawan banjir ${kota}`);
  }
  for (const area of KNOWN_FLOOD_AREAS) {
    queries.push(`banjir ${area}`);
  }
  return queries;
}

/** Flood-related keywords for filtering */
export const FLOOD_KEYWORDS = [
  "banjir",
  "genangan",
  "rob ",
  "terendam",
  "kebanjiran",
];
