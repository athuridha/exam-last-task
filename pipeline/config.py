import os

# Base directory is the Data folder containing raw files
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

PIPELINE_DIR = os.path.dirname(__file__)

# Pipeline Data Directories
DATA_DIR = os.path.join(PIPELINE_DIR, 'data')
RAW_DATA_PATH = os.path.join(DATA_DIR, 'raw', 'listing_raw.csv')
CLEANED_DATA_PATH = os.path.join(DATA_DIR, 'cleaned', 'rumah123_jabodetabek_cleaned.csv')
OUTPUT_CLEANED_DATA_PATH = os.path.join(DATA_DIR, 'cleaned', 'rumah123_jabodetabek_cleaned.csv')
OUTPUT_FEATURES_DATA_PATH = os.path.join(DATA_DIR, 'final', 'rumah123_jabodetabek_with_features.csv')
ENRICHED_DATA_PATH = os.path.join(DATA_DIR, 'final', 'properti_jabodetabek_enriched.csv')

# Reference Data Directory
REFERENCE_DIR = os.path.join(PIPELINE_DIR, 'data_referensi')

# Constants for Spatial Calculation
MONAS_LAT = -6.1754
MONAS_LNG = 106.8272
EARTH_RADIUS_KM = 6371

# Constants for Modeling
RANDOM_STATE = 42

# NJOP 2026 Reference (Default)
NJOP_PER_KOTA = {
    'Jakarta Selatan': 15125000,
    'Jakarta Pusat': 18150000,
    'Jakarta Barat': 10285000,
    'Jakarta Utara': 9075000,
    'Jakarta Timur': 7865000,
    'Tangerang': 4235000,
    'Tangerang Selatan': 6655000,
    'Bekasi': 3630000,
    'Depok': 3872000,
    'Bogor': 3025000,
}

# Crime Index Reference
INDEKS_KEJAHATAN = {
    'Jakarta Pusat': 3.8,
    'Jakarta Utara': 3.5,
    'Jakarta Barat': 3.3,
    'Jakarta Timur': 3.0,
    'Jakarta Selatan': 2.5,
    'Bekasi': 2.8,
    'Tangerang': 2.7,
    'Tangerang Selatan': 2.0,
    'Depok': 2.5,
    'Bogor': 2.3,
}
