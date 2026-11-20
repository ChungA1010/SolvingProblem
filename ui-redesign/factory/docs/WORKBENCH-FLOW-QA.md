# Workbench focus and wafer handling — 2026-11-06

Implemented a reversible focus view with the order target, budget, help and order sheet always available. Desktop layouts fit the apparatus and run controls at 1440×900 and 1366×768. Mobile 390×844 uses a scrolling station and sticky compact header. View transitions reset the station's scroll position.

The Three.js workshop now has six supply slots, six completed slots, a transfer fork, and an illustrative optical metrology bridge. The flow is supply → existing polishing animation → completed tray. Measurement moves the current wafer to the instrument, scans, and returns it before revealing the result. Transport uses only public counts and presentation progress; it receives no hidden removal or quality values.

Calculation, domain transitions, archive format and action costs remain in their existing modules. A measurement is committed and saved once at initiation; UI results and the current log row remain masked during its animation. Skip, replay, visibility changes, reduced motion and reload do not dispatch a second processing or measurement event. Refresh during measurement restores the paid result immediately.

Validation:
- 131 Node tests passed, including cancellation, replacement, repeated skip and reduced-motion transport cases.
- Browser: six-wafer order, two paid measurements, third measurement locked, mandatory inspection, CSV download, settlement (690 P), customer satisfaction and next-order unlock.
- Second order: maintenance + measurement shared the two actions; balance restored as 65 P after refreshing during measurement.
- Browser: invalid pressure rejected, replay preserved results/balance, focus exit/re-entry, order dialog, mobile scroll reset and horizontal overflow checks.
- Existing polishing contact phase rendered; no browser console errors/warnings in the tested game flow.

The equipment transport, scan beam and geometry are explanatory visuals. Measurement exposes the educational game's computed value; it is not a physical sensor or validated process model.
