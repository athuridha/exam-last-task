"""Quick utility — print latest PlsRun summary from DB."""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent / "analysis"))
from save_pls_to_db import get_engine
from sqlalchemy import text

with get_engine().connect() as c:
    run = c.execute(text(
        'SELECT id, "runAt", "nComponents", "nSamples", "rSquared", '
        '"adjustedRSquared", rmse, "cvR2" '
        'FROM "PlsRun" ORDER BY "runAt" DESC LIMIT 1'
    )).fetchone()
    print("LATEST RUN:", dict(run._mapping))

    konstruks = c.execute(text(
        'SELECT konstruk, "avgVip", signifikan, hipotesis '
        'FROM "PlsKonstrukSummary" WHERE "runId" = :rid '
        'ORDER BY "avgVip" DESC'
    ), {"rid": run.id}).fetchall()
    print("\nKONSTRUK:")
    for k in konstruks:
        d = dict(k._mapping)
        print(f"  {d['konstruk']:35s} avg={d['avgVip']:.3f} sig={d['signifikan']} → {d['hipotesis']}")

    ols = c.execute(text(
        'SELECT * FROM "PlsOlsComparison" WHERE "runId" = :rid'
    ), {"rid": run.id}).fetchone()
    if ols:
        print("\nOLS COMPARISON:", dict(ols._mapping))

    km = c.execute(text(
        'SELECT * FROM "PlsKmeansValidation" WHERE "runId" = :rid'
    ), {"rid": run.id}).fetchone()
    if km:
        print("\nKMEANS VALIDATION:", dict(km._mapping))
