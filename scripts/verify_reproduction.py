"""
Verification harness: compare regenerated revision JSONs against the values
recorded in RESULTS_SUMMARY.md, and report acceptance criteria for the Phase-2
strengthening experiments. Read-only; prints a PASS/FAIL table + overall verdict.

Usage:
  python scripts/verify_reproduction.py
"""
import os
import json

_HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(os.path.dirname(_HERE), "results")

TOL = 5e-3        # deterministic point values (WM deterministic=True)
TOL_OPE = 1.2e-2  # ope_validation uses a sampling predict path

rows = []  # (name, status, detail)


def _add(name, ok, detail):
    rows.append((name, "PASS" if ok else ("SKIP" if ok is None else "FAIL"), detail))


def _load(fname):
    p = os.path.join(RES, fname)
    return json.load(open(p)) if os.path.exists(p) else None


def near(a, b, tol=TOL):
    return a is not None and b is not None and abs(a - b) <= tol


GAMMA = 0.05   # baseline selection: val MAE + GAMMA * val CE (Section V-B)

# Reported values, matched +/-1 action box: method -> (MAE, CE)
PAPER = {
    "cmp2":       {"SARC": (0.233, 0.079), "D-EWMA": (0.365, 0.077),
                   "age_dEWMA": (0.367, 0.078), "Kalman": (0.286, 0.261)},
    "cmp1":       {"SARC": (0.492, 0.121), "D-EWMA": (0.500, 0.031),
                   "age_dEWMA": (0.501, 0.144), "Kalman": (0.500, 0.955)},
    "sim_mild":   {"SARC": (0.269, 0.321), "D-EWMA": (0.276, 0.035),
                   "age_dEWMA": (0.271, 0.034), "Kalman": (0.322, 0.140)},
    "sim_medium": {"SARC": (0.333, 0.334), "D-EWMA": (0.325, 0.080),
                   "age_dEWMA": (0.321, 0.079), "Kalman": (0.399, 0.153)},
}


def check_tables():
    """Re-select every baseline from the stored grid the way the paper does, and
    compare the result against the reported MAE/CE."""
    for tb, want in PAPER.items():
        j = _load(f"e6_grid_{tb}.json")
        if j is None:
            _add(f"Tables {tb}", None, "grid json missing"); continue
        box = j["boxes"]["box_1.0"]
        got = {"SARC": (box["SARC"]["test_mae"], box["SARC"]["test_ce"])}
        for fam, pts in box["baselines"].items():
            p = min(pts, key=lambda q: q["val_mae"] + GAMMA * q["val_ce"])
            got[fam] = (p["test_mae"], p["test_ce"])
        bad = [k for k, (m, c) in want.items()
               if k not in got or not (near(got[k][0], m) and near(got[k][1], c))]
        _add(f"Tables {tb}", not bad,
             "  ".join(f"{k} {got[k][0]:.3f}/{got[k][1]:.3f}" for k in want if k in got)
             + (f"   MISMATCH {bad}" if bad else ""))


def check_e2_ope():
    exp = {"cmp2": (0.469, 0.087, 0.0234), "cmp1": (0.105, 0.0035, 0.070)}
    for tb, (one, sens, ood) in exp.items():
        j = _load(f"e2_ope_{tb}.json")
        if j is None:
            _add(f"E2 ope {tb}", None, "json missing"); continue
        ac = j["action_conditional"]
        ok = (near(ac["one_step_rr_mae"], one, TOL_OPE)
              and near(ac["action_sensitivity_per_unit"], sens, TOL_OPE)
              and near(j["ood_action"]["SARC"]["mean"], ood, TOL_OPE))
        _add(f"E2 ope {tb}", ok,
             f"1-step={ac['one_step_rr_mae']:.3f}(exp {one}) "
             f"sens={ac['action_sensitivity_per_unit']:.4f}(exp {sens}) "
             f"OOD_SARC={j['ood_action']['SARC']['mean']:.4f}(exp {ood})")


def check_e4():
    j = _load("e4_nu_cmp2_box1.json")
    if j is None:
        _add("E4 NU cmp2", None, "json missing"); return
    s, d, k = j["SARC"]["NU"], j["D-EWMA"]["NU"], j["Kalman"]["NU"]
    ok = near(s, 0.3425, 1e-2) and s < d and s < k
    _add("E4 NU cmp2", ok, f"SARC={s:.4f} lowest (D-EWMA={d:.4f}, Kalman={k:.4f})")


ABLATION = {
    "E5a cmp2 (SARC-enc <)":       {"MAE|no-drift": "ns", "MAE|raw-wear": "ns",
                                    "CE|no-drift": "***", "CE|raw-wear": "***"},
    "E5a cmp1 (SARC-enc <)":       {"MAE|no-drift": "ns", "MAE|raw-wear": "ns",
                                    "CE|no-drift": "ns", "CE|raw-wear": "***"},
    "E5a sim_mild (SARC-enc <)":   {"MAE|no-drift": "***", "MAE|raw-wear": "ns",
                                    "CE|no-drift": "***", "CE|raw-wear": "ns"},
    "E5a sim_medium (SARC-enc <)": {"MAE|no-drift": "***", "MAE|raw-wear": "ns",
                                    "CE|no-drift": "***", "CE|raw-wear": "ns"},
}


def check_ablation():
    """Significance markers reported in the Drift Encoder ablation table."""
    j = _load("stats_all.json")
    if j is None:
        _add("ablation markers", None, "stats json missing"); return
    for label, exp in ABLATION.items():
        d = j.get(label)
        if d is None:
            _add(f"stats {label}", None, "label missing"); continue
        bad = [k for k, s in exp.items() if d.get(k, {}).get("sig") != s]
        _add(f"stats {label}", not bad,
             "markers as reported" if not bad else f"MISMATCH {bad}")


def main():
    check_tables(); check_e2_ope(); check_e4(); check_ablation()
    print(f"\n{'='*78}\nREPRODUCTION VERIFICATION\n{'='*78}")
    w = max(len(n) for n, _, _ in rows)
    npass = nfail = nskip = 0
    for name, status, detail in rows:
        print(f"  [{status:4}] {name:<{w}}  {detail}")
        npass += status == "PASS"; nfail += status == "FAIL"; nskip += status == "SKIP"
    print(f"{'-'*78}\n  {npass} PASS / {nfail} FAIL / {nskip} SKIP")
    print("  VERDICT:", "ALL CHECKS PASS" if nfail == 0 else f"{nfail} FAILURE(S) -- investigate")


if __name__ == "__main__":
    main()
