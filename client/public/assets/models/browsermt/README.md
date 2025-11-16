# BrowserMT Model Files

## Model Status

### ✅ Available Models

1. **Generic Model (spoken-signed)**
   - Location: `spoken-to-signed/spoken-signed/`
   - Files:
     - `model.spokensigned.intgemm.alphas.bin` (10.40 MB)
     - `lex.50.50.spokensigned.s2t.bin` (0.37 MB)
     - `vocab.spokensigned.spm` (0.35 MB)
   - Usage: Works as fallback for any language pair with format `$en $ase Hello world`

### ❌ Missing Models

1. **English to ASL (en-ase)**
   - Location: `spoken-to-signed/en-ase/`
   - Status: Not available in Firebase Storage
   - Note: This model needs to be trained or requested from sign.mt team

## Download Scripts

### Download Generic Model
```bash
cd client
node scripts/download-generic-model.js
```

### Download Specific Model (when available)
```bash
cd client
npm run download-models
```

### Verify Models
```bash
cd client
npm run verify-models
```

## How It Works

The translation service will:
1. First try to use the specific model (e.g., en-ase)
2. If that fails, fall back to the generic model with language tags
3. Format for generic model: `$en $ase Hello world`

## Getting en-ase Model

To get the en-ase model, you can:
1. Contact sign.mt team: https://github.com/sign/translate
2. Train your own model using sign.mt training pipeline
3. Check Firebase Storage console: https://console.firebase.google.com/project/sign-mt/storage


