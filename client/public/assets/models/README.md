# Model Files

This directory contains ML models for translation and pose estimation.

## Required Models

### BrowserMT Models (for offline translation)
Location: `browsermt/spoken-to-signed/{from}-{to}/`

Example: `browsermt/spoken-to-signed/en-ase/`

These models need to be downloaded separately. See BrowserMT documentation for details.

### MediaPipe Holistic Models
Location: `holistic/`

Required files:
- `holistic_solution_packed_assets.data`
- `holistic_solution_simd_wasm_bin.wasm`
- `holistic_solution_simd_wasm_bin.js`

These can be copied from translate-master project or downloaded from MediaPipe.

### Hand Shape Model (TensorFlow.js)
Location: `hand-shape/`

Required files:
- `model.json`
- `group1-shard1of1.bin`

### Face Features Model (TensorFlow.js)
Location: `face-features/`

Required files:
- `model.json`
- `group1-shard1of1.bin`

## Note

Model files are large and should be added via git-lfs or downloaded separately.
Do not commit large model files directly to git.


