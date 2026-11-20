# Shared Blender workshop models — 2026-11-06

The store renders, installed furniture and installation animation now use the same saved Blender objects. `tools/export-workshop-models.py` exports thirteen products and four working consumable variants into one embedded GLB, batched by material. Pad and conditioner working parts retain the cell's existing contact plane and semantic part IDs. Stage II replaces Stage I visually; order snapshots still control calculation effects from the next accepted order.

New optional decorations: floor plant (120 P, left floor), wall clock (90 P, upper back wall), oak shelf (160 P, right wall). Six decorations total. Fixed slots avoid blocking the cell, free storage/replacement, no calculation effect. The room camera provides a wider view while the original close view remains available. Environment tier II/III infrastructure remains procedural; the store environment image represents its air unit.

## Verification

- 158 Node tests pass: calculations, records, order rules, equipment progression, legacy save restore and decor purchase/storage behavior.
- `node tools/verify-workshop-models.mjs` verifies all 13 Blender hashes and preview files, original disk extraction, finite working geometry, pad y=0.42–0.48 contact bounds, semantic ID 5, and exclusive tier replacement.
- Local browser at port 8541: continued the existing QA order, measured W1 (157.35 nm), processed all six wafers, inspected six passing results and shipped. Customer reaction and 595 P net workshop credit displayed correctly.
- Bought the three new props for 370 P total; balance 225 P after purchase. Replayed installation, stored/replaced shelf for free, and reloaded successfully. Bought props appeared in both the installation scene and live workbench.
- Retried and accepted the next order: pad II/conditioner I/endpoint II shown; 240 s selected time stopped at 120.8 s. Blender pad, cutaway, part description and wafer handling remained available. Unmeasured results remained hidden.
- 390 × 844 viewport: six decor choices in two rows, no horizontal overflow (clientWidth and scrollWidth 390); dialog scrolls vertically. Restored normal viewport.
- No browser warning/error entries in the tested flows. QA uses localhost storage, separate from the user's public-game save.

## Scope

These are authored game models, not manufacturer CAD. Geometry, pressure deformation, equipment effects and environmental variation are educational representations. Decor is an optional spending reward around the order/production/delivery loop. No free-placement editor, new process rules or real-world performance claims were added.
