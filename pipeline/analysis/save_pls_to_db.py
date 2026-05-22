"""
Save PLS Results to Database
----------------------------
Menyimpan hasil eksekusi PLS Regression ke tabel `PlsRun`, `PlsVipScore`,
`PlsKonstrukSummary`, `PlsOlsComparison`, dan `PlsKmeansValidation`.

Dipanggil otomatis oleh `pls_regression.py` setelah model fit, atau bisa
dijalankan manual via:
    python pipeline/analysis/save_pls_to_db.py <results.json>

Database connection: Postgres URL di file .env (DATABASE_URL).
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine import Engine
except ImportError:
    print("❌ sqlalchemy belum terpasang. Install dengan: pip install sqlalchemy psycopg2-binary")
    raise

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass


def get_engine() -> Engine:
    """Bangun SQLAlchemy engine dari DATABASE_URL di .env."""
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not url:
        raise RuntimeError("DATABASE_URL tidak ditemukan di .env")
    # SQLAlchemy butuh prefix postgresql+psycopg2://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return create_engine(url)


def save_pls_run(results: dict) -> int:
    """
    Simpan hasil PLS ke database. Return id PlsRun yang baru dibuat.

    Format `results` (semua field optional kecuali metrics utama):
    {
        "n_components": 3,
        "n_samples": 29847,
        "r_squared": 0.3241,
        "adjusted_r_squared": 0.3214,
        "rmse": 1.4827,
        "cv_r2": 0.3198,
        "vip_scores": [
            {"variabel": "...", "kode": "...", "konstruk": "...",
             "vip": 1.89, "koefisien": -0.412, "signifikan": True,
             "arah": "negatif"},
            ...
        ],
        "konstruk_summary": [
            {"konstruk": "...", "avg_vip": 1.55, "signifikan": True,
             "hipotesis": "H1 diterima"},
            ...
        ],
        "ols_comparison": {
            "pls_r2": 0.3241, "ols_r2": 0.2987,
            "pls_rmse": 1.4827, "ols_rmse": 1.5134,
            "condition_number_ols": 847.3,
            "kesimpulan": "...",
            ...
        },
        "kmeans_validation": {
            "n_clusters": 4,
            "silhouette_score_interval": 0.52,
            "silhouette_score_kmeans": 0.47,
            ...
        },
        "notes": "..."
    }
    """
    engine = get_engine()

    with engine.begin() as conn:
        # Insert PlsRun (header)
        run_id = conn.execute(
            text(
                """
                INSERT INTO "PlsRun" (
                    "runAt", "method", "targetVariable", "nComponents",
                    "nSamples", "rSquared", "adjustedRSquared", "rmse",
                    "cvR2", "crossValidation", "preprocessing", "notes"
                ) VALUES (
                    :run_at, :method, :target, :nc, :ns, :r2, :ar2, :rmse,
                    :cvr2, :cv, :prep, :notes
                ) RETURNING id
                """
            ),
            {
                "run_at": datetime.utcnow(),
                "method": results.get("method", "PLSRegression (scikit-learn)"),
                "target": results.get("target_variable", "Rasio_Harga_NJOP"),
                "nc": int(results["n_components"]),
                "ns": int(results["n_samples"]),
                "r2": float(results["r_squared"]),
                "ar2": float(results.get("adjusted_r_squared") or results["r_squared"]),
                "rmse": float(results["rmse"]),
                "cvr2": float(results.get("cv_r2", 0.0)) or None,
                "cv": results.get("cross_validation", "5-fold"),
                "prep": results.get("preprocessing", "StandardScaler (Z-score)"),
                "notes": results.get("notes"),
            },
        ).scalar_one()

        # Insert VIP scores
        for vip in results.get("vip_scores", []):
            conn.execute(
                text(
                    """
                    INSERT INTO "PlsVipScore" (
                        "runId", "variabel", "kode", "konstruk",
                        "vip", "koefisien", "signifikan", "arah"
                    ) VALUES (
                        :run, :var, :kode, :kon, :vip, :koef, :sig, :arah
                    )
                    """
                ),
                {
                    "run": run_id,
                    "var": vip["variabel"],
                    "kode": vip.get("kode", vip["variabel"]),
                    "kon": vip.get("konstruk", "-"),
                    "vip": float(vip["vip"]),
                    "koef": float(vip.get("koefisien", 0.0)),
                    "sig": bool(vip.get("signifikan", vip["vip"] > 1.0)),
                    "arah": vip.get("arah"),
                },
            )

        # Insert konstruk summary
        for k in results.get("konstruk_summary", []):
            conn.execute(
                text(
                    """
                    INSERT INTO "PlsKonstrukSummary" (
                        "runId", "konstruk", "avgVip", "signifikan", "hipotesis"
                    ) VALUES (:run, :k, :avg, :sig, :hip)
                    """
                ),
                {
                    "run": run_id,
                    "k": k["konstruk"],
                    "avg": float(k["avg_vip"]),
                    "sig": bool(k.get("signifikan", k["avg_vip"] > 1.0)),
                    "hip": k.get("hipotesis", ""),
                },
            )

        # OLS comparison (1:1)
        ols = results.get("ols_comparison")
        if ols:
            conn.execute(
                text(
                    """
                    INSERT INTO "PlsOlsComparison" (
                        "runId", "plsR2", "olsR2", "plsRmse", "olsRmse",
                        "plsAdjustedR2", "olsAdjustedR2",
                        "conditionNumber", "kesimpulan"
                    ) VALUES (
                        :run, :pr2, :or2, :prmse, :ormse, :par2, :oar2,
                        :cn, :kes
                    )
                    """
                ),
                {
                    "run": run_id,
                    "pr2": float(ols["pls_r2"]),
                    "or2": float(ols["ols_r2"]),
                    "prmse": float(ols["pls_rmse"]),
                    "ormse": float(ols["ols_rmse"]),
                    "par2": float(ols.get("pls_adjusted_r2") or ols["pls_r2"]),
                    "oar2": float(ols.get("ols_adjusted_r2") or ols["ols_r2"]),
                    "cn": float(ols.get("condition_number_ols", 0.0)) or None,
                    "kes": ols.get("kesimpulan"),
                },
            )

        # K-Means validation (1:1)
        km = results.get("kmeans_validation")
        if km:
            conn.execute(
                text(
                    """
                    INSERT INTO "PlsKmeansValidation" (
                        "runId", "nClusters",
                        "silhouetteScoreInterval", "silhouetteScoreKmeans",
                        "silhouetteScoreGmm",
                        "daviesBouldinKmeans", "daviesBouldinGmm",
                        "ariIntervalVsKmeans", "ariIntervalVsGmm",
                        "bicOptimalKGmm", "kesimpulan"
                    ) VALUES (
                        :run, :nc,
                        :si_int, :si_km, :si_gmm,
                        :db_km, :db_gmm,
                        :ari_km, :ari_gmm,
                        :bic, :kes
                    )
                    """
                ),
                {
                    "run": run_id,
                    "nc": int(km.get("n_clusters", 4)),
                    "si_int": km.get("silhouette_score_interval"),
                    "si_km": km.get("silhouette_score_kmeans"),
                    "si_gmm": km.get("silhouette_score_gmm"),
                    "db_km": km.get("davies_bouldin_kmeans"),
                    "db_gmm": km.get("davies_bouldin_gmm"),
                    "ari_km": km.get("ari_interval_vs_kmeans"),
                    "ari_gmm": km.get("ari_interval_vs_gmm"),
                    "bic": km.get("bic_optimal_k_gmm"),
                    "kes": km.get("kesimpulan"),
                },
            )

    print(f"✅ PLS run #{run_id} disimpan ke database.")
    return run_id


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python save_pls_to_db.py <results.json>")
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
    save_pls_run(data)
