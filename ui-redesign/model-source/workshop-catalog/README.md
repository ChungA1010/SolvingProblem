# Workshop catalog models

Original Blender 4.5.15 LTS models made for the game. No downloaded models or generated raster images are used. The catalog has thirteen transparent 800 × 680 Cycles renders:

- pad-1 / pad-2: grooved polishing pads and storage cartridge
- care-1 / care-2: diamond conditioning disk, service case and replacement disk
- endpoint-1 / endpoint-2: endpoint instrument, sensor lead and signal module
- task_lamp, storage_cabinet, note_board: the three existing decorative objects
- environment: representative air-management unit for the retained environment category
- floor_plant, wall_clock, wall_shelf: floor and wall decorations

The `.blend` files retain geometry, materials, camera and lighting. Rendered catalog images are in `dist/media/workshop-catalog/`. Run `blender --background --python tools/build-shop-assets.py` from the project root to regenerate all files; append `-- task_lamp` to regenerate only the lamp.

Run `blender --background --python tools/export-workshop-models.py` to export the same saved source objects to `dist/models/workshop-catalog.glb`. Each product is batched by material. The manifest records source SHA-256 hashes. The live workbench and installation animation both load this GLB. Working pad and conditioner parts are extracted from the same models and mounted on the cell's original contact coordinates; pad deformation and semantic part picking remain supported. Tier II replaces Tier I visually. Environment tier II/III room infrastructure remains procedural.

Run `npm run build:scene` after export. `node tools/verify-workshop-models.mjs` verifies source/preview consistency, contact bounds, finite positions, part IDs, and tier switching. These are game models, not manufacturer CAD or accurate process geometry. Game calculations and saved order snapshots are independent of asset geometry. Decorations occupy fixed safe slots and can be stored or placed again for free.
