import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/pls/bobot
 * --------------------------------------------------------------
 * Mengembalikan hasil analisis PLS terbaru dari database.
 * Data dipopulate oleh skrip Python `pipeline/analysis/run_full_analysis.py`
 * yang menjalankan PLS + OLS + K-Means/GMM lalu menyimpan hasil ke
 * tabel PlsRun, PlsVipScore, PlsKonstrukSummary, PlsOlsComparison,
 * dan PlsKmeansValidation.
 *
 * Untuk merefresh hasil:
 *   $env:PYTHONIOENCODING="utf-8"
 *   python pipeline/analysis/run_full_analysis.py
 */

export const dynamic = "force-dynamic";

export async function GET() {
  // Ambil run terbaru
  const latest = await prisma.plsRun.findFirst({
    orderBy: { runAt: "desc" },
    include: {
      vipScores: { orderBy: { vip: "desc" } },
      konstrukSummary: true,
      olsComparison: true,
      kmeansValidation: true,
    },
  });

  if (!latest) {
    return NextResponse.json(
      {
        error:
          "Belum ada hasil PLS di database. Jalankan: python pipeline/analysis/run_full_analysis.py",
      },
      { status: 404 }
    );
  }

  const payload = {
    model_info: {
      method: latest.method,
      n_components: latest.nComponents,
      n_samples: latest.nSamples,
      r_squared: latest.rSquared,
      adjusted_r_squared: latest.adjustedRSquared ?? latest.rSquared,
      rmse: latest.rmse,
      cv_r2: latest.cvR2,
      cross_validation: latest.crossValidation,
      target_variable: latest.targetVariable,
      preprocessing: latest.preprocessing,
      run_at: latest.runAt.toISOString(),
      run_id: latest.id,
      notes: latest.notes ?? undefined,
    },
    vip_scores: latest.vipScores.map((v) => ({
      variabel: v.variabel,
      kode: v.kode,
      konstruk: v.konstruk,
      vip: v.vip,
      koefisien: v.koefisien,
      signifikan: v.signifikan,
      arah: v.arah ?? (v.koefisien >= 0 ? "positif" : "negatif"),
    })),
    path_coefficients: latest.vipScores
      .map((v) => ({
        variabel: v.variabel,
        koefisien: v.koefisien,
        arah: v.arah ?? (v.koefisien >= 0 ? "positif" : "negatif"),
      }))
      .sort((a, b) => Math.abs(b.koefisien) - Math.abs(a.koefisien)),
    konstruk_summary: latest.konstrukSummary.map((k) => ({
      konstruk: k.konstruk,
      avg_vip: k.avgVip,
      signifikan: k.signifikan,
      hipotesis: k.hipotesis,
    })),
    ols_comparison: latest.olsComparison
      ? {
          pls_r2: latest.olsComparison.plsR2,
          ols_r2: latest.olsComparison.olsR2,
          pls_rmse: latest.olsComparison.plsRmse,
          ols_rmse: latest.olsComparison.olsRmse,
          pls_adjusted_r2: latest.olsComparison.plsAdjustedR2,
          ols_adjusted_r2: latest.olsComparison.olsAdjustedR2,
          condition_number_ols: latest.olsComparison.conditionNumber,
          kesimpulan: latest.olsComparison.kesimpulan,
        }
      : null,
    kmeans_validation: latest.kmeansValidation
      ? {
          n_clusters: latest.kmeansValidation.nClusters,
          silhouette_score_interval:
            latest.kmeansValidation.silhouetteScoreInterval,
          silhouette_score_kmeans:
            latest.kmeansValidation.silhouetteScoreKmeans,
          silhouette_score_gmm: latest.kmeansValidation.silhouetteScoreGmm,
          davies_bouldin_kmeans: latest.kmeansValidation.daviesBouldinKmeans,
          davies_bouldin_gmm: latest.kmeansValidation.daviesBouldinGmm,
          ari_interval_vs_kmeans:
            latest.kmeansValidation.ariIntervalVsKmeans,
          ari_interval_vs_gmm: latest.kmeansValidation.ariIntervalVsGmm,
          bic_optimal_k_gmm: latest.kmeansValidation.bicOptimalKGmm,
          kesimpulan: latest.kmeansValidation.kesimpulan,
        }
      : null,
  };

  return NextResponse.json(payload);
}
