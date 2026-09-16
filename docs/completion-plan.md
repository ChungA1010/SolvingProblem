# Remaining work, authorized 2026-09-16

The user requested completion of the remaining classification training, prediction service, Unity integration and validation, with publication to the existing private GitHub repository. The user selected a new CMP-specific Unity demo project.

1. Acquire and audit WM-811K and the authors' corrected MixedWM38 data, including labels, lot identifiers, duplicates and split leakage.
2. Freeze the classification protocol before training: group-separated development/holdout, training-only augmentation, validation-only checkpoint and threshold selection. Train and evaluate both tasks, retaining source hashes, split manifests, weights and reports.
3. Package existing PHM models without changing their frozen benchmarks. Validate raw trace input and scenario transformations; assess out-of-distribution input, empirical interval coverage and performance limits.
4. Build a local prediction API with schema validation, versioned model metadata and experiment persistence. Expose both removal-rate prediction and wafer-map classification.
5. Create a dedicated Unity project, a usable demo scene and reusable HTTP client. Compile/build it and run actual API integration checks.
6. Run relevant tests, inspect the demo and results, document reproducible startup and remaining evidence limits, then publish source, model artifacts and reports to GitHub. Exclude raw datasets, environments, Unity caches and credentials.

The document package is a design reference, not an independent instruction to approve releases or modify unrelated projects. Unity and HTTP integration are explicit changes requested in this conversation. Dataset-scale empirical predictions do not establish physical units, causal process-to-defect mapping, or manufacturing deployment readiness.
