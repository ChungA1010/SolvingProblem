# Three-paper missing-method completion v3

Frozen before training. This is a documented reconstruction, not the authors' code.
No production/API model is replaced by this experiment.

## Shared protocol

- Same official PHM Train/Validation/Test cohorts and raw-file SHA256 hashes as reconstruction v2.
- Previously examined Validation and Test remain development benchmarks, not fresh independent tests.
- Fit preprocessing, histories, feature selection and GA fitness using Train labels only. P1 chooses feature count/FFT convention using Validation, as the paper uses Validation for feature-count comparison. P2 tuning and P3 GA use Train CV only. Seal all choices and fitted models before loading Test labels.
- P1 removes the same four Stage A extreme training records (1,977 remain). P2 compares 1,977 versus all 1,981; P3 uses all 1,981 because its text does not specify those four exclusions.
- Report MSE, RMSE, MAE, R², RE, and both literal exp S-score and exp-minus-one interpretation; exponential overflow is reported, not clipped. P2 and P3 publish MSE; those numbers must not be compared numerically with RMSE. P1's primary comparison uses RMSE.
- Seed 20260917. All raw feature extraction is label-free. Preserve every existing file under runs/ by SHA256. No Test-based revisions or production promotion.

## Paper 1: complete 85-feature selection

- 19 signals × population standard deviation / third central moment / skewness / Pearson kurtosis = 76. Validate the Appendix's 35 values against the previous implementation.
- Three rotation signals × maximum Fourier amplitude / spectral centroid / spectral kurtosis = 9. Two explicit, unpublished FFT conventions: `rows_dc` uses timestamp/chamber-sorted raw rows, sample spacing 1 and retains DC; `time_ac` averages equal timestamps, splits gaps greater than 60 source-time units, interpolates only within each segment at its median positive interval, removes the mean, and duration-averages segment summaries. Frequencies are cycles per row or source-time unit, not calibrated Hz. Spectrum amplitude is abs(rfft)/N (no doubled one-sided bins); centroid and standardized fourth central moment use power weights; zero energy returns zeros. No long-gap interpolation.
- RF ranking uses 100 bootstrap trees, floor(85/3) attributes, minimum split 5; per-tree OOB permutation MSE increases divided by their sample standard deviation. This is an explicit assumption about unspecified importance normalization. Constant/unused features get zero; negative importance is retained; ties use catalog order. The paper's 0.65 illustration is not imposed on this differently normalized ranking.
- Rank on Train separately for each Stage, FFT convention and repeat. Compare k={5,20,35,50,65,85}, RF/GBT/ERT with 100 trees, for 20 repeats. Stage-specific selection is a declared implementation choice; the paper's global Fig.5 is not claimed identical.
- RF uses floor(k/3) attributes and minimum split 5; GBT learning rate .1 and max leaves 30; ERT attributes 3 and minimum split 3. Other sklearn defaults are recorded by source/environment snapshots.
- Per Stage choose one common FFT/k for all three base learners by their mean Validation MSE across 20 repeats (tie: fewer features, convention name). Preserve all candidates and rankings; report learned-top35 overlap with Appendix35. Computational time is recorded but is not a portable selection metric. This is not the author's subjective accuracy/time tradeoff.
- Refit the selected pipeline, including feature selection inside five OOF folds for stacking. Keep v2's already-frozen CART/ELM meta settings; use seed 20260917. This isolates the changed feature pipeline; meta settings are not newly optimized. Publish seed-0 model artifacts and repeat base-learning scores; stack repeats are outside this bounded experiment.

## Paper 2: explicit assumptions and sensitivity

- Retain published 11 lag + 10 neighbor + 104 physical features, three conditions, t>1.5 or OOB>0.15 selection, 20 Monte Carlo CV repetitions, and weights proportional to (mean MSE + 3 sample SD)^(-3).
- Our existing assumptions remain disclosed: 80/20 wafer-grouped splits, 32-tree OOB estimator, rank-aware t calculation, at least 10/20 votes, missing-history imputation, Euclidean usage distance and sorting/tie rules. The paper does not fully specify these. Ordinary LR still uses its library's finite-precision rank handling; only our additional rcond=1e-6 truncation is removed.
- Six arms: (1) cleaned 1,977, raw distance, prior-start lag, truncated OLS control; (2) same with ordinary LR; (3) all 1,981 with ordinary LR; (4) all 1,981 with completed-before-start lag; (5) arm4 plus completed-before-start neighbors; (6) all 1,981, standardized distance, prior-start lag. Neighbors in other arms are retrospective Train-only and may be later than the query.
- A seventh `tuned` arm shares arm3's folds/features but chooses SVR C={1,10,100}, gamma={scale,.01}, epsilon=.1; bagging trees={100,300}, leaf={1,5}, all attributes. Choose each component by minimum Train-CV mean+3 SD MSE; tie by identifier. These are sensitivity candidates, not recovered author parameters. Weight estimates for tuned components reuse tuning CV and are optimistic development estimates, not nested generalization estimates.
- Save fold membership, predictions, t/OOB scores, votes, weights and hyperparameter trials. Never silently discard divergent finite LR predictions. Report all seven arms; choose none by Test.

## Paper 3: phase sensitivity and actual genetic search

- Fine route 123 uses the complete primary chamber, splitting integration at >60 gaps, consistent with the text's merged preparation/polishing/end treatment. Rough route 456 uses primary-chamber center-pressure plateau plus pre-rise slurry-A and positive wafer or table rotation, selecting the longest contiguous valid segment and never spanning >60 gaps.
- Predeclared thresholds `(pressure fraction of positive q90, slurry ceiling / positive plateau median)` are loose (.85,1.3), nominal (.90,1.2), strict (.95,1.1). If fewer than two consecutive valid observations, select the longest primary segment and flag fallback. This is a transparent numerical interpretation of Fig.III, not author thresholds.
- Rough pool: six initial usage variables + wafer ID/stage/start/CPP/first + effective duration + six pressures × mean/median/integral + three rotations × mean/median/integral + three slurry flows × mean/median = **45**. Fine pool: six initial usages + five metadata + duration = **12**. All names/formulas are published. The paper claims 47 rough candidates without enumerating all; two unspecified features are not invented to force a count.
- Keep original label-free machine/route CPP rule with gap >500 and all-cohort unlabeled context, inherited from v2. CPP matching is transductive; correction uses only Train residuals. Report no correction and mean training-residual subtraction; unseen CPP correction is zero. CPP definition remains an assumption (the author's CPP count is not reconstructed).
- Train-only GroupKFold(3) by wafer; fitness is pooled uncorrected MSE. GA jointly searches a nonempty feature bitmask and model family {decision tree, KNN, SVR, ensemble neural network, RF}. Population 12; 8 evaluated generations; two elites; tournament size 3; uniform crossover probability .8; each bit mutation 1/p; family mutation .1; deterministic seed; cached unique chromosomes. Include all-feature seeds for each family and the paper's named final subset as an RF seed. Log every evaluated mask and every generation, including convergence warnings/failures.
- Fixed explicit estimator assumptions: tree minimum leaf 5; KNN k=5 distance weighting; SVR C=10, epsilon=.1, gamma=scale; RF100 all attributes/minimum leaf1; ensembleNN five bootstrap MLPs with 16 tanh units, Adam max_iter500, learning rate .001. Scale features and neural targets within each fold; no early stopping split. These are not author settings. No global optimum claim.
- Fine runs one search because phase variants are identical. Rough runs three searches; choose phase/mask/family by Train-CV fitness, tie phase name. GA-CV fitness is optimistically selected, not an unbiased result. Publish final models, masks, curve logs, phase-QC, and fixed published-subset RF controls (legacy vs improved phase, both on 1,981 rows).

## Remaining limits after execution

Full feature selection, bounded GA and sensitivity analysis can be implemented and run. Undisclosed FFT/importance conventions, exact P2 split/history/hyperparameters, complete P3 47-feature list, GA settings and numeric phase rules cannot be recovered from these PDFs. This run must retain the label **partial paper reconstruction with explicit assumptions**, even if its error becomes smaller.
