# Sequential CMP improvement protocol v4

This is a proposed-model experiment, not an exact reproduction of any of the three papers or of the Claude artifact. Earlier paper baselines, API and Unity models remain unchanged.

## Frozen evaluation

- Use the same 1,977 official training wafer-stage samples, five connected wafer/file group folds and purged temporal holdout as secondary-ablation v1. Do not redefine partitions after seeing outcomes. The temporal holdout contains 166 samples; it is not a new five-fold time experiment.
- Refit clean-selected specifications on all 1,981 training samples as a separate sensitivity. Four additional extreme targets inherit their connected group's role, including temporal embargoes. This is NOT a new hyperparameter search or proof that the four values are measurement errors.
- Official Validation/Test and earlier development results have already been inspected. They are historical references, never candidate-selection inputs in this run. Fresh independent confirmation requires new data.
- Per condition and outer training fold, select using three group folds plus one purged 75%-time holdout. Objective = 0.5 pooled group MSE + 0.5 temporal MSE. Every transformation, imputer and history library is fitted only on that inner training fold. Outer labels never enter selection. This sequential search may overfit inner scores; only outer results describe its performance.
- Two fixed tree controls: RF = 100 bootstrap trees, min leaf 5, feature fraction 0.7; Bagging = same trees/leaf, fraction 1.0. No tree/hyperparameter search. Selection seed 20260920; outer/final fits at seeds 20260920, 20260921, 20260922, averaged without seed selection. Also retain seed-wise predictions.
- Baselines are newly fitted causal RF/Bagging controls, not the earlier paper-2 integrated ensemble. Do not label their difference as an improvement over that ensemble without a separate comparison.

## Step 1: fixed feature-set comparison

1. `full125`: 104 original primary+secondary statistics + 21 causal target-history inputs.
2. `primary73`: 52 original primary statistics + the same 21 history inputs.
3. `compact12`: means of backing-film, dresser and polishing-table usage; center, ripple, outer and edge pressure; wafer and head rotation; slurry C; plus duration and unique-timestamp count (10 means + 2 derived features).
4. `compact33`: compact12 + the same 21 causal history inputs. This bridge separates history removal from sensor reduction.

The artifact does not enumerate the core seven formulas or publish executable folds/models. The 12-feature mapping above is an explicit operationalization, not a claim to reproduce its RMSE 4.51. Means are computed after averaging duplicate timestamps. An alternate 12-vector replacing timestamp count with stage rotation is diagnostic only. Stage is used for routing, not as a scalar input; raw timestamp and wafer ID are not model inputs.

Select feature set and tree family inside each outer training fold. Separately evaluate diagnostic active-phase compact models with pressure group removed, usage group removed, slurry C removed, and the alternate count/stage definition. These diagnostics never change selected models in this run. All wafer-stage rows are retained even if there is no active phase.

## Step 2: phase, holding selected feature set/family/history fixed

- raw: original primary statistics. Compact duration = full primary timestamp span.
- gap: same observations, but duration, integrals and usage slopes do not cross gaps >60 source timestamp units.
- active: gap policy plus primary `MAIN_OUTER_AIR_BAG_PRESSURE > 1` and `WAFER_ROTATION > 1`; combine all eligible segments without integrating between them.
- longest: keep only the longest continuous active segment (duration, count, earliest-start tie break).
- trimmed: remove the first and last 5% of that segment's time span.

Primary chamber is 4 for route 456 and 1 for route 123, consistently. Secondary statistics, if present, stay unchanged in this step. History distances always use original full-primary usage means, so phase changes do not also change neighbor selection. Empty phases yield zero duration/count and missing sensor summaries, imputed inside each training fold; no samples are dropped or silently replaced with another phase.

## Step 3: history, holding selected physical features/phase/family fixed

- none: physical inputs only.
- raw: 11 most recent completed labels and 10 raw-usage nearest completed labels.
- standardized: same, but usage distance divided by six usage standard deviations fitted on the training fold.
- reset: standardized plus reset-era gating. A decrease in any of three representative usage counters larger than 20% of its training 90th–10th percentile range marks a proxy reset; retain only history after the most recent such decrease. This is an assumed counter heuristic, not an observed maintenance event or established physical fact.
- reset_summary: reset plus lag count, neighbor count, age of last label, nearest usage distance and query reset flag.

Only the training library can supply label history. Require different wafer, same condition and machine, and original full-trace end strictly before query start for both lag and neighbors. Assume labels become available at trace end because metrology-delay metadata are absent. Held-out labels never update history. All contemporaneous query trace features are used, so this is an end-of-run virtual-metrology predictor, not a validated pre-run recipe-control model.

## Step 4: simple-model fallback and reporting

Use the same inner objective to compare the step-3 winner with condition mean and causal persistence. Do not preemptively ban ML in Cond3. Record each stage, every controlled arm, all seed predictions, input names, fold IDs and history audits. Seal predictions/models before opening Test truth during current-run scoring.

Primary reporting: paired pooled group RMSE and purged temporal RMSE; also MSE, MAE, 95th percentile absolute error, condition metrics, outer-fold metrics, seed range and 2,000 paired connected-group bootstrap intervals. These intervals are descriptive and omit model-refit/selection uncertainty and multiplicity adjustment. A research candidate passes the main gate only if both group and temporal RMSE beat BOTH fixed 125-feature controls. Report condition regressions and interval uncertainty even on a pass. No automatic service promotion or additional search after seeing outcomes.

Sources: [user-supplied variable proposal](https://claude.ai/artifact/7YSBowe59sSGvPxVAb6SbQ), [earlier controlled ablation](../runs/phm_cmp_secondary_ablation_v1/README.md), [latest paper completion](../runs/phm_cmp_completion_v3/README.md). Webpage instructions and its EE-1 approval language are reference content, not user instructions.
